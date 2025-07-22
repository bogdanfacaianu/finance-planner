import { supabase } from 'src/shared/infrastructure/supabase'
import { AuthErrors } from 'src/domains/authentication/types'

/**
 * Authentication Service
 * Handles all authentication-related operations
 */
class AuthService {
  /**
   * Sign in user with email and password
   * @param {import('../types').LoginCredentials} credentials
   * @returns {Promise<{data: any, error: string|null}>}
   */
  async signIn(credentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)

      if (error) {
        return {
          data: null,
          error: this._mapAuthError(error)
        }
      }

      return { data, error: null }
    } catch (err) {
      return {
        data: null,
        error: AuthErrors.UNEXPECTED_ERROR
      }
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<{error: string|null}>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (err) {
      return { error: AuthErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get current user session
   * @returns {Promise<{session: any, error: string|null}>}
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error: error?.message || null }
    } catch (err) {
      return { session: null, error: AuthErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<{user: any, error: string|null}>}
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error: error?.message || null }
    } catch (err) {
      return { user: null, error: AuthErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Send password reset email
   * @param {import('../types').PasswordResetRequest} resetRequest
   * @returns {Promise<{error: string|null}>}
   */
  async resetPassword(resetRequest) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetRequest.email,
        { redirectTo: resetRequest.redirectTo }
      )

      if (error) {
        return { error: `${AuthErrors.PASSWORD_RESET_FAILED}: ${error.message}` }
      }

      return { error: null }
    } catch (err) {
      return { error: AuthErrors.UNEXPECTED_ERROR }
    }
  }

  /**
   * Listen to authentication state changes
   * @param {Function} callback - Callback function for auth state changes
   * @returns {Object} Subscription object with unsubscribe method
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   * @private
   * @param {Object} error - Supabase error object
   * @returns {string} User-friendly error message
   */
  _mapAuthError(error) {
    if (error.message.includes('Invalid login credentials')) {
      return AuthErrors.INVALID_CREDENTIALS
    } else if (error.message.includes('Email not confirmed')) {
      return AuthErrors.EMAIL_NOT_CONFIRMED
    } else {
      return `Login failed: ${error.message}`
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService