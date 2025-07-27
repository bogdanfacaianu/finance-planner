/**
 * Category Management Domain Types
 */

// Category entity type
export const CategoryEntity = {
  ID: 'string',
  USER_ID: 'string',
  NAME: 'string',
  COLOR: 'string',
  ICON: 'string',
  IS_ACTIVE: 'boolean',
  CREATED_AT: 'timestamp'
}

// Category request types
export const CreateCategoryRequest = {
  name: 'string',
  color: 'string',
  icon: 'string'
}

export const UpdateCategoryRequest = {
  name: 'string',
  color: 'string', 
  icon: 'string',
  is_active: 'boolean'
}

// Category filters
export const CategoryFilters = {
  is_active: 'boolean|null',
  search: 'string|null'
}

// Category errors
export const CategoryErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_ALREADY_EXISTS: 'Category with this name already exists',
  INVALID_CATEGORY_DATA: 'Invalid category data provided',
  INVALID_NAME: 'Category name is required',
  INVALID_COLOR: 'Invalid color provided',
  CATEGORY_CREATE_FAILED: 'Failed to create category',
  CATEGORY_UPDATE_FAILED: 'Failed to update category',
  CATEGORY_DELETE_FAILED: 'Failed to delete category',
  CATEGORY_IN_USE: 'Cannot delete category that is being used in budgets or expenses',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

// Category validation
export const CategoryValidation = {
  validateName: (name) => {
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 50
  },

  validateColor: (color) => {
    const validColors = [
      'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red',
      'pink', 'grape', 'violet', 'indigo', 'gray', 'dark'
    ]
    return typeof color === 'string' && validColors.includes(color)
  },

  validateIcon: (icon) => {
    return typeof icon === 'string' && icon.trim().length > 0
  }
}

// Default category colors
export const DEFAULT_CATEGORY_COLORS = [
  'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 
  'orange', 'red', 'pink', 'grape', 'violet', 'indigo'
]

// Default category icons (Tabler icons without Icon prefix)
export const DEFAULT_CATEGORY_ICONS = [
  'Car', 'Coffee', 'ShoppingCart', 'Heart', 'Home', 'Stethoscope',
  'Plane', 'Book', 'Brush', 'Gift', 'Dots', 'Wallet',
  'CreditCard', 'Building', 'Bus', 'GameController'
]

// Predefined categories for new users
export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: 'orange', icon: 'Coffee' },
  { name: 'Transportation', color: 'blue', icon: 'Car' },
  { name: 'Shopping', color: 'pink', icon: 'ShoppingCart' },
  { name: 'Entertainment', color: 'violet', icon: 'GameController' },
  { name: 'Bills & Utilities', color: 'red', icon: 'Home' },
  { name: 'Healthcare', color: 'green', icon: 'Stethoscope' },
  { name: 'Travel', color: 'cyan', icon: 'Plane' },
  { name: 'Education', color: 'indigo', icon: 'Book' },
  { name: 'Personal Care', color: 'teal', icon: 'Brush' },
  { name: 'Gifts & Donations', color: 'yellow', icon: 'Gift' },
  { name: 'Other', color: 'gray', icon: 'Dots' }
]