import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'

/**
 * Budget Reset Service
 * Handles monthly budget resets with carry-over functionality
 */
class BudgetResetService {
  /**
   * Get budget reset settings for user
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async getBudgetResetSettings() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('preference_type', 'budget_reset')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error getting budget reset settings:', error)
        return { data: null, error: 'Failed to load budget reset settings' }
      }

      // Return default settings if none exist
      const defaultSettings = {
        auto_reset_enabled: false,
        reset_day: 1, // 1st of each month
        carry_over_enabled: true,
        carry_over_categories: ['Entertainment', 'Shopping', 'Dining Out'],
        max_carry_over_percentage: 50, // Maximum 50% can be carried over
        notification_enabled: true,
        reset_history: []
      }

      return {
        data: data ? data.preference_data : defaultSettings,
        error: null
      }

    } catch (err) {
      console.error('Error getting budget reset settings:', err)
      return { data: null, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Save budget reset settings
   * @param {Object} settings
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async saveBudgetResetSettings(settings) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert([{
          user_id: user.id,
          preference_type: 'budget_reset',
          preference_data: settings,
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('Database error saving budget reset settings:', error)
        return { data: null, error: 'Failed to save budget reset settings' }
      }

      return { data: settings, error: null }

    } catch (err) {
      console.error('Error saving budget reset settings:', err)
      return { data: null, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Calculate unspent amounts for carry-over
   * @param {number} month
   * @param {number} year
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async calculateUnspentAmounts(month, year) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      // Get budgets for the specified month
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)

      if (!budgets || budgets.length === 0) {
        return { data: [], error: null }
      }

      // Get expenses for the specified month
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)

      // Calculate unspent amounts by category
      const unspentAmounts = budgets.map(budget => {
        const categoryExpenses = expenses ? expenses.filter(expense => 
          expense.category === budget.category
        ) : []

        const totalSpent = categoryExpenses.reduce((sum, expense) => 
          sum + parseFloat(expense.amount), 0
        )

        const unspent = Math.max(0, budget.monthly_limit - totalSpent)
        const spentPercentage = budget.monthly_limit > 0 
          ? (totalSpent / budget.monthly_limit) * 100 
          : 0

        return {
          category: budget.category,
          budget_limit: budget.monthly_limit,
          total_spent: totalSpent,
          unspent_amount: unspent,
          spent_percentage: Math.round(spentPercentage * 10) / 10,
          eligible_for_carryover: unspent > 0 && spentPercentage < 100
        }
      })

      return { data: unspentAmounts, error: null }

    } catch (err) {
      console.error('Error calculating unspent amounts:', err)
      return { data: null, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Execute monthly budget reset with carry-over
   * @param {Object} options
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async executeBudgetReset(options = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const {
        source_month,
        source_year,
        target_month,
        target_year,
        carry_over_categories = [],
        max_carry_over_percentage = 50
      } = options

      // Get current budget reset settings
      const { data: settings } = await this.getBudgetResetSettings()
      if (!settings) {
        return { data: null, error: 'Could not load budget reset settings' }
      }

      // Calculate unspent amounts from source month
      const { data: unspentData, error: unspentError } = await this.calculateUnspentAmounts(
        source_month, source_year
      )

      if (unspentError) {
        return { data: null, error: unspentError }
      }

      // Get existing budgets for target month
      const { data: existingBudgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', target_month)
        .eq('year', target_year)

      // Get source month budgets to copy
      const { data: sourceBudgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', source_month)
        .eq('year', source_year)

      if (!sourceBudgets || sourceBudgets.length === 0) {
        return { data: null, error: 'No source budgets found to reset from' }
      }

      const resetResults = {
        copied_budgets: 0,
        carried_over_amount: 0,
        categories_processed: [],
        errors: []
      }

      // Process each source budget
      for (const sourceBudget of sourceBudgets) {
        try {
          const unspentInfo = unspentData.find(u => u.category === sourceBudget.category)
          const shouldCarryOver = carry_over_categories.includes(sourceBudget.category)
          
          let newBudgetLimit = sourceBudget.monthly_limit
          let carriedOverAmount = 0

          // Calculate carry-over if enabled and eligible
          if (shouldCarryOver && unspentInfo && unspentInfo.eligible_for_carryover) {
            const maxCarryOver = (sourceBudget.monthly_limit * max_carry_over_percentage) / 100
            carriedOverAmount = Math.min(unspentInfo.unspent_amount, maxCarryOver)
            newBudgetLimit = sourceBudget.monthly_limit + carriedOverAmount
          }

          // Check if budget already exists for target month
          const existingBudget = existingBudgets?.find(b => b.category === sourceBudget.category)

          const budgetData = {
            user_id: user.id,
            category: sourceBudget.category,
            monthly_limit: newBudgetLimit,
            month: target_month,
            year: target_year,
            category_type: sourceBudget.category_type,
            recurrence_type: sourceBudget.recurrence_type,
            workdays_per_month: sourceBudget.workdays_per_month,
            category_group: sourceBudget.category_group,
            auto_calculate: sourceBudget.auto_calculate,
            created_at: new Date().toISOString()
          }

          if (existingBudget) {
            // Update existing budget
            await supabase
              .from('budgets')
              .update(budgetData)
              .eq('id', existingBudget.id)
          } else {
            // Insert new budget
            await supabase
              .from('budgets')
              .insert([budgetData])
          }

          resetResults.copied_budgets++
          resetResults.carried_over_amount += carriedOverAmount
          resetResults.categories_processed.push({
            category: sourceBudget.category,
            original_limit: sourceBudget.monthly_limit,
            new_limit: newBudgetLimit,
            carried_over: carriedOverAmount,
            unspent_from_previous: unspentInfo?.unspent_amount || 0
          })

        } catch (err) {
          console.error(`Error processing budget for ${sourceBudget.category}:`, err)
          resetResults.errors.push(`Failed to process ${sourceBudget.category}: ${err.message}`)
        }
      }

      // Record reset history
      const resetRecord = {
        reset_date: new Date().toISOString(),
        source_period: `${source_year}-${source_month.toString().padStart(2, '0')}`,
        target_period: `${target_year}-${target_month.toString().padStart(2, '0')}`,
        total_carried_over: resetResults.carried_over_amount,
        categories_count: resetResults.copied_budgets,
        carry_over_categories: carry_over_categories
      }

      // Update settings with new reset history
      const updatedHistory = [...(settings.reset_history || []), resetRecord].slice(-12) // Keep last 12 resets
      await this.saveBudgetResetSettings({
        ...settings,
        reset_history: updatedHistory
      })

      return {
        data: {
          ...resetResults,
          reset_record: resetRecord
        },
        error: resetResults.errors.length > 0 ? resetResults.errors.join('; ') : null
      }

    } catch (err) {
      console.error('Error executing budget reset:', err)
      return { data: null, error: 'Unexpected error during budget reset' }
    }
  }

  /**
   * Get reset history
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getResetHistory() {
    try {
      const { data: settings } = await this.getBudgetResetSettings()
      if (!settings) {
        return { data: [], error: null }
      }

      return { data: settings.reset_history || [], error: null }

    } catch (err) {
      console.error('Error getting reset history:', err)
      return { data: null, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Preview budget reset (dry run)
   * @param {Object} options
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async previewBudgetReset(options = {}) {
    try {
      const {
        source_month,
        source_year,
        carry_over_categories = [],
        max_carry_over_percentage = 50
      } = options

      // Get unspent amounts from source month
      const { data: unspentData, error: unspentError } = await this.calculateUnspentAmounts(
        source_month, source_year
      )

      if (unspentError) {
        return { data: null, error: unspentError }
      }

      const preview = {
        total_categories: unspentData.length,
        total_carry_over_amount: 0,
        categories_with_carryover: [],
        categories_without_carryover: []
      }

      unspentData.forEach(categoryData => {
        const shouldCarryOver = carry_over_categories.includes(categoryData.category)
        
        if (shouldCarryOver && categoryData.eligible_for_carryover) {
          const maxCarryOver = (categoryData.budget_limit * max_carry_over_percentage) / 100
          const carriedOverAmount = Math.min(categoryData.unspent_amount, maxCarryOver)
          
          preview.total_carry_over_amount += carriedOverAmount
          preview.categories_with_carryover.push({
            ...categoryData,
            carried_over_amount: carriedOverAmount,
            new_budget_limit: categoryData.budget_limit + carriedOverAmount
          })
        } else {
          preview.categories_without_carryover.push({
            ...categoryData,
            reason: !shouldCarryOver ? 'Not selected for carry-over' : 'No unspent amount'
          })
        }
      })

      return { data: preview, error: null }

    } catch (err) {
      console.error('Error previewing budget reset:', err)
      return { data: null, error: 'Unexpected error occurred' }
    }
  }
}

// Export singleton instance
export const budgetResetService = new BudgetResetService()
export default budgetResetService