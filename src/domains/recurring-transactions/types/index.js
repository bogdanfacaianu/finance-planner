/**
 * Recurring Transactions Domain Types
 */

// Recurring Transaction Frequency Types
export const RecurringFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
}

// Weekly Days
export const WeeklyDays = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0
}

// Weekday patterns
export const WeekdayPatterns = {
  WEEKDAYS: 'weekdays',
  WEEKENDS: 'weekends',
  ALL_DAYS: 'all_days',
  CUSTOM: 'custom'
}

// Recurring Transaction Status
export const RecurringStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended'
}

// Monthly Patterns
export const MonthlyPatterns = {
  SAME_DATE: 'same_date',
  LAST_DAY: 'last_day',
  FIRST_WEEKDAY: 'first_weekday',
  LAST_WEEKDAY: 'last_weekday'
}

// Recurring Transaction Schema
export const RecurringTransaction = {
  id: 'string',
  user_id: 'string',
  name: 'string',
  description: 'string',
  amount: 'number',
  category: 'string',
  frequency: 'string',
  frequency_config: 'object',
  start_date: 'date',
  end_date: 'date',
  status: 'string',
  next_generation_date: 'date',
  last_generated_date: 'date',
  total_generated: 'number',
  max_generations: 'number',
  is_active: 'boolean',
  created_at: 'timestamp',
  updated_at: 'timestamp'
}

// Frequency Configuration Examples
export const FrequencyConfigurations = {
  daily: {
    interval: 1 // Every N days
  },
  weekly: {
    interval: 1, // Every N weeks
    days: [1, 2, 3, 4, 5], // Monday to Friday (weekdays)
    pattern: 'weekdays'
  },
  monthly: {
    interval: 1, // Every N months
    day_of_month: 15, // Day of month (1-31)
    pattern: 'same_date'
  },
  yearly: {
    interval: 1, // Every N years
    month: 3, // Month (1-12)
    day: 15 // Day of month
  },
  custom: {
    type: 'interval',
    interval_days: 14 // Every 14 days
  }
}

// Validation Rules
export const RecurringValidation = {
  validateName: (name) => {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Name is required' }
    }
    if (name.length > 100) {
      return { valid: false, error: 'Name too long (max 100 characters)' }
    }
    return { valid: true, value: name.trim() }
  },

  validateAmount: (amount) => {
    if (!amount) return { valid: false, error: 'Amount is required' }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return { valid: false, error: 'Invalid amount format' }
    if (numAmount <= 0) return { valid: false, error: 'Amount must be greater than 0' }
    return { valid: true, value: numAmount }
  },

  validateFrequency: (frequency, config) => {
    if (!frequency || !Object.values(RecurringFrequency).includes(frequency)) {
      return { valid: false, error: 'Invalid frequency' }
    }

    // Validate frequency-specific configuration
    switch (frequency) {
      case RecurringFrequency.DAILY:
        if (!config.interval || config.interval < 1) {
          return { valid: false, error: 'Daily interval must be at least 1' }
        }
        break
      case RecurringFrequency.WEEKLY:
        if (!config.interval || config.interval < 1) {
          return { valid: false, error: 'Weekly interval must be at least 1' }
        }
        if (!config.days || !Array.isArray(config.days) || config.days.length === 0) {
          return { valid: false, error: 'At least one day must be selected for weekly frequency' }
        }
        break
      case RecurringFrequency.MONTHLY:
        if (!config.interval || config.interval < 1) {
          return { valid: false, error: 'Monthly interval must be at least 1' }
        }
        if (!config.day_of_month || config.day_of_month < 1 || config.day_of_month > 31) {
          return { valid: false, error: 'Day of month must be between 1 and 31' }
        }
        break
      case RecurringFrequency.YEARLY:
        if (!config.month || config.month < 1 || config.month > 12) {
          return { valid: false, error: 'Month must be between 1 and 12' }
        }
        if (!config.day || config.day < 1 || config.day > 31) {
          return { valid: false, error: 'Day must be between 1 and 31' }
        }
        break
    }

    return { valid: true, value: { frequency, config } }
  },

  validateDateRange: (startDate, endDate) => {
    if (!startDate) {
      return { valid: false, error: 'Start date is required' }
    }

    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      return { valid: false, error: 'Invalid start date' }
    }

    if (endDate) {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return { valid: false, error: 'Invalid end date' }
      }
      if (end <= start) {
        return { valid: false, error: 'End date must be after start date' }
      }
    }

    return { valid: true, value: { startDate: start, endDate: endDate ? new Date(endDate) : null } }
  }
}

// Predefined Recurring Transaction Templates
export const RecurringTemplates = [
  {
    name: 'Daily Coffee',
    description: 'Morning coffee expense',
    category: 'Food & Drink',
    frequency: RecurringFrequency.WEEKLY,
    frequency_config: {
      interval: 1,
      days: [1, 2, 3, 4, 5], // Weekdays
      pattern: WeekdayPatterns.WEEKDAYS
    },
    suggested_amount: 2.50
  },
  {
    name: 'Monthly Gym Membership',
    description: 'Gym membership fee',
    category: 'Health & Fitness',
    frequency: RecurringFrequency.MONTHLY,
    frequency_config: {
      interval: 1,
      day_of_month: 1,
      pattern: MonthlyPatterns.SAME_DATE
    },
    suggested_amount: 30.00
  },
  {
    name: 'Weekly Grocery Shopping',
    description: 'Weekly grocery expenses',
    category: 'Groceries',
    frequency: RecurringFrequency.WEEKLY,
    frequency_config: {
      interval: 1,
      days: [6], // Saturday
      pattern: WeekdayPatterns.CUSTOM
    },
    suggested_amount: 75.00
  },
  {
    name: 'Monthly Netflix Subscription',
    description: 'Streaming service subscription',
    category: 'Entertainment',
    frequency: RecurringFrequency.MONTHLY,
    frequency_config: {
      interval: 1,
      day_of_month: 15,
      pattern: MonthlyPatterns.SAME_DATE
    },
    suggested_amount: 11.99
  }
]

// Error Messages
export const RecurringErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  INVALID_FREQUENCY: 'Invalid frequency configuration',
  INVALID_DATE_RANGE: 'Invalid date range',
  RECURRING_NOT_FOUND: 'Recurring transaction not found',
  GENERATION_ERROR: 'Error generating recurring transaction',
  DATABASE_ERROR: 'Database error',
  VALIDATION_ERROR: 'Validation error',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}