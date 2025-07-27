import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { recurringTransactionService } from 'src/domains/recurring-transactions/services/RecurringTransactionService'
import { 
  AlertTypes,
  AlertSeverity,
  AlertStatus,
  AlertTemplates,
  AlertValidation,
  AlertErrors,
  BudgetThresholds,
  AlertHelpers,
  DefaultAlertPreferences
} from 'src/domains/alerts-notifications/types'

/**
 * Alert Service
 * Handles alert generation, management, and notifications
 */
class AlertService {
  /**
   * Get all alerts for current user
   * @param {Object} filters
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getAlerts(filters = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      let query = supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.alert_type) {
        query = query.eq('alert_type', filters.alert_type)
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database error fetching alerts:', error)
        return { data: null, error: AlertErrors.DATABASE_ERROR }
      }

      return { data: data || [], error: null }

    } catch (err) {
      console.error('Error fetching alerts:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Create a new alert
   * @param {Object} alertData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async createAlert(alertData) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate alert data
      const validation = AlertValidation.validateAlert(alertData)
      if (!validation.valid) {
        return { data: null, error: validation.errors.join(', ') }
      }

      // Prepare alert record
      const alertRecord = {
        user_id: user.id,
        alert_type: alertData.alert_type,
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity,
        status: AlertStatus.ACTIVE,
        trigger_type: alertData.trigger_type || 'manual',
        trigger_data: alertData.trigger_data || {},
        channels: alertData.channels || ['in_app'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert([alertRecord])
        .select()
        .single()

      if (error) {
        console.error('Database error creating alert:', error)
        return { data: null, error: AlertErrors.DATABASE_ERROR }
      }

      return { data, error: null }

    } catch (err) {
      console.error('Error creating alert:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Update alert status
   * @param {string} alertId
   * @param {string} status
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async updateAlertStatus(alertId, status) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      const updates = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === AlertStatus.DISMISSED) {
        updates.dismissed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', alertId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error updating alert:', error)
        return { data: null, error: AlertErrors.DATABASE_ERROR }
      }

      if (!data) {
        return { data: null, error: AlertErrors.ALERT_NOT_FOUND }
      }

      return { data, error: null }

    } catch (err) {
      console.error('Error updating alert:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Dismiss an alert
   * @param {string} alertId
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async dismissAlert(alertId) {
    const result = await this.updateAlertStatus(alertId, AlertStatus.DISMISSED)
    return { data: !!result.data, error: result.error }
  }

  /**
   * Mark alert as read
   * @param {string} alertId
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async markAsRead(alertId) {
    const result = await this.updateAlertStatus(alertId, AlertStatus.READ)
    return { data: !!result.data, error: result.error }
  }

  /**
   * Check and generate budget warning alerts
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async checkBudgetWarnings() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Get current month budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      if (!budgets || budgets.length === 0) {
        return { data: [], error: null }
      }

      // Get current month expenses
      const { data: expenses } = await expenseService.getExpenses({
        month: currentMonth,
        year: currentYear
      })

      if (!expenses) {
        return { data: [], error: null }
      }

      const generatedAlerts = []

      // Check each budget category
      for (const budget of budgets) {
        const categoryExpenses = expenses.filter(expense => expense.category === budget.category)
        const totalSpent = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
        const percentage = AlertHelpers.getBudgetPercentage(totalSpent, budget.monthly_limit)

        // Check if we should generate an alert
        if (percentage >= BudgetThresholds.WARNING) {
          // Check if we already have an active alert for this category this month
          const { data: existingAlerts } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', user.id)
            .eq('alert_type', percentage >= BudgetThresholds.CRITICAL ? AlertTypes.BUDGET_EXCEEDED : AlertTypes.BUDGET_WARNING)
            .eq('status', AlertStatus.ACTIVE)
            .contains('trigger_data', { category: budget.category, month: currentMonth, year: currentYear })

          if (!existingAlerts || existingAlerts.length === 0) {
            // Generate new alert
            const alertType = percentage >= BudgetThresholds.CRITICAL ? AlertTypes.BUDGET_EXCEEDED : AlertTypes.BUDGET_WARNING
            const template = AlertTemplates[alertType]
            
            const alertData = {
              alert_type: alertType,
              title: percentage >= BudgetThresholds.CRITICAL 
                ? template.title(budget.category)
                : template.title(budget.category, percentage),
              message: percentage >= BudgetThresholds.CRITICAL
                ? template.message(budget.category, totalSpent, budget.monthly_limit, totalSpent - budget.monthly_limit)
                : template.message(budget.category, totalSpent, budget.monthly_limit, percentage),
              severity: template.severity,
              trigger_type: 'budget_threshold',
              trigger_data: {
                category: budget.category,
                spent: totalSpent,
                limit: budget.monthly_limit,
                percentage,
                month: currentMonth,
                year: currentYear
              },
              channels: ['in_app']
            }

            const result = await this.createAlert(alertData)
            if (result.data) {
              generatedAlerts.push(result.data)
            }
          }
        }
      }

      return { data: generatedAlerts, error: null }

    } catch (err) {
      console.error('Error checking budget warnings:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Generate monthly summary alert
   * @param {number} month
   * @param {number} year
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async generateMonthlySummary(month = null, year = null) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      const targetMonth = month || new Date().getMonth() + 1
      const targetYear = year || new Date().getFullYear()

      // Get month expenses
      const { data: expenses } = await expenseService.getExpenses({
        month: targetMonth,
        year: targetYear
      })

      // Get month budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear)

      if (!expenses) {
        return { data: null, error: 'No expense data found' }
      }

      const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      const totalBudget = budgets ? budgets.reduce((sum, budget) => sum + parseFloat(budget.monthly_limit), 0) : 0
      const remainingBudget = totalBudget - totalSpent

      // Calculate top categories
      const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount)
        return acc
      }, {})

      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }))

      // Find overspent categories
      const overspentCategories = budgets ? budgets.filter(budget => {
        const spent = categoryTotals[budget.category] || 0
        return spent > budget.monthly_limit
      }).map(budget => ({
        category: budget.category,
        spent: categoryTotals[budget.category],
        limit: budget.monthly_limit,
        overage: categoryTotals[budget.category] - budget.monthly_limit
      })) : []

      const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString('en-GB', { month: 'long' })
      const template = AlertTemplates[AlertTypes.MONTHLY_SUMMARY]

      const summaryData = {
        month: targetMonth,
        year: targetYear,
        total_spent: totalSpent,
        budget_total: totalBudget,
        remaining_budget: remainingBudget,
        top_categories: topCategories,
        expense_count: expenses.length,
        overspent_categories: overspentCategories,
        savings_this_month: Math.max(0, remainingBudget)
      }

      const alertData = {
        alert_type: AlertTypes.MONTHLY_SUMMARY,
        title: template.title(monthName, targetYear),
        message: template.message(summaryData),
        severity: template.severity,
        trigger_type: 'time_based',
        trigger_data: summaryData,
        channels: ['in_app']
      }

      const result = await this.createAlert(alertData)
      return result

    } catch (err) {
      console.error('Error generating monthly summary:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Check for recurring transactions due and create alerts
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async checkRecurringTransactionsDue() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      // Get active recurring transactions that are due
      const { data: recurringTransactions } = await recurringTransactionService.getRecurringTransactions({
        is_active: true,
        status: 'active'
      })

      if (!recurringTransactions || recurringTransactions.length === 0) {
        return { data: [], error: null }
      }

      const today = new Date().toISOString().split('T')[0]
      const dueTransactions = recurringTransactions.filter(transaction => 
        transaction.next_generation_date && transaction.next_generation_date <= today
      )

      if (dueTransactions.length === 0) {
        return { data: [], error: null }
      }

      // Check if we already have an alert for recurring transactions today
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('alert_type', AlertTypes.RECURRING_DUE)
        .eq('status', AlertStatus.ACTIVE)
        .gte('created_at', today)

      if (existingAlerts && existingAlerts.length > 0) {
        return { data: [], error: null }
      }

      const template = AlertTemplates[AlertTypes.RECURRING_DUE]
      const alertData = {
        alert_type: AlertTypes.RECURRING_DUE,
        title: template.title(dueTransactions.length),
        message: template.message(dueTransactions),
        severity: template.severity,
        trigger_type: 'system_generated',
        trigger_data: {
          due_transactions: dueTransactions.map(t => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            next_date: t.next_generation_date
          })),
          count: dueTransactions.length
        },
        channels: ['in_app']
      }

      const result = await this.createAlert(alertData)
      return { data: result.data ? [result.data] : [], error: result.error }

    } catch (err) {
      console.error('Error checking recurring transactions:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get alert statistics for dashboard
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async getAlertStats() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      const { data: alerts } = await this.getAlerts()
      if (!alerts) {
        return { data: null, error: 'Failed to fetch alerts' }
      }

      const stats = {
        total: alerts.length,
        active: alerts.filter(alert => alert.status === AlertStatus.ACTIVE).length,
        critical: alerts.filter(alert => alert.severity === AlertSeverity.CRITICAL && alert.status === AlertStatus.ACTIVE).length,
        warnings: alerts.filter(alert => alert.severity === AlertSeverity.WARNING && alert.status === AlertStatus.ACTIVE).length,
        by_type: alerts.reduce((acc, alert) => {
          acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
          return acc
        }, {}),
        recent: alerts.filter(alert => {
          const alertDate = new Date(alert.created_at)
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return alertDate > dayAgo
        }).length
      }

      return { data: stats, error: null }

    } catch (err) {
      console.error('Error getting alert stats:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Save payday reminder configuration
   * @param {Object} config
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async savePaydayConfig(config) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      // Store config in user preferences or separate table
      // For now, we'll use a simple approach with localStorage backup
      const configData = {
        user_id: user.id,
        config: config,
        updated_at: new Date().toISOString()
      }

      // Store in supabase user metadata or create preferences table
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert([{
          user_id: user.id,
          preference_type: 'payday_reminders',
          preference_data: config,
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        // Fallback to localStorage
        localStorage.setItem(`payday_config_${user.id}`, JSON.stringify(config))
        console.warn('Using localStorage for payday config:', error)
      }

      return { data: config, error: null }

    } catch (err) {
      console.error('Error saving payday config:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get payday reminder configuration
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async getPaydayConfig() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      // Try to get from database first
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('preference_type', 'payday_reminders')
        .single()

      if (data && data.preference_data) {
        return { data: data.preference_data, error: null }
      }

      // Fallback to localStorage
      const localConfig = localStorage.getItem(`payday_config_${user.id}`)
      if (localConfig) {
        return { data: JSON.parse(localConfig), error: null }
      }

      // Return default config
      return { 
        data: {
          enabled: false,
          payday_date: 1,
          reminder_days_before: 3,
          savings_targets: [],
          auto_allocate: false
        }, 
        error: null 
      }

    } catch (err) {
      console.error('Error getting payday config:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Check and generate payday reminders
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async checkPaydayReminders() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: AlertErrors.USER_NOT_AUTHENTICATED }
      }

      // Get payday configuration
      const { data: config, error: configError } = await this.getPaydayConfig()
      if (configError || !config || !config.enabled) {
        return { data: [], error: null }
      }

      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      // Calculate next payday
      let payday = new Date(currentYear, currentMonth, config.payday_date)
      if (payday < today) {
        payday = new Date(currentYear, currentMonth + 1, config.payday_date)
      }

      // Calculate reminder date
      const reminderDate = new Date(payday)
      reminderDate.setDate(reminderDate.getDate() - config.reminder_days_before)

      // Check if today is the reminder date
      const todayStr = today.toISOString().split('T')[0]
      const reminderStr = reminderDate.toISOString().split('T')[0]

      if (todayStr === reminderStr) {
        // Check if we already have a payday reminder for this payday
        const { data: existingAlerts } = await supabase
          .from('alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('alert_type', AlertTypes.PAYDAY_REMINDER)
          .eq('status', AlertStatus.ACTIVE)
          .contains('trigger_data', { payday_date: payday.toISOString().split('T')[0] })

        if (!existingAlerts || existingAlerts.length === 0) {
          // Generate payday reminder
          const template = AlertTemplates[AlertTypes.PAYDAY_REMINDER]
          const targetNames = config.savings_targets.map(target => target.name)
          const totalTarget = config.savings_targets.reduce((sum, target) => sum + target.target_amount, 0)

          const alertData = {
            alert_type: AlertTypes.PAYDAY_REMINDER,
            title: template.title(),
            message: config.savings_targets.length > 0 
              ? `Payday is on ${payday.toLocaleDateString('en-GB')}! Don't forget to allocate £${totalTarget.toFixed(2)} to your savings goals: ${targetNames.join(', ')}.`
              : template.message(targetNames),
            severity: template.severity,
            trigger_type: 'time_based',
            trigger_data: {
              payday_date: payday.toISOString().split('T')[0],
              reminder_date: reminderDate.toISOString().split('T')[0],
              savings_targets: config.savings_targets,
              total_target: totalTarget
            },
            channels: ['in_app']
          }

          const result = await this.createAlert(alertData)
          return { data: result.data ? [result.data] : [], error: result.error }
        }
      }

      return { data: [], error: null }

    } catch (err) {
      console.error('Error checking payday reminders:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Run all alert checks (to be called periodically)
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async runAlertChecks() {
    try {
      const results = {
        budget_warnings: [],
        recurring_due: [],
        payday_reminders: [],
        errors: []
      }

      // Check budget warnings
      try {
        const budgetResult = await this.checkBudgetWarnings()
        if (budgetResult.error) {
          results.errors.push(`Budget warnings: ${budgetResult.error}`)
        } else {
          results.budget_warnings = budgetResult.data || []
        }
      } catch (err) {
        results.errors.push(`Budget warnings: ${err.message}`)
      }

      // Check recurring transactions
      try {
        const recurringResult = await this.checkRecurringTransactionsDue()
        if (recurringResult.error) {
          results.errors.push(`Recurring due: ${recurringResult.error}`)
        } else {
          results.recurring_due = recurringResult.data || []
        }
      } catch (err) {
        results.errors.push(`Recurring due: ${err.message}`)
      }

      // Check payday reminders
      try {
        const paydayResult = await this.checkPaydayReminders()
        if (paydayResult.error) {
          results.errors.push(`Payday reminders: ${paydayResult.error}`)
        } else {
          results.payday_reminders = paydayResult.data || []
        }
      } catch (err) {
        results.errors.push(`Payday reminders: ${err.message}`)
      }

      const totalGenerated = results.budget_warnings.length + results.recurring_due.length + results.payday_reminders.length

      return { 
        data: {
          ...results,
          total_generated: totalGenerated,
          success: results.errors.length === 0
        }, 
        error: null 
      }

    } catch (err) {
      console.error('Error running alert checks:', err)
      return { data: null, error: AlertErrors.UNEXPECTED_ERROR }
    }
  }
}

// Export singleton instance
export const alertService = new AlertService()
export default alertService