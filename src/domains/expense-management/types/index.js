/**
 * Expense Management Domain Types
 */

// Transaction Types for filtering and reporting
export const TransactionTypes = {
  PERSONAL: 'personal',
  REIMBURSABLE: 'reimbursable',
  SHARED: 'shared'
}

// Transaction Type Metadata
export const TransactionTypeMetadata = {
  [TransactionTypes.PERSONAL]: {
    label: 'Personal',
    description: 'Personal expenses that you pay for yourself',
    color: 'blue',
    icon: 'IconUser'
  },
  [TransactionTypes.REIMBURSABLE]: {
    label: 'Reimbursable',
    description: 'Expenses that will be reimbursed by employer or others',
    color: 'green',
    icon: 'IconRefresh'
  },
  [TransactionTypes.SHARED]: {
    label: 'Shared',
    description: 'Expenses shared with others (will be split)',
    color: 'orange',
    icon: 'IconUsers'
  }
}

// Transaction Status for reimbursables
export const ReimbursementStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected'
}

/**
 * @typedef {Object} Expense
 * @property {string} id - Unique expense identifier
 * @property {string} user_id - User who owns the expense
 * @property {number} amount - Expense amount
 * @property {string} category - Expense category
 * @property {string} date - Expense date (YYYY-MM-DD)
 * @property {string|null} notes - Optional expense notes
 * @property {string} transaction_type - Transaction type (personal, reimbursable, shared)
 * @property {string|null} reimbursement_status - Status for reimbursable expenses
 * @property {string|null} shared_with - Who the expense is shared with
 * @property {number|null} shared_amount - Amount you're responsible for in shared expenses
 * @property {string|null} reference_number - Reference number for reimbursable expenses
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} CreateExpenseRequest
 * @property {number} amount - Expense amount
 * @property {string} category - Expense category
 * @property {string} date - Expense date (YYYY-MM-DD)
 * @property {string} [notes] - Optional expense notes
 * @property {string} transaction_type - Transaction type (personal, reimbursable, shared)
 * @property {string} [reimbursement_status] - Status for reimbursable expenses
 * @property {string} [shared_with] - Who the expense is shared with
 * @property {number} [shared_amount] - Amount you're responsible for in shared expenses
 * @property {string} [reference_number] - Reference number for reimbursable expenses
 */

/**
 * @typedef {Object} UpdateExpenseRequest
 * @property {number} [amount] - Updated expense amount
 * @property {string} [category] - Updated expense category
 * @property {string} [date] - Updated expense date (YYYY-MM-DD)
 * @property {string} [notes] - Updated expense notes
 * @property {string} [transaction_type] - Updated transaction type
 * @property {string} [reimbursement_status] - Updated reimbursement status
 * @property {string} [shared_with] - Updated shared with
 * @property {number} [shared_amount] - Updated shared amount
 * @property {string} [reference_number] - Updated reference number
 */

/**
 * @typedef {Object} ExpenseFilters
 * @property {number|null} month - Filter by month (1-12)
 * @property {number|null} year - Filter by year
 * @property {string|null} category - Filter by category
 * @property {string|null} transaction_type - Filter by transaction type
 * @property {string|null} reimbursement_status - Filter by reimbursement status
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