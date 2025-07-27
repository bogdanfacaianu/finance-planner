/**
 * Financial Overview Domain Types
 */

// Financial Overview Summary
export const FinancialOverview = {
  total_income: 'number',
  fixed_costs: 'number',
  variable_costs: 'number',
  total_expenses: 'number',
  remaining_buffer: 'number',
  budget_utilization_percentage: 'number',
  month: 'number',
  year: 'number'
}

// Category Progress Item
export const CategoryProgress = {
  category: 'string',
  monthly_target: 'number',
  current_spend: 'number',
  remaining_allowance: 'number',
  percentage_used: 'number',
  status: 'string', // 'under_budget', 'near_limit', 'over_budget'
  category_type: 'string', // 'fixed', 'flexible'
  category_group: 'string|null',
  color: 'string'
}

// Income Source
export const IncomeSource = {
  id: 'string',
  user_id: 'string',
  source_name: 'string',
  monthly_amount: 'number',
  is_guaranteed: 'boolean', // salary vs variable income
  created_at: 'timestamp'
}

// Financial Overview Request
export const FinancialOverviewRequest = {
  month: 'number',
  year: 'number'
}

// Financial Overview Status
export const FinancialStatus = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EXCELLENT: 'excellent'
}

// Financial Overview Errors
export const FinancialOverviewErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  INVALID_DATE_RANGE: 'Invalid date range provided',
  NO_DATA_AVAILABLE: 'No financial data available for this period',
  CALCULATION_ERROR: 'Error calculating financial overview',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

// Financial Overview Validation
export const FinancialOverviewValidation = {
  validateMonth: (month) => {
    const numMonth = parseInt(month)
    return !isNaN(numMonth) && numMonth >= 1 && numMonth <= 12
  },

  validateYear: (year) => {
    const numYear = parseInt(year)
    const currentYear = new Date().getFullYear()
    return !isNaN(numYear) && numYear >= 2020 && numYear <= currentYear + 5
  },

  calculateFinancialStatus: (utilizationPercentage, remainingBuffer) => {
    if (utilizationPercentage <= 50 && remainingBuffer > 0) {
      return FinancialStatus.EXCELLENT
    } else if (utilizationPercentage <= 80 && remainingBuffer > 0) {
      return FinancialStatus.HEALTHY
    } else if (utilizationPercentage <= 100 && remainingBuffer >= 0) {
      return FinancialStatus.WARNING
    } else {
      return FinancialStatus.CRITICAL
    }
  }
}