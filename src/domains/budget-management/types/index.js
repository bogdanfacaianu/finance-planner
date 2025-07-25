/**
 * Budget Management Domain Types
 */

// Budget entity type
export const BudgetEntity = {
  ID: 'string',
  USER_ID: 'string',
  CATEGORY: 'string',
  MONTHLY_LIMIT: 'number',
  MONTH: 'number',
  YEAR: 'number',
  CREATED_AT: 'timestamp'
}

// Budget request types
export const CreateBudgetRequest = {
  category: 'string',
  monthly_limit: 'number',
  month: 'number',
  year: 'number'
}

export const UpdateBudgetRequest = {
  monthly_limit: 'number'
}

// Budget status types
export const BudgetStatus = {
  UNDER_BUDGET: 'under_budget',
  NEAR_LIMIT: 'near_limit',
  OVER_BUDGET: 'over_budget'
}

// Budget progress type
export const BudgetProgress = {
  budget_id: 'string',
  category: 'string',
  monthly_limit: 'number',
  spent_amount: 'number',
  remaining_amount: 'number',
  percentage_used: 'number',
  status: 'string', // BudgetStatus
  month: 'number',
  year: 'number'
}

// Budget filters
export const BudgetFilters = {
  month: 'number|null',
  year: 'number|null',
  category: 'string|null',
  status: 'string|null'
}

// Budget errors
export const BudgetErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  BUDGET_NOT_FOUND: 'Budget not found',
  BUDGET_ALREADY_EXISTS: 'Budget already exists for this category and period',
  INVALID_BUDGET_DATA: 'Invalid budget data provided',
  INVALID_AMOUNT: 'Budget amount must be greater than 0',
  INVALID_MONTH: 'Month must be between 1 and 12',
  INVALID_YEAR: 'Invalid year provided',
  BUDGET_CREATE_FAILED: 'Failed to create budget',
  BUDGET_UPDATE_FAILED: 'Failed to update budget',
  BUDGET_DELETE_FAILED: 'Failed to delete budget',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

// Budget validation
export const BudgetValidation = {
  validateAmount: (amount) => {
    const numAmount = parseFloat(amount)
    return !isNaN(numAmount) && numAmount > 0
  },

  validateMonth: (month) => {
    const numMonth = parseInt(month)
    return !isNaN(numMonth) && numMonth >= 1 && numMonth <= 12
  },

  validateYear: (year) => {
    const numYear = parseInt(year)
    const currentYear = new Date().getFullYear()
    return !isNaN(numYear) && numYear >= 2020 && numYear <= currentYear + 5
  },

  validateCategory: (category) => {
    return typeof category === 'string' && category.trim().length > 0
  }
}

// Alert thresholds
export const BudgetAlertThresholds = {
  NEAR_LIMIT_PERCENTAGE: 80, // Alert when 80% of budget is spent
  OVER_BUDGET_PERCENTAGE: 100 // Alert when budget is exceeded
}