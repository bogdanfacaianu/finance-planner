import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { budgetService } from 'src/domains/budget-management/services/BudgetService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { 
  FinancialOverviewErrors, 
  FinancialOverviewValidation,
  FinancialStatus 
} from 'src/domains/financial-overview/types'
import { BudgetCategoryTypes } from 'src/domains/budget-management/types'

/**
 * Financial Overview Service
 * Provides comprehensive financial insights and dashboard data
 */
class FinancialOverviewService {
  /**
   * Get comprehensive financial overview for a specific month/year
   * @param {import('../types').FinancialOverviewRequest} request
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async getFinancialOverview(request = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: FinancialOverviewErrors.USER_NOT_AUTHENTICATED }
      }

      // Default to current month/year if not specified
      const month = request.month || new Date().getMonth() + 1
      const year = request.year || new Date().getFullYear()

      // Validate inputs
      if (!FinancialOverviewValidation.validateMonth(month) || 
          !FinancialOverviewValidation.validateYear(year)) {
        return { data: null, error: FinancialOverviewErrors.INVALID_DATE_RANGE }
      }

      // Get parallel data
      const [
        budgetProgressResult,
        expensesResult,
        incomeResult,
        categoriesResult
      ] = await Promise.all([
        budgetService.getBudgetProgress({ month, year }),
        expenseService.getExpenses({ month, year }),
        this.getUserIncome(user.id),
        categoryService.getCategories({ is_active: true })
      ])

      if (budgetProgressResult.error) {
        return { data: null, error: budgetProgressResult.error }
      }

      if (expensesResult.error) {
        return { data: null, error: expensesResult.error }
      }

      const budgetProgress = budgetProgressResult.data || []
      const expenses = expensesResult.data || []
      const userIncome = incomeResult.data || []
      const categories = categoriesResult.data || []

      // Calculate overview metrics
      const overview = this._calculateFinancialOverview({
        budgetProgress,
        expenses,
        userIncome,
        categories,
        month,
        year
      })

      return { data: overview, error: null }

    } catch (err) {
      console.error('Financial overview error:', err)
      return { data: null, error: FinancialOverviewErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get category progress with enhanced insights
   * @param {import('../types').FinancialOverviewRequest} request
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getCategoryProgress(request = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: [], error: FinancialOverviewErrors.USER_NOT_AUTHENTICATED }
      }

      const month = request.month || new Date().getMonth() + 1
      const year = request.year || new Date().getFullYear()

      // Get budget progress and categories
      const [budgetProgressResult, categoriesResult] = await Promise.all([
        budgetService.getBudgetProgress({ month, year }),
        categoryService.getCategories({ is_active: true })
      ])

      if (budgetProgressResult.error) {
        return { data: [], error: budgetProgressResult.error }
      }

      const budgetProgress = budgetProgressResult.data || []
      const categories = categoriesResult.data || []

      // Enhance with category information
      const enhancedProgress = budgetProgress.map(progress => {
        const category = categories.find(cat => cat.name === progress.category)
        return {
          ...progress,
          color: category?.color || 'gray',
          category_group: progress.category_group || null
        }
      })

      return { data: enhancedProgress, error: null }

    } catch (err) {
      console.error('Category progress error:', err)
      return { data: [], error: FinancialOverviewErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get user income sources (placeholder - would need income table)
   * @param {string} userId
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getUserIncome(userId) {
    // For now, return a default income structure
    // In the future, this would query an income_sources table
    return {
      data: [
        {
          id: 'default',
          user_id: userId,
          source_name: 'Primary Income',
          monthly_amount: 3000, // Default £3000/month
          is_guaranteed: true
        }
      ],
      error: null
    }
  }

  /**
   * Get financial trends over time
   * @param {number} months - Number of months to look back
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getFinancialTrends(months = 6) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: [], error: FinancialOverviewErrors.USER_NOT_AUTHENTICATED }
      }

      const trends = []
      const currentDate = new Date()

      // Get data for each month
      for (let i = 0; i < months; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const { data: overview } = await this.getFinancialOverview({ month, year })
        if (overview) {
          trends.unshift({
            month,
            year,
            monthYear: `${year}-${month.toString().padStart(2, '0')}`,
            ...overview
          })
        }
      }

      return { data: trends, error: null }

    } catch (err) {
      console.error('Financial trends error:', err)
      return { data: [], error: FinancialOverviewErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Calculate comprehensive financial overview
   * @private
   */
  _calculateFinancialOverview({ budgetProgress, expenses, userIncome, categories, month, year }) {
    // Calculate totals
    const totalIncome = userIncome.reduce((sum, income) => sum + income.monthly_amount, 0)
    const totalBudgeted = budgetProgress.reduce((sum, budget) => sum + budget.monthly_limit, 0)
    const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)

    // Categorize costs
    const fixedCosts = budgetProgress
      .filter(budget => budget.category_type === BudgetCategoryTypes.FIXED)
      .reduce((sum, budget) => sum + budget.spent_amount, 0)

    const variableCosts = budgetProgress
      .filter(budget => budget.category_type !== BudgetCategoryTypes.FIXED)
      .reduce((sum, budget) => sum + budget.spent_amount, 0)

    // Calculate remaining buffer
    const remainingBuffer = totalIncome - totalSpent
    const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

    // Determine financial status
    const financialStatus = FinancialOverviewValidation.calculateFinancialStatus(
      budgetUtilization, 
      remainingBuffer
    )

    // Calculate category groups summary
    const categoryGroups = this._calculateCategoryGroups(budgetProgress)

    // Calculate savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0

    return {
      // Core metrics
      total_income: totalIncome,
      fixed_costs: fixedCosts,
      variable_costs: variableCosts,
      total_expenses: totalSpent,
      total_budgeted: totalBudgeted,
      remaining_buffer: remainingBuffer,
      
      // Percentages
      budget_utilization_percentage: Math.round(budgetUtilization * 100) / 100,
      savings_rate: Math.round(savingsRate * 100) / 100,
      
      // Status
      financial_status: financialStatus,
      
      // Period
      month,
      year,
      
      // Analytics
      category_groups: categoryGroups,
      
      // Counts
      total_categories: budgetProgress.length,
      over_budget_categories: budgetProgress.filter(b => b.status === 'over_budget').length,
      near_limit_categories: budgetProgress.filter(b => b.status === 'near_limit').length
    }
  }

  /**
   * Calculate category groups summary
   * @private
   */
  _calculateCategoryGroups(budgetProgress) {
    const groups = {}
    
    budgetProgress.forEach(budget => {
      const group = budget.category_group || 'Ungrouped'
      
      if (!groups[group]) {
        groups[group] = {
          name: group,
          total_budgeted: 0,
          total_spent: 0,
          categories: []
        }
      }
      
      groups[group].total_budgeted += budget.monthly_limit
      groups[group].total_spent += budget.spent_amount
      groups[group].categories.push(budget.category)
    })
    
    // Convert to array and add percentages
    return Object.values(groups).map(group => ({
      ...group,
      percentage_used: group.total_budgeted > 0 
        ? Math.round((group.total_spent / group.total_budgeted) * 100 * 100) / 100
        : 0,
      remaining: group.total_budgeted - group.total_spent
    }))
  }
}

// Export singleton instance
export const financialOverviewService = new FinancialOverviewService()
export default financialOverviewService