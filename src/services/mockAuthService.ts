/**
 * Mock Authentication Service
 *
 * This service provides authentication using local data files.
 * Use this for development when backend API is not available.
 *
 * To switch between mock and real API:
 * - Set VITE_USE_MOCK_API=true in .env for mock mode
 * - Set VITE_USE_MOCK_API=false for real backend API
 */

import type { User, UserRole } from '@/types';
import authorizedUsers from '@/data/users.json';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface AuthorizedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  employeeId: string;
}

/**
 * Mock authentication service using local data
 * Simulates backend API behavior for development
 */
const mockAuthService = {
  /**
   * Authenticate user with email and password (MOCK)
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by email
    const user = (authorizedUsers as AuthorizedUser[]).find(
      u => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    // Validate email exists
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Validate password matches
    if (user.password !== credentials.password) {
      throw new Error('Invalid credentials');
    }

    // Generate mock token
    const mockToken = `mock_token_${user.id}_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_${user.id}_${Date.now()}`;

    // Store token
    localStorage.setItem('auth-token', mockToken);
    localStorage.setItem('refresh-token', mockRefreshToken);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: mockToken,
      refreshToken: mockRefreshToken,
    };
  },

  /**
   * Logout current user (MOCK)
   */
  logout: async (): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clear tokens
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
  },

  /**
   * Refresh authentication token (MOCK)
   */
  refreshToken: async (): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const refreshToken = localStorage.getItem('refresh-token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Generate new mock token
    const newToken = `mock_token_refreshed_${Date.now()}`;
    localStorage.setItem('auth-token', newToken);

    return newToken;
  },

  /**
   * Verify current token is valid (MOCK)
   */
  verifyToken: async (): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('auth-token');

    if (!token || !token.startsWith('mock_token')) {
      throw new Error('Invalid token');
    }

    // Extract user ID from token (mock implementation)
    const userId = token.split('_')[2];

    const user = (authorizedUsers as AuthorizedUser[]).find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Request password reset (MOCK)
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = (authorizedUsers as AuthorizedUser[]).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return;
    }

    // In real implementation, this would send an email
    console.warn('MOCK: Password reset email would be sent to:', email);
  },

  /**
   * Reset password with token (MOCK)
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation
    if (!token || newPassword.length < 8) {
      throw new Error('Invalid token or password');
    }

    console.warn('MOCK: Password would be reset. New password length:', newPassword.length);
  },

  /**
   * Change current user password (MOCK)
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation
    if (!currentPassword || newPassword.length < 8) {
      throw new Error('Invalid password');
    }

    console.warn('MOCK: Password would be changed');
  },
};

export default mockAuthService;
