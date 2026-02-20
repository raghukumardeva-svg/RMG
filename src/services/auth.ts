/**
 * Adaptive Authentication Service
 *
 * Automatically switches between mock (development) and real API (production)
 * based on environment configuration.
 *
 * Environment Variables:
 * - VITE_USE_MOCK_API=true  -> Use mock data (development)
 * - VITE_USE_MOCK_API=false -> Use real backend API (production)
 */

import realAuthService from './authService';

// Check environment variable
const useMockAPI = import.meta.env.VITE_USE_MOCK_API === 'true';

// Log current mode (helps with debugging)
if (import.meta.env.DEV) {
  console.info(
    `🔐 Auth Mode: ${useMockAPI ? 'MOCK (Development)' : 'REAL API (Production)'}`
  );
}

/**
 * Adaptive auth service
 * Automatically uses mock or real API based on environment
 */
const authService = realAuthService;

export default authService;

// Export types for convenience
export type { LoginRequest, LoginResponse } from './authService';
