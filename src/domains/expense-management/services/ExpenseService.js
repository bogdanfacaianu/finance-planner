import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { ExpenseErrors, ExpenseValidation, TransactionTypes } from 'src/domains/expense-management/types'

/**
 * Expense Service
 * Handles all expense-related operations
 */
class ExpenseService {
  /**
   * Create a new expense
   * @param {import('../types').CreateExpenseRequest} expenseData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async createExpense(expenseData) {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: ExpenseErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate expense data
      const validationError = this._validateExpenseData(expenseData)
      if (validationError) {
        return { data: null, error: validationError }
      }

      // Create expense
      const { data, error } = await supabase
        .from('expenses')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(expenseData.amount),
            category: expenseData.category,
            date: expenseData.date,
            notes: expenseData.notes || null,
            transaction_type: expenseData.transaction_type || TransactionTypes.PERSONAL,
            reimbursement_status: expenseData.reimbursement_status || null,
            shared_with: expenseData.shared_with || null,
            shared_amount: expenseData.shared_amount ? parseFloat(expenseData.shared_amount) : null,
            reference_number: expenseData.reference_number || null
          }
        ])
        .select()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data[0], error: null }
    } catch (err) {
      return { data: null, error: ExpenseErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get expenses for the current user
   * @param {import('../types').ExpenseFilters} [filters={}]
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getExpenses(filters = {}) {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: [], error: ExpenseErrors.USER_NOT_AUTHENTICATED }
      }

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      if (filters.month && filters.year) {
        const startDate = `${filters.year}-${filters.month.toString().padStart(2, '0')}-01`
        const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
        query = query.gte('date', startDate).lte('date', endDate)
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters.transaction_type && filters.transaction_type !== 'all') {
        query = query.eq('transaction_type', filters.transaction_type)
      }

      if (filters.reimbursement_status && filters.reimbursement_status !== 'all') {
        query = query.eq('reimbursement_status', filters.reimbursement_status)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err) {
      return { data: [], error: ExpenseErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Update an existing expense
   * @param {string} expenseId - Expense ID to update
   * @param {import('../types').UpdateExpenseRequest} updates
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async updateExpense(expenseId, updates) {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: ExpenseErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate updates
      if (updates.amount !== undefined) {
        const amount = parseFloat(updates.amount)
        if (isNaN(amount) || amount < ExpenseValidation.MIN_AMOUNT) {
          return { data: null, error: ExpenseErrors.INVALID_AMOUNT }
        }
        updates.amount = amount
      }

      // Update expense
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
        .eq('user_id', user.id) // Ensure user can only update their own expenses
        .select()

      if (error) {
        return { data: null, error: error.message }
      }

      if (!data || data.length === 0) {
        return { data: null, error: ExpenseErrors.EXPENSE_NOT_FOUND }
      }

      return { data: data[0], error: null }
    } catch (err) {
      return { data: null, error: ExpenseErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Delete an expense
   * @param {string} expenseId - Expense ID to delete
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteExpense(expenseId) {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { success: false, error: ExpenseErrors.USER_NOT_AUTHENTICATED }
      }

      // Delete expense
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id) // Ensure user can only delete their own expenses

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: ExpenseErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get expense summary by category
   * @param {import('../types').ExpenseFilters} [filters={}]
   * @returns {Promise<{data: import('../types').ExpenseSummary[], error: string|null}>}
   */
  async getExpenseSummary(filters = {}) {
    const { data: expenses, error } = await this.getExpenses(filters)
    
    if (error) {
      return { data: [], error }
    }

    const summary = expenses.reduce((acc, expense) => {
      const category = expense.category
      if (!acc[category]) {
        acc[category] = {
          category,
          total: 0,
          count: 0
        }
      }
      acc[category].total += parseFloat(expense.amount)
      acc[category].count += 1
      return acc
    }, {})

    const sortedSummary = Object.values(summary).sort((a, b) => b.total - a.total)
    return { data: sortedSummary, error: null }
  }

  /**
   * Get unique categories from user's expenses
   * @returns {Promise<{data: string[], error: string|null}>}
   */
  async getUserCategories() {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: [], error: ExpenseErrors.USER_NOT_AUTHENTICATED }
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('user_id', user.id)

      if (error) {
        return { data: [], error: error.message }
      }

      const uniqueCategories = [...new Set(data.map(expense => expense.category))]
      return { data: uniqueCategories.sort(), error: null }
    } catch (err) {
      return { data: [], error: ExpenseErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Validate expense data
   * @private
   * @param {import('../types').CreateExpenseRequest} expenseData
   * @returns {string|null} Error message or null if valid
   */
  _validateExpenseData(expenseData) {
    // Check required fields
    if (!expenseData.amount || !expenseData.category) {
      return ExpenseErrors.MISSING_REQUIRED_FIELDS
    }

    // Validate amount
    const amount = parseFloat(expenseData.amount)
    if (isNaN(amount) || amount < ExpenseValidation.MIN_AMOUNT || amount > ExpenseValidation.MAX_AMOUNT) {
      return ExpenseErrors.INVALID_AMOUNT
    }

    // Validate notes length
    if (expenseData.notes && expenseData.notes.length > ExpenseValidation.MAX_NOTES_LENGTH) {
      return `Notes must be less than ${ExpenseValidation.MAX_NOTES_LENGTH} characters`
    }

    // Validate transaction type
    if (expenseData.transaction_type && !Object.values(TransactionTypes).includes(expenseData.transaction_type)) {
      return 'Invalid transaction type'
    }

    // Validate shared amount if transaction is shared
    if (expenseData.transaction_type === TransactionTypes.SHARED) {
      if (expenseData.shared_amount !== undefined) {
        const sharedAmount = parseFloat(expenseData.shared_amount)
        if (isNaN(sharedAmount) || sharedAmount <= 0 || sharedAmount > amount) {
          return 'Shared amount must be valid and not exceed total amount'
        }
      }
    }

    return null
  }
}

// Export singleton instance
export const expenseService = new ExpenseService()
export default expenseService