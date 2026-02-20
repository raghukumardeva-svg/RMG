import apiClient from './api';
import type { User, UserRole } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthenticatedUser extends User {
  role: UserRole;
  department: string;
  employeeId: string;
}

/**
 * Authentication service for secure backend authentication
 * NOTE: This expects a proper backend authentication API
 */
const authService = {
  /**
   * Authenticate user with email and password
   * @param credentials User login credentials
   * @returns Authenticated user data and token
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

      // Store token securely
      if (response.data.token) {
        localStorage.setItem('auth-token', response.data.token);
      }

      if (response.data.refreshToken) {
        localStorage.setItem('refresh-token', response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      // Clear any existing tokens on failed login
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout API call failed, but we'll clear tokens anyway
    } finally {
      // Clear tokens regardless of API call result
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
    }
  },

  /**
   * Refresh authentication token
   * @returns New token
   */
  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh-token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });

    if (response.data.token) {
      localStorage.setItem('auth-token', response.data.token);
    }

    return response.data.token;
  },

  /**
   * Verify current token is valid
   * @returns Current user data if token is valid
   */
  verifyToken: async (): Promise<AuthenticatedUser> => {
    const response = await apiClient.get<AuthenticatedUser>('/auth/verify');
    return response.data;
  },

  /**
   * Request password reset
   * @param email User email address
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   * @param token Reset token from email
   * @param newPassword New password
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  /**
   * Change current user password
   * @param currentPassword Current password
   * @param newPassword New password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};

export default authService;
