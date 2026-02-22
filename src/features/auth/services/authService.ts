/**
 * Authentication Service
 *
 * Barrel file — creates singleton instance and re-exports public types.
 *
 * Usage:
 *   import { authService } from '@/features/auth/services/authService';
 *   const user = authService.getCurrentUser();
 */

import { AuthService } from './authService.api';

// Re-export all public types for consumers
export { TOKEN_KEY, ROLE_PERMISSIONS } from './authService.types';
export type {
    LoginResponse,
    RegisterResponse,
    ForgotPasswordResponse,
    ResetPasswordResponse,
} from './authService.types';

// Export singleton instance
export const authService = new AuthService();
