import { supabase } from 'src/shared/infrastructure/supabase'
import { authService } from 'src/domains/authentication/services/AuthService'
import { 
  CategoryErrors, 
  CategoryValidation, 
  DEFAULT_CATEGORIES 
} from 'src/domains/category-management/types'

/**
 * Category Service
 * Handles all category-related operations including CRUD and initialization
 */
class CategoryService {
  /**
   * Initialize default categories for a new user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async initializeDefaultCategories(userId) {
    try {
      if (!userId) {
        return { success: false, error: CategoryErrors.USER_NOT_AUTHENTICATED }
      }

      // Check if user already has categories
      const { data: existingCategories } = await supabase
        .from('user_categories')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (existingCategories && existingCategories.length > 0) {
        return { success: true, error: null } // Already initialized
      }

      // Create default categories
      const categoriesToInsert = DEFAULT_CATEGORIES.map(category => ({
        user_id: userId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        is_active: true
      }))

      const { error } = await supabase
        .from('user_categories')
        .insert(categoriesToInsert)

      if (error) {
        return { success: false, error: `${CategoryErrors.CATEGORY_CREATE_FAILED}: ${error.message}` }
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: CategoryErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Create a new category
   * @param {import('../types').CreateCategoryRequest} categoryData
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async createCategory(categoryData) {
    try {
      // Get current user
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: CategoryErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate category data
      const validationError = this._validateCategoryData(categoryData)
      if (validationError) {
        return { data: null, error: validationError }
      }

      // Check if category with this name already exists for user
      const { data: existingCategory } = await supabase
        .from('user_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', categoryData.name.trim())
        .eq('is_active', true)
        .single()

      if (existingCategory) {
        return { data: null, error: CategoryErrors.CATEGORY_ALREADY_EXISTS }
      }

      // Create category
      const { data, error } = await supabase
        .from('user_categories')
        .insert([{
          user_id: user.id,
          name: categoryData.name.trim(),
          color: categoryData.color,
          icon: categoryData.icon,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        return { data: null, error: `${CategoryErrors.CATEGORY_CREATE_FAILED}: ${error.message}` }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: CategoryErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get user's categories with optional filters
   * @param {import('../types').CategoryFilters} [filters={}]
   * @returns {Promise<{data: any[], error: string|null}>}
   */
  async getCategories(filters = {}) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: [], error: CategoryErrors.USER_NOT_AUTHENTICATED }
      }

      let query = supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      // Apply filters
      if (filters.is_active !== null && filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        return { data: [], error: error.message }
      }

      // Initialize default categories if user has none
      if (!data || data.length === 0) {
        const { success, error: initError } = await this.initializeDefaultCategories(user.id)
        if (success) {
          // Retry the query after initialization
          const { data: retryData, error: retryError } = await query
          return { data: retryData || [], error: retryError?.message || null }
        } else {
          return { data: [], error: initError }
        }
      }

      return { data: data || [], error: null }
    } catch (err) {
      return { data: [], error: CategoryErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Update an existing category
   * @param {string} categoryId
   * @param {import('../types').UpdateCategoryRequest} updates
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async updateCategory(categoryId, updates) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: CategoryErrors.USER_NOT_AUTHENTICATED }
      }

      // Validate updates
      if (updates.name && !CategoryValidation.validateName(updates.name)) {
        return { data: null, error: CategoryErrors.INVALID_NAME }
      }

      if (updates.color && !CategoryValidation.validateColor(updates.color)) {
        return { data: null, error: CategoryErrors.INVALID_COLOR }
      }

      if (updates.icon && !CategoryValidation.validateIcon(updates.icon)) {
        return { data: null, error: CategoryErrors.INVALID_CATEGORY_DATA }
      }

      // Check if new name already exists (if name is being updated)
      if (updates.name) {
        const { data: existingCategory } = await supabase
          .from('user_categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', updates.name.trim())
          .neq('id', categoryId)
          .eq('is_active', true)
          .single()

        if (existingCategory) {
          return { data: null, error: CategoryErrors.CATEGORY_ALREADY_EXISTS }
        }
      }

      // Prepare update data
      const updateData = {}
      if (updates.name) updateData.name = updates.name.trim()
      if (updates.color) updateData.color = updates.color
      if (updates.icon) updateData.icon = updates.icon
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active

      // Update category
      const { data, error } = await supabase
        .from('user_categories')
        .update(updateData)
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return { data: null, error: `${CategoryErrors.CATEGORY_UPDATE_FAILED}: ${error.message}` }
      }

      if (!data) {
        return { data: null, error: CategoryErrors.CATEGORY_NOT_FOUND }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: CategoryErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Delete a category (soft delete by setting is_active to false)
   * @param {string} categoryId
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteCategory(categoryId) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { success: false, error: CategoryErrors.USER_NOT_AUTHENTICATED }
      }

      // Check if category is being used in budgets or expenses
      const [budgetCheck, expenseCheck] = await Promise.all([
        supabase
          .from('budgets')
          .select('id')
          .eq('user_id', user.id)
          .eq('category', categoryId)
          .limit(1),
        supabase
          .from('expenses')
          .select('id')
          .eq('user_id', user.id)
          .eq('category', categoryId)
          .limit(1)
      ])

      if (budgetCheck.data?.length > 0 || expenseCheck.data?.length > 0) {
        return { success: false, error: CategoryErrors.CATEGORY_IN_USE }
      }

      // Soft delete (set is_active to false)
      const { error } = await supabase
        .from('user_categories')
        .update({ is_active: false })
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (error) {
        return { success: false, error: `${CategoryErrors.CATEGORY_DELETE_FAILED}: ${error.message}` }
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: CategoryErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async getCategoryById(categoryId) {
    try {
      const { user, error: authError } = await authService.getCurrentUser()
      if (authError || !user) {
        return { data: null, error: CategoryErrors.USER_NOT_AUTHENTICATED }
      }

      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      if (!data) {
        return { data: null, error: CategoryErrors.CATEGORY_NOT_FOUND }
      }

      return { data, error: null }
    } catch (err) {
      return { data: null, error: CategoryErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Validate category data
   * @private
   * @param {import('../types').CreateCategoryRequest} categoryData
   * @returns {string|null} Error message or null if valid
   */
  _validateCategoryData(categoryData) {
    if (!CategoryValidation.validateName(categoryData.name)) {
      return CategoryErrors.INVALID_NAME
    }

    if (!CategoryValidation.validateColor(categoryData.color)) {
      return CategoryErrors.INVALID_COLOR
    }

    if (!CategoryValidation.validateIcon(categoryData.icon)) {
      return CategoryErrors.INVALID_CATEGORY_DATA
    }

    return null
  }
}

// Export singleton instance
export const categoryService = new CategoryService()
export default categoryService