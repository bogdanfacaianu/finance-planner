/**
 * Transaction Import Domain Types
 */

// Import Status
export const ImportStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIALLY_COMPLETED: 'partially_completed'
}

// CSV Column Mapping
export const CSVColumnMapping = {
  amount: 'string',
  date: 'string',
  description: 'string',
  category: 'string',
  notes: 'string'
}

// Import Request
export const ImportRequest = {
  file: 'File',
  column_mapping: 'object',
  skip_header_row: 'boolean',
  date_format: 'string'
}

// Import Result
export const ImportResult = {
  id: 'string',
  user_id: 'string',
  filename: 'string',
  total_rows: 'number',
  processed_rows: 'number',
  successful_imports: 'number',
  failed_imports: 'number',
  status: 'string',
  errors: 'array',
  created_at: 'timestamp'
}

// Import Validation Rules
export const ImportValidation = {
  validateAmount: (amount) => {
    if (!amount) return { valid: false, error: 'Amount is required' }
    const numAmount = parseFloat(amount.toString().replace(/[£$,]/g, ''))
    if (isNaN(numAmount)) return { valid: false, error: 'Invalid amount format' }
    if (numAmount <= 0) return { valid: false, error: 'Amount must be greater than 0' }
    return { valid: true, value: numAmount }
  },

  validateDate: (date, format = 'auto') => {
    if (!date) return { valid: false, error: 'Date is required' }
    
    // Try to parse various date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or DD/M/YYYY
    ]
    
    let parsedDate
    try {
      // Try ISO format first
      if (dateFormats[0].test(date)) {
        parsedDate = new Date(date)
      } else if (dateFormats[1].test(date) || dateFormats[2].test(date) || dateFormats[3].test(date)) {
        // UK format DD/MM/YYYY or DD-MM-YYYY
        const parts = date.split(/[\/\-]/)
        if (parts.length === 3) {
          parsedDate = new Date(parts[2], parts[1] - 1, parts[0])
        }
      } else {
        parsedDate = new Date(date)
      }
      
      if (isNaN(parsedDate.getTime())) {
        return { valid: false, error: 'Invalid date format' }
      }
      
      return { valid: true, value: parsedDate.toISOString().split('T')[0] }
    } catch (err) {
      return { valid: false, error: 'Failed to parse date' }
    }
  },

  validateDescription: (description) => {
    if (!description || description.trim().length === 0) {
      return { valid: false, error: 'Description is required' }
    }
    if (description.length > 200) {
      return { valid: false, error: 'Description too long (max 200 characters)' }
    }
    return { valid: true, value: description.trim() }
  },

  validateCategory: (category, availableCategories = []) => {
    if (!category) return { valid: false, error: 'Category is required' }
    
    // Try to find exact match first
    const exactMatch = availableCategories.find(cat => 
      cat.name.toLowerCase() === category.toLowerCase()
    )
    if (exactMatch) {
      return { valid: true, value: exactMatch.name }
    }
    
    // Try to find partial match
    const partialMatch = availableCategories.find(cat => 
      cat.name.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(cat.name.toLowerCase())
    )
    if (partialMatch) {
      return { valid: true, value: partialMatch.name, suggestion: true }
    }
    
    // Default to 'Other' if available
    const otherCategory = availableCategories.find(cat => 
      cat.name.toLowerCase() === 'other'
    )
    if (otherCategory) {
      return { valid: true, value: otherCategory.name, defaulted: true }
    }
    
    return { valid: false, error: 'Category not found and no default available' }
  }
}

// Import Errors
export const ImportErrors = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  FILE_NOT_PROVIDED: 'No file provided',
  INVALID_FILE_TYPE: 'Invalid file type. Please provide a CSV file',
  FILE_TOO_LARGE: 'File too large. Maximum size is 5MB',
  INVALID_CSV_FORMAT: 'Invalid CSV format',
  NO_DATA_ROWS: 'No data rows found in CSV',
  COLUMN_MAPPING_REQUIRED: 'Column mapping is required',
  PARSING_ERROR: 'Error parsing CSV file',
  VALIDATION_ERROR: 'Validation error',
  DATABASE_ERROR: 'Database error during import',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

// Supported Date Formats
export const SupportedDateFormats = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-03-15)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (15/03/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (03/15/2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (15-03-2024)' }
]

// CSV File Constraints
export const CSVConstraints = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_ROWS: 10000,
  ALLOWED_EXTENSIONS: ['.csv'],
  REQUIRED_COLUMNS: ['amount', 'date'],
  OPTIONAL_COLUMNS: ['description', 'category', 'notes']
}