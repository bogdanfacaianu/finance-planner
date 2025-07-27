import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { 
  RecurringFrequency,
  RecurringStatus,
  RecurringValidation,
  RecurringErrors,
  WeeklyDays,
  MonthlyPatterns
} from 'src/domains/recurring-transactions/types'

/**
 * Recurring Transaction Service
 * Handles CRUD operations and automatic expense generation for recurring transactions
 */
class RecurringTransactionService {
  /**
   * Create a new recurring transaction
   * @param {Object} recurringData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async createRecurringTransaction(recurringData) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate input data
      const validation = this._validateRecurringTransaction(recurringData)
      if (!validation.valid) {
        return { data: null, error: validation.error }
      }

      const validatedData = validation.data

      // Calculate next generation date
      const nextGenDate = this._calculateNextGenerationDate(
        validatedData.start_date,
        validatedData.frequency,
        validatedData.frequency_config
      )

      // Prepare database record
      const dbRecord = {
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description || '',
        amount: validatedData.amount,
        category: validatedData.category,
        frequency: validatedData.frequency,
        frequency_config: validatedData.frequency_config,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date || null,
        status: RecurringStatus.ACTIVE,
        next_generation_date: nextGenDate,
        last_generated_date: null,
        total_generated: 0,
        max_generations: validatedData.max_generations || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into database
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([dbRecord])
        .select()
        .single()

      if (error) {
        console.error('Database error creating recurring transaction:', error)
        return { data: null, error: RecurringErrors.DATABASE_ERROR }
      }

      return { data, error: null }

    } catch (err) {
      console.error('Error creating recurring transaction:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get all recurring transactions for current user
   * @param {Object} filters
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getRecurringTransactions(filters = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      let query = supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters.frequency) {
        query = query.eq('frequency', filters.frequency)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database error fetching recurring transactions:', error)
        return { data: null, error: RecurringErrors.DATABASE_ERROR }
      }

      return { data: data || [], error: null }

    } catch (err) {
      console.error('Error fetching recurring transactions:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Update a recurring transaction
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async updateRecurringTransaction(id, updateData) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate update data
      const validation = this._validateRecurringTransaction(updateData, true)
      if (!validation.valid) {
        return { data: null, error: validation.error }
      }

      const validatedData = validation.data

      // Recalculate next generation date if frequency changed
      let nextGenDate = undefined
      if (validatedData.frequency || validatedData.frequency_config) {
        const { data: existing } = await supabase
          .from('recurring_transactions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (existing) {
          nextGenDate = this._calculateNextGenerationDate(
            validatedData.start_date || existing.start_date,
            validatedData.frequency || existing.frequency,
            validatedData.frequency_config || existing.frequency_config,
            existing.last_generated_date
          )
        }
      }

      // Prepare update record
      const updateRecord = {
        ...validatedData,
        updated_at: new Date().toISOString()
      }

      if (nextGenDate) {
        updateRecord.next_generation_date = nextGenDate
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updateRecord)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error updating recurring transaction:', error)
        return { data: null, error: RecurringErrors.DATABASE_ERROR }
      }

      if (!data) {
        return { data: null, error: RecurringErrors.RECURRING_NOT_FOUND }
      }

      return { data, error: null }

    } catch (err) {
      console.error('Error updating recurring transaction:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Delete a recurring transaction
   * @param {string} id
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async deleteRecurringTransaction(id) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Database error deleting recurring transaction:', error)
        return { data: null, error: RecurringErrors.DATABASE_ERROR }
      }

      return { data: true, error: null }

    } catch (err) {
      console.error('Error deleting recurring transaction:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Toggle active status of a recurring transaction
   * @param {string} id
   * @param {boolean} isActive
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async toggleRecurringTransaction(id, isActive) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      const status = isActive ? RecurringStatus.ACTIVE : RecurringStatus.PAUSED

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ 
          is_active: isActive, 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error toggling recurring transaction:', error)
        return { data: null, error: RecurringErrors.DATABASE_ERROR }
      }

      if (!data) {
        return { data: null, error: RecurringErrors.RECURRING_NOT_FOUND }
      }

      return { data, error: null }

    } catch (err) {
      console.error('Error toggling recurring transaction:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Generate due expenses from all active recurring transactions
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async generateDueRecurringExpenses() {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      // Get all active recurring transactions that are due
      const today = new Date().toISOString().split('T')[0]
      
      const { data: dueTransactions, error: fetchError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('status', RecurringStatus.ACTIVE)
        .lte('next_generation_date', today)

      if (fetchError) {
        console.error('Error fetching due recurring transactions:', fetchError)
        return { data: null, error: RecurringErrors.DATABASE_ERROR }
      }

      const results = {
        total_processed: dueTransactions?.length || 0,
        successful_generations: 0,
        failed_generations: 0,
        generated_expenses: [],
        errors: []
      }

      // Process each due transaction
      for (const recurring of dueTransactions || []) {
        try {
          const generation = await this._generateExpenseFromRecurring(recurring)
          
          if (generation.success) {
            results.successful_generations++
            results.generated_expenses.push(generation.expense)
            
            // Update recurring transaction
            await this._updateRecurringAfterGeneration(recurring)
          } else {
            results.failed_generations++
            results.errors.push({
              recurring_id: recurring.id,
              error: generation.error
            })
          }
        } catch (err) {
          results.failed_generations++
          results.errors.push({
            recurring_id: recurring.id,
            error: err.message
          })
        }
      }

      return { data: results, error: null }

    } catch (err) {
      console.error('Error generating recurring expenses:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get upcoming recurring expenses for preview
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getUpcomingRecurringExpenses(days = 30) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: RecurringErrors.USER_NOT_AUTHENTICATED }
      }

      const { data: activeRecurring, error } = await this.getRecurringTransactions({
        is_active: true,
        status: RecurringStatus.ACTIVE
      })

      if (error) {
        return { data: null, error }
      }

      const upcoming = []
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      for (const recurring of activeRecurring || []) {
        const upcomingDates = this._generateUpcomingDates(
          recurring,
          new Date(),
          endDate
        )

        for (const date of upcomingDates) {
          upcoming.push({
            recurring_id: recurring.id,
            name: recurring.name,
            amount: recurring.amount,
            category: recurring.category,
            frequency: recurring.frequency,
            projected_date: date,
            description: recurring.description
          })
        }
      }

      // Sort by projected date
      upcoming.sort((a, b) => new Date(a.projected_date) - new Date(b.projected_date))

      return { data: upcoming, error: null }

    } catch (err) {
      console.error('Error getting upcoming recurring expenses:', err)
      return { data: null, error: RecurringErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Validate recurring transaction data
   * @private
   */
  _validateRecurringTransaction(data, isUpdate = false) {
    const errors = []
    const validatedData = {}

    // Name validation (required for create, optional for update)
    if (data.name !== undefined) {
      const nameValidation = RecurringValidation.validateName(data.name)
      if (nameValidation.valid) {
        validatedData.name = nameValidation.value
      } else {
        errors.push(nameValidation.error)
      }
    } else if (!isUpdate) {
      errors.push('Name is required')
    }

    // Amount validation
    if (data.amount !== undefined) {
      const amountValidation = RecurringValidation.validateAmount(data.amount)
      if (amountValidation.valid) {
        validatedData.amount = amountValidation.value
      } else {
        errors.push(amountValidation.error)
      }
    } else if (!isUpdate) {
      errors.push('Amount is required')
    }

    // Frequency validation
    if (data.frequency !== undefined && data.frequency_config !== undefined) {
      const freqValidation = RecurringValidation.validateFrequency(data.frequency, data.frequency_config)
      if (freqValidation.valid) {
        validatedData.frequency = freqValidation.value.frequency
        validatedData.frequency_config = freqValidation.value.config
      } else {
        errors.push(freqValidation.error)
      }
    } else if (!isUpdate) {
      errors.push('Frequency and frequency configuration are required')
    }

    // Date range validation
    if (data.start_date !== undefined) {
      const dateValidation = RecurringValidation.validateDateRange(data.start_date, data.end_date)
      if (dateValidation.valid) {
        validatedData.start_date = dateValidation.value.startDate.toISOString().split('T')[0]
        if (dateValidation.value.endDate) {
          validatedData.end_date = dateValidation.value.endDate.toISOString().split('T')[0]
        }
      } else {
        errors.push(dateValidation.error)
      }
    } else if (!isUpdate) {
      errors.push('Start date is required')
    }

    // Optional fields
    if (data.description !== undefined) {
      validatedData.description = data.description.trim()
    }
    if (data.category !== undefined) {
      validatedData.category = data.category
    }
    if (data.max_generations !== undefined) {
      validatedData.max_generations = parseInt(data.max_generations)
    }

    if (errors.length > 0) {
      return { valid: false, error: errors.join(', ') }
    }

    return { valid: true, data: validatedData }
  }

