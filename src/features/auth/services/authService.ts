/**
 * Authentication Service
 *
 * Handles user authentication, registration, and session management.
 * Uses centralized API_ENDPOINTS for all API calls.
 */

import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import { parseAPIError } from '@/shared/utils/errors';
import type { User, RegisterRequest } from '@/shared/types';

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
            const token = localStorage.getItem('noc_token');
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
    }

    get currentUser(): User | null {
        return this._currentUser;
    }

    /**
     * Login with email/username and password
     * Backend expects { username, password } - we use email as username
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
                permissions: ['view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets'],
            };
            this.saveUser(mockResponse.user);
            HttpService.setToken(mockResponse.token);
            return new Promise(resolve => setTimeout(() => resolve(mockResponse), 500));
        }

        try {
            // Backend expects { username, password } - use email as username
            const response = await this.post<any>(API_ENDPOINTS.AUTH.LOGIN, {
                username: email,
                password
            });

            // Transform backend response to match frontend LoginResponse format
            const user: User = {
                id: response.user?.id || 1,
                email: email,
                username: response.user?.username || email.split('@')[0],
                first_name: response.user?.first_name || email.split('@')[0],
                last_name: response.user?.last_name || '',
                role: response.user?.role?.id || 'network-ops',
                is_active: true,
                email_verified: true,
                created_at: new Date().toISOString(),
            };

            const loginResponse: LoginResponse = {
                token: response.token,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                user,
                permissions: ['view-alerts', 'acknowledge-alerts', 'create-tickets', 'view-tickets'],
            };

            this.saveUser(loginResponse.user);
            HttpService.setToken(loginResponse.token);
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
     * Get current user from API
     */
    async getCurrentUser(): Promise<User> {
        try {
            const user = await this.get<User>(API_ENDPOINTS.ME);
            this.saveUser(user);
            return user;
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Logout user and clear session
     */
    logout(): void {
        this._currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        HttpService.clearToken();
        window.location.href = '/login';
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this._currentUser !== null || HttpService.hasToken();
    }

    /**
     * Set token from OAuth callback (without API call)
     */
    setOAuthToken(token: string): void {
        HttpService.setToken(token);
    }
}

export const authService = new AuthService();
