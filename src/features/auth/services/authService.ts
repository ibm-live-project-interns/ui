/**
 * Authentication Service
 *
 * Handles user authentication, registration, and session management.
 * Uses centralized API_ENDPOINTS for all API calls.
 */

import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import { parseAPIError } from '@/shared/utils/errors';
import type { User, RegisterRequest, RoleID } from '@/shared/types';

// ==========================================
// Constants
// ==========================================

/** localStorage key for the JWT token - exported so other modules can reference it */
export const TOKEN_KEY = 'noc_token';

// ==========================================
// Maps each user role to its allowed permissions
// ==========================================

const ROLE_PERMISSIONS: Record<string, string[]> = {
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

// ==========================================
// Auth Service Implementation
// ==========================================

class AuthService extends HttpService {
    private _currentUser: User | null = null;
    private readonly STORAGE_KEY = 'noc_user';

    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
        this.loadUser();

        // Clear invalid mock tokens when in API mode
        if (!env.useMockData) {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token === 'mock-jwt-token') {
                console.warn('[AuthService] Clearing mock token in API mode');
                HttpService.clearToken();
                localStorage.removeItem(this.STORAGE_KEY);
                this._currentUser = null;
            }
        }
    }

    private loadUser(): void {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this._currentUser = JSON.parse(stored);
            } catch {
                this._currentUser = null;
            }
        }
    }

    private saveUser(user: User): void {
        this._currentUser = user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        // Sync role with RoleProvider so sidebar permissions render correctly
        if (user.role) {
            localStorage.setItem('user-role', user.role);
            // Notify RoleProvider about the role change (same-tab localStorage writes
            // don't fire the 'storage' event, so we use a custom event)
            window.dispatchEvent(new CustomEvent('role-changed', { detail: user.role }));
        }
    }

    /**
     * Extract role string from backend response.
     * Backend may return role as a flat string "sysadmin" or as an object { id: "sysadmin" }.
     * Handles both formats for backward compatibility.
     */
    private static extractRole(roleValue: unknown): RoleID {
        if (typeof roleValue === 'string') {
            return roleValue as RoleID;
        }
        if (roleValue && typeof roleValue === 'object' && 'id' in roleValue) {
            return (roleValue as { id: string }).id as RoleID;
        }
        return 'network-ops';
    }

    get currentUser(): User | null {
        return this._currentUser;
    }

    /**
     * Get current user - alias used by components
     */
    getCurrentUser(): User | null {
        return this._currentUser;
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        if (env.useMockData) {
            console.log('[AuthService] Using Mock Login');
            const mockResponse: LoginResponse = {
                token: 'mock-jwt-token',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                user: {
                    id: 1,
                    email,
                    username: email.split('@')[0],
                    first_name: 'Demo',
                    last_name: 'User',
                    role: 'network-ops',
                    is_active: true,
                    email_verified: true,
                    created_at: new Date().toISOString(),
                },
                permissions: ROLE_PERMISSIONS['network-ops'],
            };
            this.saveUser(mockResponse.user);
            HttpService.setToken(mockResponse.token);
            localStorage.setItem('noc_auth_method', 'password');
            return new Promise(resolve => setTimeout(() => resolve(mockResponse), 500));
        }

        try {
            const response = await this.post<any>(API_ENDPOINTS.AUTH.LOGIN, {
                email,
                password
            });

            // Backend may return role as a plain string or nested object — extract consistently
            const role = AuthService.extractRole(response.user?.role);

            // Transform backend response to match frontend LoginResponse format
            const user: User = {
                id: response.user?.id || 1,
                email: email,
                username: response.user?.username || email.split('@')[0],
                first_name: response.user?.first_name || email.split('@')[0],
                last_name: response.user?.last_name || '',
                role,
                is_active: true,
                email_verified: true,
                created_at: new Date().toISOString(),
            };

            // Derive permissions from the user's actual role
            const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['network-ops'];

            const loginResponse: LoginResponse = {
                token: response.token,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                user,
                permissions,
            };

            this.saveUser(loginResponse.user);
            HttpService.setToken(loginResponse.token);
            // Mark that this session used password login (not OAuth)
            localStorage.setItem('noc_auth_method', 'password');
            return loginResponse;
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Register new user
     */
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        if (env.useMockData) {
            console.log('[AuthService] Using Mock Register');
            const mockResponse: RegisterResponse = {
                message: 'Registration successful. Please check your email to verify your account.',
            };
            return new Promise(resolve => setTimeout(() => resolve(mockResponse), 500));
        }

        try {
            return await this.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Request password reset email
     */
    async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
        if (env.useMockData) {
            return new Promise(resolve =>
                setTimeout(() => resolve({ message: 'Password reset email sent.' }), 500)
            );
        }

        try {
            return await this.post<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
        if (env.useMockData) {
            return new Promise(resolve =>
                setTimeout(() => resolve({ message: 'Password reset successful.' }), 500)
            );
        }

        try {
            return await this.post<ResetPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                token,
                new_password: newPassword,
            });
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<{ message: string }> {
        if (env.useMockData) {
            return new Promise(resolve =>
                setTimeout(() => resolve({ message: 'Email verified successfully.' }), 500)
            );
        }

        try {
            return await this.post<{ message: string }>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Resend verification email
     */
    async resendVerification(email: string): Promise<{ message: string }> {
        if (env.useMockData) {
            return new Promise(resolve =>
                setTimeout(() => resolve({ message: 'Verification email sent.' }), 500)
            );
        }

        try {
            return await this.post<{ message: string }>(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Fetch current user profile from API and save locally
     */
    async fetchCurrentUser(): Promise<User> {
        try {
            const user = await this.get<User>(API_ENDPOINTS.ME);
            this.saveUser(user);
            return user;
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Logout user — invalidates server session, then clears local state
     */
    async logout(): Promise<void> {
        // Invalidate server session before clearing local storage
        try {
            if (HttpService.hasToken()) {
                await this.post<unknown>(API_ENDPOINTS.AUTH.LOGOUT, {});
            }
        } catch {
            // Ignore server errors - still clear local state
            console.warn('[AuthService] Server logout failed, clearing local session');
        }

        this._currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('user-role');
        localStorage.removeItem('noc_auth_method');
        HttpService.clearToken();
        window.location.href = '/login';
    }

    /**
     * Check if user is authenticated — requires both a valid token AND loaded user profile
     */
    isAuthenticated(): boolean {
        return this._currentUser !== null && HttpService.hasToken();
    }

    /**
     * Ensure user profile is loaded. If token exists but user is null,
     * attempt to fetch user profile. Returns true if authenticated.
     */
    async ensureAuthenticated(): Promise<boolean> {
        if (this._currentUser !== null && HttpService.hasToken()) {
            return true;
        }
        if (HttpService.hasToken() && this._currentUser === null) {
            try {
                await this.fetchCurrentUser();
                return true;
            } catch {
                // Token is invalid or expired - clear it
                HttpService.clearToken();
                localStorage.removeItem(this.STORAGE_KEY);
                return false;
            }
        }
        return false;
    }

    /**
     * Set token from OAuth callback and load user profile
     */
    async setOAuthToken(token: string): Promise<void> {
        HttpService.setToken(token);
        // Mark that this session used OAuth (so profile page can hide password section)
        localStorage.setItem('noc_auth_method', 'oauth');
        // Load user profile so the UI has role/permissions immediately after OAuth
        try {
            await this.fetchCurrentUser();
        } catch (error) {
            console.error('[AuthService] Failed to load user profile after OAuth:', error);
            // Token may be invalid - don't clear it here, let ProtectedRoute handle
        }
    }

    /**
     * Check if current session was authenticated via OAuth (e.g. Google)
     */
    isOAuthSession(): boolean {
        return localStorage.getItem('noc_auth_method') === 'oauth';
    }
}

export const authService = new AuthService();
