/**
 * Alerts & Notifications Domain Types
 */

// Alert Types
export const AlertTypes = {
  BUDGET_WARNING: 'budget_warning',
  BUDGET_EXCEEDED: 'budget_exceeded',
  MONTHLY_SUMMARY: 'monthly_summary',
  PAYDAY_REMINDER: 'payday_reminder',
  SAVINGS_GOAL: 'savings_goal',
  RECURRING_DUE: 'recurring_due',
  EXPENSE_ANOMALY: 'expense_anomaly'
}

// Alert Severity Levels
export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  SUCCESS: 'success'
}

// Alert Status
export const AlertStatus = {
  ACTIVE: 'active',
  DISMISSED: 'dismissed',
  READ: 'read',
  SNOOZED: 'snoozed'
}

// Notification Channels
export const NotificationChannels = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms'
}

// Alert Triggers
export const AlertTriggers = {
  BUDGET_THRESHOLD: 'budget_threshold',
  TIME_BASED: 'time_based',
  MANUAL: 'manual',
  SYSTEM_GENERATED: 'system_generated'
}

// Budget Warning Thresholds
export const BudgetThresholds = {
  EARLY_WARNING: 75,    // 75% of budget spent
  WARNING: 90,          // 90% of budget spent
  CRITICAL: 100,        // Budget exceeded
  SEVERE: 120          // 20% over budget
}

// Alert Configuration Schema
export const AlertConfig = {
  id: 'string',
  user_id: 'string',
  alert_type: 'string',
  title: 'string',
  message: 'string',
  severity: 'string',
  status: 'string',
  trigger_type: 'string',
  trigger_data: 'object',
  channels: 'array',
  created_at: 'timestamp',
  updated_at: 'timestamp',
  dismissed_at: 'timestamp',
  snoozed_until: 'timestamp'
}

// Monthly Summary Data Schema
export const MonthlySummaryData = {
  month: 'number',
  year: 'number',
  total_spent: 'number',
  budget_total: 'number',
  remaining_budget: 'number',
  top_categories: 'array',
  expense_count: 'number',
  overspent_categories: 'array',
  savings_this_month: 'number',
  spending_trend: 'string'
}

// Payday Reminder Config
export const PaydayReminderConfig = {
  payday_date: 'number', // Day of month (1-31)
  reminder_days_before: 'number', // Days before payday to remind
  savings_targets: 'array', // List of savings goals to remind about
  flying_pot_target: 'number', // Specific target for "Flying Pot"
  auto_allocate: 'boolean' // Whether to auto-allocate funds
}

// Alert Message Templates
export const AlertTemplates = {
  [AlertTypes.BUDGET_WARNING]: {
    title: (category, percentage) => `${category} Budget Alert`,
    message: (category, spent, limit, percentage) => 
      `You've spent £${spent.toFixed(2)} of your £${limit.toFixed(2)} ${category} budget (${percentage}%). Consider adjusting your spending.`,
    severity: AlertSeverity.WARNING,
    icon: 'IconAlertTriangle'
  },
  
  [AlertTypes.BUDGET_EXCEEDED]: {
    title: (category) => `${category} Budget Exceeded!`,
    message: (category, spent, limit, over) => 
      `You've exceeded your ${category} budget by £${over.toFixed(2)}. Total spent: £${spent.toFixed(2)} / £${limit.toFixed(2)}.`,
    severity: AlertSeverity.CRITICAL,
    icon: 'IconAlertOctagon'
  },
  
  [AlertTypes.MONTHLY_SUMMARY]: {
    title: (month, year) => `${month} ${year} Financial Summary`,
    message: (data) => 
      `Total spent: £${data.total_spent.toFixed(2)}. Budget remaining: £${data.remaining_budget.toFixed(2)}. ${data.expense_count} transactions this month.`,
    severity: AlertSeverity.INFO,
    icon: 'IconChartPie'
  },
  
  [AlertTypes.PAYDAY_REMINDER]: {
    title: () => `Payday Allocation Reminder`,
    message: (targets) => 
      `Payday is approaching! Don't forget to allocate funds to your savings goals: ${targets.join(', ')}.`,
    severity: AlertSeverity.INFO,
    icon: 'IconPigMoney'
  },
  
  [AlertTypes.RECURRING_DUE]: {
    title: (count) => `${count} Recurring Expenses Due`,
    message: (expenses) => 
      `You have recurring expenses ready to generate: ${expenses.map(e => e.name).join(', ')}.`,
    severity: AlertSeverity.WARNING,
    icon: 'IconCalendarRepeat'
  }
}

