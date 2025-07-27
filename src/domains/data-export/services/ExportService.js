import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'

/**
 * Data Export Service
 * Handles exporting user financial data to various formats
 */
class ExportService {
  /**
   * Export expenses to CSV
   * @param {Object} options
   * @returns {Promise<{data: string, error: string|null}>}
   */
  async exportExpensesToCSV(options = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const {
        start_date,
        end_date,
        categories,
        include_notes = true,
        include_transaction_type = true
      } = options

      // Build query
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (start_date) {
        query = query.gte('date', start_date)
      }
      if (end_date) {
        query = query.lte('date', end_date)
      }
      if (categories && categories.length > 0) {
        query = query.in('category', categories)
      }

      const { data: expenses, error } = await query

      if (error) {
        console.error('Database error fetching expenses:', error)
        return { data: null, error: 'Failed to fetch expense data' }
      }

      if (!expenses || expenses.length === 0) {
        return { data: null, error: 'No expenses found for the specified criteria' }
      }

      // Build CSV headers
      const headers = ['Date', 'Amount', 'Category']
      if (include_notes) headers.push('Notes')
      if (include_transaction_type) headers.push('Transaction Type', 'Reimbursement Status')
      headers.push('Created At')

      // Build CSV content
      const csvRows = [headers.join(',')]

      expenses.forEach(expense => {
        const row = [
          expense.date,
          expense.amount,
          `"${expense.category}"`
        ]

        if (include_notes) {
          row.push(`"${(expense.notes || '').replace(/"/g, '""')}"`)
        }

        if (include_transaction_type) {
          row.push(expense.transaction_type || 'personal')
          row.push(expense.reimbursement_status || '')
        }

        row.push(expense.created_at)
        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      return { data: csvContent, error: null }

    } catch (err) {
      console.error('Error exporting expenses:', err)
      return { data: null, error: 'Unexpected error during export' }
    }
  }

  /**
   * Export budgets to CSV
   * @param {Object} options
   * @returns {Promise<{data: string, error: string|null}>}
   */
  async exportBudgetsToCSV(options = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { year, months } = options

      // Build query
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: true })
        .order('month', { ascending: true })
        .order('category', { ascending: true })

      if (year) {
        query = query.eq('year', year)
      }
      if (months && months.length > 0) {
        query = query.in('month', months)
      }

      const { data: budgets, error } = await query

      if (error) {
        console.error('Database error fetching budgets:', error)
        return { data: null, error: 'Failed to fetch budget data' }
      }

      if (!budgets || budgets.length === 0) {
        return { data: null, error: 'No budgets found for the specified criteria' }
      }

      // Build CSV headers
      const headers = [
        'Year', 'Month', 'Category', 'Monthly Limit', 'Category Type', 
        'Recurrence Type', 'Workdays Per Month', 'Category Group', 'Auto Calculate', 'Created At'
      ]

      // Build CSV content
      const csvRows = [headers.join(',')]

      budgets.forEach(budget => {
        const row = [
          budget.year,
          budget.month,
          `"${budget.category}"`,
          budget.monthly_limit,
          budget.category_type || 'flexible',
          budget.recurrence_type || 'recurring',
          budget.workdays_per_month || '',
          `"${budget.category_group || ''}"`,
          budget.auto_calculate || false,
          budget.created_at
        ]
        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      return { data: csvContent, error: null }

    } catch (err) {
      console.error('Error exporting budgets:', err)
      return { data: null, error: 'Unexpected error during export' }
    }
  }

