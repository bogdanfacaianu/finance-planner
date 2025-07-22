/**
 * Expense Management Domain Types
 */

/**
 * @typedef {Object} Expense
 * @property {string} id - Unique expense identifier
 * @property {string} user_id - User who owns the expense
 * @property {number} amount - Expense amount
 * @property {string} category - Expense category
 * @property {string} date - Expense date (YYYY-MM-DD)
 * @property {string|null} notes - Optional expense notes
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} CreateExpenseRequest
 * @property {number} amount - Expense amount
 * @property {string} category - Expense category
 * @property {string} date - Expense date (YYYY-MM-DD)
 * @property {string} [notes] - Optional expense notes
 */

/**
 * @typedef {Object} UpdateExpenseRequest
 * @property {number} [amount] - Updated expense amount
 * @property {string} [category] - Updated expense category
 * @property {string} [date] - Updated expense date (YYYY-MM-DD)
 * @property {string} [notes] - Updated expense notes
 */

/**
 * @typedef {Object} ExpenseFilters
 * @property {number|null} month - Filter by month (1-12)
 * @property {number|null} year - Filter by year
 * @property {string|null} category - Filter by category
 */

/**
 * @typedef {Object} ExpenseSummary
 * @property {string} category - Category name
 * @property {number} total - Total amount for category
 * @property {number} count - Number of expenses in category
 */

export const ExpenseErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  INVALID_AMOUNT: 'Please enter a valid amount greater than 0',
  MISSING_REQUIRED_FIELDS: 'Amount and category are required',
  EXPENSE_NOT_FOUND: 'Expense not found',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to expense',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

export const ExpenseValidation = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999.99,
  MAX_NOTES_LENGTH: 500,
  REQUIRED_FIELDS: ['amount', 'category', 'date']
}