  /**
   * Calculate next generation date based on frequency
   * @private
   */
  _calculateNextGenerationDate(startDate, frequency, config, lastGenerated = null) {
    const baseDate = lastGenerated ? new Date(lastGenerated) : new Date(startDate)
    const nextDate = new Date(baseDate)

    switch (frequency) {
      case RecurringFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + (config.interval || 1))
        break

      case RecurringFrequency.WEEKLY:
        // Find next occurrence of specified days
        if (config.days && config.days.length > 0) {
          const currentDay = nextDate.getDay()
          const targetDays = config.days.sort((a, b) => a - b)
          
          let found = false
          for (const targetDay of targetDays) {
            if (targetDay > currentDay) {
              nextDate.setDate(nextDate.getDate() + (targetDay - currentDay))
              found = true
              break
            }
          }
          
          if (!found) {
            // Move to next week and use first target day
            const daysToAdd = 7 - currentDay + targetDays[0]
            nextDate.setDate(nextDate.getDate() + daysToAdd)
          }
        } else {
          nextDate.setDate(nextDate.getDate() + 7 * (config.interval || 1))
        }
        break

      case RecurringFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + (config.interval || 1))
        if (config.day_of_month) {
          nextDate.setDate(config.day_of_month)
        }
        break

      case RecurringFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + (config.interval || 1))
        if (config.month) {
          nextDate.setMonth(config.month - 1)
        }
        if (config.day) {
          nextDate.setDate(config.day)
        }
        break

      case RecurringFrequency.CUSTOM:
        if (config.interval_days) {
          nextDate.setDate(nextDate.getDate() + config.interval_days)
        }
        break
    }

    return nextDate.toISOString().split('T')[0]
  }

  /**
   * Generate expense from recurring transaction
   * @private
   */
  async _generateExpenseFromRecurring(recurring) {
    try {
      const expenseData = {
        amount: recurring.amount,
        category: recurring.category,
        date: recurring.next_generation_date,
        notes: `${recurring.description} (Auto-generated from "${recurring.name}")`
      }

      const { data: expense, error } = await expenseService.createExpense(expenseData)

      if (error) {
        return { success: false, error }
      }

      return { success: true, expense }

    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Update recurring transaction after successful generation
   * @private
   */
  async _updateRecurringAfterGeneration(recurring) {
    const nextGenDate = this._calculateNextGenerationDate(
      recurring.start_date,
      recurring.frequency,
      recurring.frequency_config,
      recurring.next_generation_date
    )

    const updates = {
      last_generated_date: recurring.next_generation_date,
      next_generation_date: nextGenDate,
      total_generated: (recurring.total_generated || 0) + 1,
      updated_at: new Date().toISOString()
    }

    // Check if we've reached max generations or end date
    if (recurring.max_generations && updates.total_generated >= recurring.max_generations) {
      updates.status = RecurringStatus.ENDED
      updates.is_active = false
    } else if (recurring.end_date && nextGenDate > recurring.end_date) {
      updates.status = RecurringStatus.ENDED
      updates.is_active = false
    }

    await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', recurring.id)
  }

  /**
   * Generate upcoming dates for a recurring transaction
   * @private
   */
  _generateUpcomingDates(recurring, startDate, endDate) {
    const dates = []
    let currentDate = new Date(Math.max(new Date(recurring.next_generation_date), startDate))

    while (currentDate <= endDate && dates.length < 50) { // Limit to prevent infinite loops
      if (recurring.end_date && currentDate > new Date(recurring.end_date)) {
        break
      }

      dates.push(currentDate.toISOString().split('T')[0])

      // Calculate next date
      const nextDateStr = this._calculateNextGenerationDate(
        recurring.start_date,
        recurring.frequency,
        recurring.frequency_config,
        currentDate.toISOString().split('T')[0]
      )
      
      currentDate = new Date(nextDateStr)
    }

    return dates
  }
}

// Export singleton instance
export const recurringTransactionService = new RecurringTransactionService()
export default recurringTransactionService