  /**
   * Export recurring transactions to CSV
   * @returns {Promise<{data: string, error: string|null}>}
   */
  async exportRecurringTransactionsToCSV() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: transactions, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Database error fetching recurring transactions:', error)
        return { data: null, error: 'Failed to fetch recurring transaction data' }
      }

      if (!transactions || transactions.length === 0) {
        return { data: null, error: 'No recurring transactions found' }
      }

      // Build CSV headers
      const headers = [
        'Name', 'Amount', 'Category', 'Frequency', 'Start Date', 'End Date',
        'Next Generation Date', 'Is Active', 'Description', 'Tags', 'Created At'
      ]

      // Build CSV content
      const csvRows = [headers.join(',')]

      transactions.forEach(transaction => {
        const row = [
          `"${transaction.name}"`,
          transaction.amount,
          `"${transaction.category}"`,
          transaction.frequency,
          transaction.start_date,
          transaction.end_date || '',
          transaction.next_generation_date || '',
          transaction.is_active,
          `"${(transaction.description || '').replace(/"/g, '""')}"`,
          `"${(transaction.tags || []).join('; ')}"`,
          transaction.created_at
        ]
        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      return { data: csvContent, error: null }

    } catch (err) {
      console.error('Error exporting recurring transactions:', err)
      return { data: null, error: 'Unexpected error during export' }
    }
  }

  /**
   * Export all user data as a ZIP file (simulated with multiple CSV files)
   * @param {Object} options
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async exportAllData(options = {}) {
    try {
      const exports = {}
      const errors = []

      // Export expenses
      try {
        const { data: expensesCSV, error: expensesError } = await this.exportExpensesToCSV(options)
        if (expensesError) {
          errors.push(`Expenses: ${expensesError}`)
        } else {
          exports.expenses = expensesCSV
        }
      } catch (err) {
        errors.push(`Expenses: ${err.message}`)
      }

      // Export budgets
      try {
        const { data: budgetsCSV, error: budgetsError } = await this.exportBudgetsToCSV(options)
        if (budgetsError) {
          errors.push(`Budgets: ${budgetsError}`)
        } else {
          exports.budgets = budgetsCSV
        }
      } catch (err) {
        errors.push(`Budgets: ${err.message}`)
      }

      // Export recurring transactions
      try {
        const { data: recurringCSV, error: recurringError } = await this.exportRecurringTransactionsToCSV()
        if (recurringError) {
          errors.push(`Recurring: ${recurringError}`)
        } else {
          exports.recurring_transactions = recurringCSV
        }
      } catch (err) {
        errors.push(`Recurring: ${err.message}`)
      }

      // Export user categories
      try {
        const { data: categoriesCSV, error: categoriesError } = await this.exportUserCategoriesToCSV()
        if (categoriesError) {
          errors.push(`Categories: ${categoriesError}`)
        } else {
          exports.user_categories = categoriesCSV
        }
      } catch (err) {
        errors.push(`Categories: ${err.message}`)
      }

      if (Object.keys(exports).length === 0) {
        return { data: null, error: 'No data could be exported: ' + errors.join('; ') }
      }

      return {
        data: {
          exports,
          summary: {
            total_files: Object.keys(exports).length,
            export_date: new Date().toISOString(),
            errors: errors.length > 0 ? errors : null
          }
        },
        error: errors.length > 0 ? `Some exports failed: ${errors.join('; ')}` : null
      }

    } catch (err) {
      console.error('Error exporting all data:', err)
      return { data: null, error: 'Unexpected error during full export' }
    }
  }

  /**
   * Export user categories to CSV
   * @returns {Promise<{data: string, error: string|null}>}
   */
  async exportUserCategoriesToCSV() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: categories, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Database error fetching user categories:', error)
        return { data: null, error: 'Failed to fetch user categories' }
      }

      if (!categories || categories.length === 0) {
        return { data: null, error: 'No custom categories found' }
      }

      // Build CSV headers
      const headers = ['Name', 'Color', 'Icon', 'Is Active', 'Created At']

      // Build CSV content
      const csvRows = [headers.join(',')]

      categories.forEach(category => {
        const row = [
          `"${category.name}"`,
          category.color,
          category.icon,
          category.is_active,
          category.created_at
        ]
        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      return { data: csvContent, error: null }

    } catch (err) {
      console.error('Error exporting user categories:', err)
      return { data: null, error: 'Unexpected error during export' }
    }
  }

  /**
   * Generate export summary with statistics
   * @param {Object} options
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async generateExportSummary(options = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const summary = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        date_range: {
          start: options.start_date || 'All time',
          end: options.end_date || 'Present'
        },
        statistics: {
          total_expenses: 0,
          total_amount: 0,
          unique_categories: 0,
          budget_categories: 0,
          recurring_transactions: 0,
          custom_categories: 0
        }
      }

      // Get expense statistics
      let expenseQuery = supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', user.id)

      if (options.start_date) {
        expenseQuery = expenseQuery.gte('date', options.start_date)
      }
      if (options.end_date) {
        expenseQuery = expenseQuery.lte('date', options.end_date)
      }

      const { data: expenses } = await expenseQuery

      if (expenses) {
        summary.statistics.total_expenses = expenses.length
        summary.statistics.total_amount = expenses.reduce((sum, expense) => 
          sum + parseFloat(expense.amount), 0
        )
        summary.statistics.unique_categories = new Set(expenses.map(e => e.category)).size
      }

      // Get budget count
      const { count: budgetCount } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      summary.statistics.budget_categories = budgetCount || 0

      // Get recurring transactions count
      const { count: recurringCount } = await supabase
        .from('recurring_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      summary.statistics.recurring_transactions = recurringCount || 0

      // Get custom categories count
      const { count: categoriesCount } = await supabase
        .from('user_categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      summary.statistics.custom_categories = categoriesCount || 0

      return { data: summary, error: null }

    } catch (err) {
      console.error('Error generating export summary:', err)
      return { data: null, error: 'Unexpected error generating summary' }
    }
  }

  /**
   * Download data as file (browser only)
   * @param {string} content
   * @param {string} filename
   * @param {string} mimeType
   */
  downloadFile(content, filename, mimeType = 'text/csv') {
    if (typeof window === 'undefined') {
      throw new Error('File download is only available in browser environment')
    }

    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Generate filename with timestamp
   * @param {string} baseName
   * @param {string} extension
   * @returns {string}
   */
  generateFilename(baseName, extension = 'csv') {
    const timestamp = new Date().toISOString().split('T')[0]
    return `${baseName}_${timestamp}.${extension}`
  }
}

// Export singleton instance
export const exportService = new ExportService()
export default exportService