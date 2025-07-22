/**
 * Expense Categories Configuration
 */

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Other'
]

/**
 * Category color mapping for UI components
 */
export const CATEGORY_COLORS = {
  'Food & Dining': 'orange',
  'Transportation': 'blue',
  'Shopping': 'pink',
  'Entertainment': 'purple',
  'Bills & Utilities': 'red',
  'Healthcare': 'green',
  'Travel': 'cyan',
  'Education': 'indigo',
  'Personal Care': 'teal',
  'Gifts & Donations': 'yellow',
  'Other': 'gray'
}

/**
 * Get color for a specific category
 * @param {string} category - Category name
 * @returns {string} Color name for the category
 */
export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || 'gray'
}

/**
 * Convert categories to Select component format
 * @returns {Array<{value: string, label: string}>}
 */
export const getCategoryOptions = () => {
  return EXPENSE_CATEGORIES.map(category => ({
    value: category,
    label: category
  }))
}