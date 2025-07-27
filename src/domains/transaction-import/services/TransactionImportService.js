import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { 
  ImportErrors, 
  ImportValidation, 
  CSVConstraints,
  ImportStatus 
} from 'src/domains/transaction-import/types'

/**
 * Transaction Import Service
 * Handles CSV file parsing and bulk transaction imports
 */
class TransactionImportService {
  /**
   * Parse CSV file and validate format
   * @param {File} file
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async parseCSVFile(file) {
    try {
      // Validate file
      const fileValidation = this._validateFile(file)
      if (!fileValidation.valid) {
        return { data: null, error: fileValidation.error }
      }

      // Read file content
      const content = await this._readFileContent(file)
      if (!content) {
        return { data: null, error: ImportErrors.PARSING_ERROR }
      }

      // Parse CSV
      const rows = this._parseCSVContent(content)
      if (!rows || rows.length === 0) {
        return { data: null, error: ImportErrors.NO_DATA_ROWS }
      }

      return { data: rows, error: null }

    } catch (err) {
      console.error('CSV parsing error:', err)
      return { data: null, error: ImportErrors.PARSING_ERROR }
    }
  }

  /**
   * Preview import with validation
   * @param {Array} csvRows
   * @param {Object} columnMapping
   * @param {boolean} skipHeaderRow
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async previewImport(csvRows, columnMapping, skipHeaderRow = true) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: ImportErrors.USER_NOT_AUTHENTICATED }
      }

      // Get available categories
      const { data: categories } = await categoryService.getCategories({ is_active: true })

      // Process rows
      const dataRows = skipHeaderRow ? csvRows.slice(1) : csvRows
      const preview = {
        total_rows: dataRows.length,
        valid_rows: 0,
        invalid_rows: 0,
        samples: [],
        errors: [],
        warnings: []
      }

      // Validate first 10 rows for preview
      const sampleSize = Math.min(10, dataRows.length)
      for (let i = 0; i < sampleSize; i++) {
        const row = dataRows[i]
        const validation = this._validateRow(row, columnMapping, categories || [], i + 1)
        
        preview.samples.push({
          row_number: i + 1,
          original: row,
          mapped: validation.mappedData,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings
        })

        if (validation.valid) {
          preview.valid_rows++
        } else {
          preview.invalid_rows++
          preview.errors.push(...validation.errors.map(err => ({
            row: i + 1,
            error: err
          })))
        }

        preview.warnings.push(...validation.warnings.map(warn => ({
          row: i + 1,
          warning: warn
        })))
      }

      // Estimate full file validation
      preview.estimated_valid = Math.round((preview.valid_rows / sampleSize) * dataRows.length)
      preview.estimated_invalid = dataRows.length - preview.estimated_valid

      return { data: preview, error: null }

    } catch (err) {
      console.error('Preview error:', err)
      return { data: null, error: ImportErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Import transactions from CSV
   * @param {Array} csvRows
   * @param {Object} columnMapping
   * @param {boolean} skipHeaderRow
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async importTransactions(csvRows, columnMapping, skipHeaderRow = true) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: ImportErrors.USER_NOT_AUTHENTICATED }
      }

      // Get available categories
      const { data: categories } = await categoryService.getCategories({ is_active: true })

      // Process rows
      const dataRows = skipHeaderRow ? csvRows.slice(1) : csvRows
      const results = {
        total_rows: dataRows.length,
        successful_imports: 0,
        failed_imports: 0,
        errors: [],
        warnings: [],
        imported_expenses: []
      }

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        const rowNumber = i + 1

        try {
          // Validate row
          const validation = this._validateRow(row, columnMapping, categories || [], rowNumber)
          
          if (!validation.valid) {
            results.failed_imports++
            results.errors.push({
              row: rowNumber,
              errors: validation.errors
            })
            continue
          }

          // Create expense
          const expenseData = validation.mappedData
          const { data: expense, error: expenseError } = await expenseService.createExpense(expenseData)

          if (expenseError) {
            results.failed_imports++
            results.errors.push({
              row: rowNumber,
              errors: [`Failed to create expense: ${expenseError}`]
            })
          } else {
            results.successful_imports++
            results.imported_expenses.push(expense)
            
            // Add warnings if any
            if (validation.warnings.length > 0) {
              results.warnings.push({
                row: rowNumber,
                warnings: validation.warnings
              })
            }
          }

        } catch (rowError) {
          console.error(`Error processing row ${rowNumber}:`, rowError)
          results.failed_imports++
          results.errors.push({
            row: rowNumber,
            errors: [`Unexpected error: ${rowError.message}`]
          })
        }
      }

      return { data: results, error: null }

    } catch (err) {
      console.error('Import error:', err)
      return { data: null, error: ImportErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get column suggestions from CSV headers
   * @param {Array} headers
   * @returns {Object}
   */
  getColumnSuggestions(headers) {
    const suggestions = {}
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim()
      
      // Amount mapping
      if (lowerHeader.includes('amount') || lowerHeader.includes('price') || 
          lowerHeader.includes('cost') || lowerHeader.includes('total') ||
          lowerHeader.includes('£') || lowerHeader.includes('$')) {
        suggestions.amount = index
      }
      
      // Date mapping
      else if (lowerHeader.includes('date') || lowerHeader.includes('time') ||
               lowerHeader.includes('when')) {
        suggestions.date = index
      }
      
      // Description mapping
      else if (lowerHeader.includes('description') || lowerHeader.includes('desc') ||
               lowerHeader.includes('details') || lowerHeader.includes('memo') ||
               lowerHeader.includes('reference') || lowerHeader.includes('merchant')) {
        suggestions.description = index
      }
      
      // Category mapping
      else if (lowerHeader.includes('category') || lowerHeader.includes('type') ||
               lowerHeader.includes('tag')) {
        suggestions.category = index
      }
      
      // Notes mapping
      else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
        suggestions.notes = index
      }
    })
    
    return suggestions
  }

  /**
   * Validate file before processing
   * @private
   */
  _validateFile(file) {
    if (!file) {
      return { valid: false, error: ImportErrors.FILE_NOT_PROVIDED }
    }

    // Check file type
    if (!CSVConstraints.ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return { valid: false, error: ImportErrors.INVALID_FILE_TYPE }
    }

    // Check file size
    if (file.size > CSVConstraints.MAX_FILE_SIZE) {
      return { valid: false, error: ImportErrors.FILE_TOO_LARGE }
    }

    return { valid: true }
  }

  /**
   * Read file content
   * @private
   */
  _readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Parse CSV content into rows
   * @private
   */
  _parseCSVContent(content) {
    const lines = content.split('\n').filter(line => line.trim())
    const rows = []

    for (const line of lines) {
      // Simple CSV parsing (handles quoted fields)
      const row = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      row.push(current.trim())
      rows.push(row)
    }

    return rows
  }

  /**
   * Validate and map a single row
   * @private
   */
  _validateRow(row, columnMapping, categories, rowNumber) {
    const errors = []
    const warnings = []
    const mappedData = {}

    // Validate amount
    if (columnMapping.amount !== undefined) {
      const amountValue = row[columnMapping.amount]
      const amountValidation = ImportValidation.validateAmount(amountValue)
      if (amountValidation.valid) {
        mappedData.amount = amountValidation.value
      } else {
        errors.push(`Amount: ${amountValidation.error}`)
      }
    } else {
      errors.push('Amount column not mapped')
    }

    // Validate date
    if (columnMapping.date !== undefined) {
      const dateValue = row[columnMapping.date]
      const dateValidation = ImportValidation.validateDate(dateValue)
      if (dateValidation.valid) {
        mappedData.date = dateValidation.value
      } else {
        errors.push(`Date: ${dateValidation.error}`)
      }
    } else {
      errors.push('Date column not mapped')
    }

    // Validate description (optional)
    if (columnMapping.description !== undefined) {
      const descValue = row[columnMapping.description]
      if (descValue) {
        const descValidation = ImportValidation.validateDescription(descValue)
        if (descValidation.valid) {
          mappedData.notes = descValidation.value
        } else {
          warnings.push(`Description: ${descValidation.error}`)
        }
      }
    }

    // Validate category
    if (columnMapping.category !== undefined) {
      const categoryValue = row[columnMapping.category]
      if (categoryValue) {
        const categoryValidation = ImportValidation.validateCategory(categoryValue, categories)
        if (categoryValidation.valid) {
          mappedData.category = categoryValidation.value
          if (categoryValidation.suggestion) {
            warnings.push(`Category "${categoryValue}" mapped to "${categoryValidation.value}"`)
          }
          if (categoryValidation.defaulted) {
            warnings.push(`Category "${categoryValue}" not found, defaulted to "${categoryValidation.value}"`)
          }
        } else {
          errors.push(`Category: ${categoryValidation.error}`)
        }
      }
    }

    // Default category if not provided
    if (!mappedData.category && categories.length > 0) {
      const otherCategory = categories.find(cat => cat.name.toLowerCase() === 'other')
      if (otherCategory) {
        mappedData.category = otherCategory.name
        warnings.push('No category provided, defaulted to "Other"')
      } else {
        mappedData.category = categories[0].name
        warnings.push(`No category provided, defaulted to "${categories[0].name}"`)
      }
    }

    // Notes from additional columns
    if (columnMapping.notes !== undefined) {
      const notesValue = row[columnMapping.notes]
      if (notesValue) {
        mappedData.notes = (mappedData.notes ? mappedData.notes + '. ' : '') + notesValue.trim()
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      mappedData
    }
  }
}

// Export singleton instance
export const transactionImportService = new TransactionImportService()
export default transactionImportService