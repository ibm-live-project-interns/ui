/**
 * Auth Service - Type Definitions
 *
 * All interfaces, types, and constants used by the authentication service.
 * Separated from implementation for clean dependency management.
 */

import type { User } from '@/shared/types';

// ==========================================
// Constants
// ==========================================

/** localStorage key for the JWT token - exported so other modules can reference it */
export const TOKEN_KEY = 'noc_token';

// ==========================================
// Role Permissions Map
// ==========================================

/** Maps each user role to its allowed permissions */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    'sysadmin': [
        'view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets',
        'manage-users', 'view-devices', 'manage-config', 'view-audit-log',
        'manage-oncall', 'view-reports', 'manage-runbooks', 'view-topology',
        'manage-settings',
    ],
    'network-admin': [
        'view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets',
        'view-devices', 'manage-config', 'view-reports', 'view-topology',
    ],
    'senior-eng': [
        'view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets',
        'view-devices', 'manage-config', 'view-reports', 'manage-runbooks',
        'view-topology',
    ],
    'sre': [
        'view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets',
        'view-devices', 'view-reports', 'view-topology', 'manage-oncall',
    ],
    'network-ops': [
        'view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets',
        'view-devices', 'view-reports',
    ],
};

// ==========================================
// Auth Response Types (matching backend)
// ==========================================

export interface LoginResponse {
    token: string;
    expires_at: string;
    user: User;
    permissions: string[];
}

export interface RegisterResponse {
    message: string;
    token?: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ResetPasswordResponse {
    message: string;
}

/** Raw login response from the backend API (before transformation) */
export interface BackendLoginResponse {
    token: string;
    expires_at?: string;
    user?: {
        id?: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: { id?: string } | string;
        is_active?: boolean;
        email_verified?: boolean;
    };
    permissions?: string[];
}
