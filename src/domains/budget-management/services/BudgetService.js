import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { 
  BudgetErrors, 
  BudgetValidation, 
  BudgetValidationEnhanced,
  BudgetStatus, 
  BudgetAlertThresholds,
  BudgetCategoryTypes,
  BudgetRecurrenceTypes 
} from 'src/domains/budget-management/types'

/**
 * Budget Service
 * Handles all budget-related operations
 */
class BudgetService {
  /**
   * Create a new budget
   * @param {import('../types').CreateBudgetRequest} budgetData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async createBudget(budgetData) {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: BudgetErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate budget data
      const validationError = this._validateBudgetData(budgetData)
      if (validationError) {
        return { data: null, error: validationError }
      }

      // Check if budget already exists for this category/month/year
      const { data: existingBudgets } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', budgetData.category)
        .eq('month', budgetData.month)
        .eq('year', budgetData.year)
        .single()

      if (existingBudgets) {
        return { data: null, error: BudgetErrors.BUDGET_ALREADY_EXISTS }
      }

      // Create budget
      const budgetRecord = {
        user_id: user.id,
        category: budgetData.category,
        monthly_limit: parseFloat(budgetData.monthly_limit),
        month: parseInt(budgetData.month),
        year: parseInt(budgetData.year),
        category_type: budgetData.category_type || BudgetCategoryTypes.FLEXIBLE,
        recurrence_type: budgetData.recurrence_type || BudgetRecurrenceTypes.RECURRING,
        auto_calculate: budgetData.auto_calculate || false
      }

      // Add optional fields if provided
      if (budgetData.workdays_per_month) {
        budgetRecord.workdays_per_month = parseInt(budgetData.workdays_per_month)
      }
      
      if (budgetData.category_group) {
        budgetRecord.category_group = budgetData.category_group
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert([budgetRecord])
        .select()
        .single()

      if (error) {
        return { data: null, error: `${BudgetErrors.BUDGET_CREATE_FAILED}: ${error.message}` }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: BudgetErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get user's budgets with optional filters
   * @param {import('../types').BudgetFilters} [filters={}]
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getBudgets(filters = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: [], error: BudgetErrors.USER_NOT_AUTHENTICATED }
      }

      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('category', { ascending: true })

      // Apply filters
      if (filters.month) {
        query = query.eq('month', parseInt(filters.month))
      }
      if (filters.year) {
        query = query.eq('year', parseInt(filters.year))
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err) {
      return { data: [], error: BudgetErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get budget progress with spending data
   * @param {import('../types').BudgetFilters} [filters={}]
   * @returns {Promise<{data: import('../types').BudgetProgress[], error: string|null}>}
   */
  async getBudgetProgress(filters = {}) {
    try {
      // Get budgets
      const { data: budgets, error: budgetError } = await this.getBudgets(filters)
      if (budgetError) {
        return { data: [], error: budgetError }
      }

      if (budgets.length === 0) {
        return { data: [], error: null }
      }

      // Get spending data for each budget
      const progressData = await Promise.all(
        budgets.map(async (budget) => {
          // Get expenses for this category/month/year
          const expenseFilters = {
            category: budget.category,
            month: budget.month,
            year: budget.year
          }

          const { data: expenses, error: expenseError } = await expenseService.getExpenses(expenseFilters)
          
          let spentAmount = 0
          if (!expenseError && expenses) {
            spentAmount = expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0)
          }

          const remainingAmount = budget.monthly_limit - spentAmount
          const percentageUsed = (spentAmount / budget.monthly_limit) * 100

          // Determine status
          let status = BudgetStatus.UNDER_BUDGET
          if (percentageUsed >= BudgetAlertThresholds.OVER_BUDGET_PERCENTAGE) {
            status = BudgetStatus.OVER_BUDGET
          } else if (percentageUsed >= BudgetAlertThresholds.NEAR_LIMIT_PERCENTAGE) {
            status = BudgetStatus.NEAR_LIMIT
          }

          return {
            budget_id: budget.id,
            category: budget.category,
            monthly_limit: budget.monthly_limit,
            spent_amount: spentAmount,
            remaining_amount: remainingAmount,
            percentage_used: Math.round(percentageUsed * 100) / 100,
            status,
            month: budget.month,
            year: budget.year
          }
        })
      )

      // Filter by status if requested
      let filteredData = progressData
      if (filters.status) {
        filteredData = progressData.filter(progress => progress.status === filters.status)
      }

      return { data: filteredData, error: null }
    } catch (err) {
      return { data: [], error: BudgetErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Update an existing budget
   * @param {string} budgetId
   * @param {import('../types').UpdateBudgetRequest} updates
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async updateBudget(budgetId, updates) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: BudgetErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate update data
      if (updates.monthly_limit && !BudgetValidation.validateAmount(updates.monthly_limit)) {
        return { data: null, error: BudgetErrors.INVALID_AMOUNT }
      }

      if (updates.category_type && !BudgetValidationEnhanced.validateCategoryType(updates.category_type)) {
        return { data: null, error: BudgetErrors.INVALID_BUDGET_DATA }
      }

      if (updates.recurrence_type && !BudgetValidationEnhanced.validateRecurrenceType(updates.recurrence_type)) {
        return { data: null, error: BudgetErrors.INVALID_BUDGET_DATA }
      }

      if (updates.workdays_per_month && !BudgetValidationEnhanced.validateWorkdaysPerMonth(updates.workdays_per_month)) {
        return { data: null, error: BudgetErrors.INVALID_BUDGET_DATA }
      }

      // Prepare update object
      const updateData = {}
      if (updates.monthly_limit) updateData.monthly_limit = parseFloat(updates.monthly_limit)
      if (updates.category_type) updateData.category_type = updates.category_type
      if (updates.recurrence_type) updateData.recurrence_type = updates.recurrence_type
      if (updates.workdays_per_month) updateData.workdays_per_month = parseInt(updates.workdays_per_month)
      if (updates.category_group !== undefined) updateData.category_group = updates.category_group
      if (updates.auto_calculate !== undefined) updateData.auto_calculate = updates.auto_calculate

      // Update budget
      const { data, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', budgetId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return { data: null, error: `${BudgetErrors.BUDGET_UPDATE_FAILED}: ${error.message}` }
      }

      if (!data) {
        return { data: null, error: BudgetErrors.BUDGET_NOT_FOUND }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: BudgetErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Delete a budget
   * @param {string} budgetId
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteBudget(budgetId) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { success: false, error: BudgetErrors.USER_NOT_AUTHENTICATED }
      }

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', user.id)

      if (error) {
        return { success: false, error: `${BudgetErrors.BUDGET_DELETE_FAILED}: ${error.message}` }
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: BudgetErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get budget alerts for current user
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getBudgetAlerts() {
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Get current month's budget progress
      const { data: progress, error } = await this.getBudgetProgress({
        month: currentMonth,
        year: currentYear
      })

      if (error) {
        return { data: [], error }
      }

      // Filter for alerts (near limit or over budget)
      const alerts = progress.filter(p => 
        p.status === BudgetStatus.NEAR_LIMIT || p.status === BudgetStatus.OVER_BUDGET
      ).map(p => ({
        ...p,
        alert_type: p.status,
        message: p.status === BudgetStatus.OVER_BUDGET 
          ? `You've exceeded your ${p.category} budget by £${Math.abs(p.remaining_amount).toFixed(2)}`
          : `You're at ${p.percentage_used}% of your ${p.category} budget`
      }))

      return { data: alerts, error: null }
    } catch (err) {
      return { data: [], error: BudgetErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Validate budget data
   * @private
   * @param {import('../types').CreateBudgetRequest} budgetData
   * @returns {string|null} Error message or null if valid
   */
  _validateBudgetData(budgetData) {
    if (!BudgetValidation.validateCategory(budgetData.category)) {
      return BudgetErrors.INVALID_BUDGET_DATA
    }

    if (!BudgetValidation.validateAmount(budgetData.monthly_limit)) {
      return BudgetErrors.INVALID_AMOUNT
    }

    if (!BudgetValidation.validateMonth(budgetData.month)) {
      return BudgetErrors.INVALID_MONTH
    }

    if (!BudgetValidation.validateYear(budgetData.year)) {
      return BudgetErrors.INVALID_YEAR
    }

    // Validate new advanced properties
    if (budgetData.category_type && !BudgetValidationEnhanced.validateCategoryType(budgetData.category_type)) {
      return BudgetErrors.INVALID_BUDGET_DATA
    }

    if (budgetData.recurrence_type && !BudgetValidationEnhanced.validateRecurrenceType(budgetData.recurrence_type)) {
      return BudgetErrors.INVALID_BUDGET_DATA
    }

    if (budgetData.workdays_per_month && !BudgetValidationEnhanced.validateWorkdaysPerMonth(budgetData.workdays_per_month)) {
      return BudgetErrors.INVALID_BUDGET_DATA
    }

    if (budgetData.category_group && !BudgetValidationEnhanced.validateCategoryGroup(budgetData.category_group)) {
      return BudgetErrors.INVALID_BUDGET_DATA
    }

    return null
  }
}

// Export singleton instance
export const budgetService = new BudgetService()
export default budgetService