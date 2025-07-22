/**
 * Authentication Domain Types
 */

export const AuthState = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
}

export const AuthErrors = {
  INVALID_CREDENTIALS: 'Invalid email or password. Make sure you have an account created.',
  EMAIL_NOT_CONFIRMED: 'Please check your email and click the confirmation link.',
  PASSWORD_RESET_FAILED: 'Password reset failed',
  UNEXPECTED_ERROR: 'An unexpected error occurred'
}

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {Object} user_metadata - User metadata
 * @property {string} created_at - User creation timestamp
 */

/**
 * @typedef {Object} AuthSession
 * @property {User} user - Authenticated user
 * @property {string} access_token - JWT access token
 * @property {string} refresh_token - JWT refresh token
 * @property {number} expires_at - Token expiration timestamp
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - User email
 * @property {string} password - User password
 */

/**
 * @typedef {Object} PasswordResetRequest
 * @property {string} email - User email for password reset
 * @property {string} redirectTo - URL to redirect after reset
 */