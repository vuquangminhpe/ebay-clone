import configBase from '@/constants/config'
import {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '@/types/Auth.type'
import { SuccessResponse } from '@/types/utils.type'
import { User, UserProfile } from '@/types/User.type'
import http from '@/utils/http'

/**
 * API client for authentication and user management
 * Accessible by: All users (some endpoints have role restrictions)
 */
export const UsersApi = {
  // Public endpoints (no authentication required)

  /**
   * Login with email and password
   * @access Public
   */
  login: (params: LoginRequest) =>
    http.post<SuccessResponse<{ access_token: string; user: User }>>('/users/login', params),

  /**
   * Register a new user
   * @access Public
   */
  register: (params: RegisterRequest) => http.post<SuccessResponse<{ message: string }>>('/users/register', params),

  /**
   * Verify email address
   * @access Public
   */
  verifyEmail: (token: string) =>
    http.post<SuccessResponse<{ access_token: string; refresh_token: string }>>('/users/verify-email', { token }),

  /**
   * Request forgot password email
   * @access Public
   */
  forgotPassword: (params: ForgotPasswordRequest) =>
    http.post<SuccessResponse<{ message: string }>>('/users/forgot-password', params),

  /**
   * Reset password with token
   * @access Public
   */
  resetPassword: (params: ResetPasswordRequest) =>
    http.post<SuccessResponse<{ message: string }>>('/users/reset-password', params),

  /**
   * Verify forgot password token
   * @access Public
   */
  verifyForgotPassword: (token: string) =>
    http.post<SuccessResponse<{ message: string }>>('/users/verify-forgot-password', { token }),

  /**
   * OAuth login with Google
   * @access Public
   */
  oauthGoogle: () => http.get<string>('/users/oauth/google'),

  /**
   * Search users by name
   * @access Public
   */
  searchUsers: (name: string, page: number = 1, limit: number = 10) =>
    http.get<SuccessResponse<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>>(
      '/users/search',
      { params: { name, page, limit } }
    ),

  // Protected endpoints (authentication required)

  /**
   * Logout (requires refresh token)
   * @access Private - Any authenticated user
   */
  logout: (refresh_token: string) =>
    http.post<SuccessResponse<{ message: string }>>('/users/logout', { refresh_token }),

  /**
   * Refresh access token
   * @access Private - Any authenticated user
   */
  refreshToken: (refresh_token: string) =>
    http.post<SuccessResponse<{ access_token: string; refresh_token: string }>>('/users/refresh-token', {
      refresh_token
    }),

  /**
   * Resend verification email
   * @access Private - Unverified users
   */
  resendVerifyEmail: () => http.post<SuccessResponse<{ message: string }>>('/users/resend-verify-email'),

  /**
   * Get current user profile
   * @access Private - Any authenticated user
   */
  getMe: () => http.get<SuccessResponse<User>>('/users/me'),

  /**
   * Update current user profile
   * @access Private - Any authenticated user
   */
  updateMe: (params: UpdateProfileRequest) => http.patch<SuccessResponse<User>>('/users/me', params),

  /**
   * Change password
   * @access Private - Any authenticated user
   */
  changePassword: (params: ChangePasswordRequest) =>
    http.post<SuccessResponse<{ message: string }>>('/users/change-password', params),

  /**
   * Get user profile by username
   * @access Public
   */
  getProfileByUsername: (username: string) => http.get<SuccessResponse<UserProfile>>(`/users/${username}`),

  /**
   * Get user profile by ID
   * @access Public
   */
  getProfileById: (user_id: string) => http.get<SuccessResponse<UserProfile>>(`/users/profile/${user_id}`),

  /**
   * Get user's following list
   * @access Private - Any authenticated user
   */
  getFollowing: () => http.get<SuccessResponse<{ message: string }>>('/users/me/following'),

  /**
   * Get user's followers list
   * @access Private - Any authenticated user
   */
  getFollowers: () => http.get<SuccessResponse<{ message: string }>>('/users/me/followers'),

  /**
   * Follow a user
   * @access Private - Any authenticated user
   */
  follow: (followed_user_id: string) =>
    http.post<SuccessResponse<{ message: string }>>('/users/follow', { user_id: followed_user_id }),

  /**
   * Unfollow a user
   * @access Private - Any authenticated user
   */
  unfollow: (followed_user_id: string) =>
    http.delete<SuccessResponse<{ message: string }>>('/users/un-follow', { data: { user_id: followed_user_id } }),

  // Admin only endpoints

  /**
   * Get all users (paginated)
   * @access Private - Admin only
   */
  getAllUsers: (page: number = 1, limit: number = 10) =>
    http.get<SuccessResponse<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>>(
      '/users/all',
      { params: { page, limit } }
    )
}