// Alert Validation Rules
export const AlertValidation = {
  validateAlert: (alertData) => {
    const errors = []
    
    if (!alertData.alert_type || !Object.values(AlertTypes).includes(alertData.alert_type)) {
      errors.push('Invalid alert type')
    }
    
    if (!alertData.title || alertData.title.length < 1) {
      errors.push('Alert title is required')
    }
    
    if (!alertData.message || alertData.message.length < 1) {
      errors.push('Alert message is required')
    }
    
    if (!alertData.severity || !Object.values(AlertSeverity).includes(alertData.severity)) {
      errors.push('Invalid alert severity')
    }
    
    if (alertData.channels && !Array.isArray(alertData.channels)) {
      errors.push('Channels must be an array')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  validateBudgetThreshold: (threshold) => {
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 200) {
      return { valid: false, error: 'Threshold must be a number between 0 and 200' }
    }
    return { valid: true }
  },
  
  validatePaydayConfig: (config) => {
    const errors = []
    
    if (!config.payday_date || config.payday_date < 1 || config.payday_date > 31) {
      errors.push('Payday date must be between 1 and 31')
    }
    
    if (config.reminder_days_before && (config.reminder_days_before < 0 || config.reminder_days_before > 30)) {
      errors.push('Reminder days must be between 0 and 30')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Alert Error Messages
export const AlertErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  ALERT_NOT_FOUND: 'Alert not found',
  INVALID_ALERT_DATA: 'Invalid alert data',
  PERMISSION_DENIED: 'Permission denied',
  NOTIFICATION_SEND_FAILED: 'Failed to send notification',
  DATABASE_ERROR: 'Database error',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

// Predefined Alert Preferences
export const DefaultAlertPreferences = {
  budget_warnings: {
    enabled: true,
    threshold: BudgetThresholds.WARNING,
    channels: [NotificationChannels.IN_APP]
  },
  monthly_summary: {
    enabled: true,
    day_of_month: 1, // First day of each month
    channels: [NotificationChannels.IN_APP]
  },
  payday_reminders: {
    enabled: false, // Disabled by default until user sets payday
    reminder_days_before: 3,
    channels: [NotificationChannels.IN_APP]
  },
  recurring_due: {
    enabled: true,
    channels: [NotificationChannels.IN_APP]
  }
}

// Helper Functions
export const AlertHelpers = {
  getBudgetPercentage: (spent, limit) => {
    if (limit <= 0) return 0
    return Math.round((spent / limit) * 100)
  },
  
  getSeverityForBudgetPercentage: (percentage) => {
    if (percentage >= BudgetThresholds.SEVERE) return AlertSeverity.CRITICAL
    if (percentage >= BudgetThresholds.CRITICAL) return AlertSeverity.CRITICAL
    if (percentage >= BudgetThresholds.WARNING) return AlertSeverity.WARNING
    if (percentage >= BudgetThresholds.EARLY_WARNING) return AlertSeverity.INFO
    return AlertSeverity.SUCCESS
  },
  
  shouldTriggerBudgetAlert: (spent, limit, threshold = BudgetThresholds.WARNING) => {
    const percentage = AlertHelpers.getBudgetPercentage(spent, limit)
    return percentage >= threshold
  },
  
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  },
  
  getRelativeTime: (date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }
}