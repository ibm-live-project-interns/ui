/**
 * User Management Service
 *
 * Handles CRUD operations for user administration.
 * Used by the SysAdmin dashboard for managing users, roles, and status.
 *
 * Endpoints:
 * - GET    /api/v1/users              - List all users
 * - POST   /api/v1/register           - Create new user
 * - PUT    /api/v1/users/:id          - Update user
 * - DELETE /api/v1/users/:id          - Delete user
 * - POST   /api/v1/users/:id/reset-password - Reset user password
 *
 * Falls back gracefully when the API is not yet available.
 */

import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import { parseAPIError } from '@/shared/utils/errors';
import { authLogger } from '@/shared/utils/logger';
import type { RoleID } from '@/shared/types';

// ==========================================
// User Management Types
// ==========================================

/** Managed user as returned by the admin list endpoint */
export interface ManagedUser {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: RoleID | string;
    is_active: boolean;
    email_verified: boolean;
    last_login: string | null;
    created_at: string;
}

/** Request payload for creating a new user */
export interface CreateUserRequest {
    username: string;
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
}

/** Request payload for updating a user */
export interface UpdateUserRequest {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    is_active?: boolean;
}

/** Standard message response */
interface MessageResponse {
    message: string;
}

// ==========================================
// Service Implementation
// ==========================================

class UserManagementService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'UserService');
    }

    /**
     * Fetch all users from the API.
     * Falls back to empty array if the endpoint is not yet available.
     */
    async getUsers(): Promise<ManagedUser[]> {
        try {
            const response = await this.get<any>(API_ENDPOINTS.USERS);
            const users = Array.isArray(response) ? response : (response.users || []);
            return users.map((u: any) => this.transformUser(u));
        } catch (error) {
            // Re-throw permission/auth errors instead of swallowing them
            if (error instanceof Error) {
                const msg = error.message.toLowerCase();
                if (msg.includes('403') || msg.includes('forbidden') || msg.includes('insufficient role') || msg.includes('permission denied')) {
                    throw new Error('Permission denied: You do not have access to manage users.');
                }
                if (msg.includes('session expired') || msg.includes('401')) {
                    throw error;
                }
            }
            // Only fall back to empty array for network/connectivity errors
            authLogger.warn('GET /users not available, returning empty list', error);
            return [];
        }
    }

    /**
     * Create a new user via the register endpoint.
     */
    async createUser(data: CreateUserRequest): Promise<ManagedUser> {
        try {
            const payload = {
                username: data.username,
                email: data.email,
                password: data.password || this.generateTempPassword(),
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                role: data.role || 'network-ops',
            };
            const response = await this.post<any>(API_ENDPOINTS.AUTH.REGISTER, payload);
            // The register endpoint may return the user or just a message.
            // If it returns the user, transform it; otherwise construct a partial response.
            if (response.user) {
                return this.transformUser(response.user);
            }
            return {
                id: response.id || `new-${Date.now()}`,
                username: data.username,
                email: data.email,
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                role: data.role || 'network-ops',
                is_active: true,
                email_verified: false,
                last_login: null,
                created_at: new Date().toISOString(),
            };
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Update an existing user.
     */
    async updateUser(id: string, data: UpdateUserRequest): Promise<ManagedUser> {
        try {
            const response = await this.put<any>(API_ENDPOINTS.USER_BY_ID(id), data);
            return this.transformUser(response.user || response);
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Delete a user by ID.
     */
    async deleteUser(id: string): Promise<MessageResponse> {
        try {
            return await this.delete<MessageResponse>(API_ENDPOINTS.USER_BY_ID(id));
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Reset a user's password. Generates a temporary password and sends it via email.
     */
    async resetPassword(id: string): Promise<MessageResponse> {
        try {
            return await this.post<MessageResponse>(API_ENDPOINTS.USER_RESET_PASSWORD(id), {});
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    /**
     * Toggle user active status.
     */
    async toggleUserStatus(id: string, isActive: boolean): Promise<ManagedUser> {
        return this.updateUser(id, { is_active: isActive });
    }

    // ==========================================
    // Private Helpers
    // ==========================================

    private transformUser(raw: any): ManagedUser {
        return {
            id: String(raw.id || raw.ID || ''),
            username: raw.username || raw.Username || '',
            email: raw.email || raw.Email || '',
            first_name: raw.first_name || raw.firstName || raw.FirstName || '',
            last_name: raw.last_name || raw.lastName || raw.LastName || '',
            role: raw.role?.id || raw.role || raw.Role || 'network-ops',
            is_active: raw.is_active ?? raw.isActive ?? raw.IsActive ?? true,
            email_verified: raw.email_verified ?? raw.emailVerified ?? false,
            last_login: raw.last_login || raw.lastLogin || null,
            created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
        };
    }

    private generateTempPassword(): string {
        // Use crypto.getRandomValues() for cryptographically secure randomness
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghijkmnpqrstuvwxyz';
        const digits = '23456789';
        const symbols = '!@#$%^&*';
        const allChars = uppercase + lowercase + digits + symbols;

        // Guarantee at least one character from each required class
        const mandatory = [
            uppercase[this.cryptoRandomInt(uppercase.length)],
            lowercase[this.cryptoRandomInt(lowercase.length)],
            digits[this.cryptoRandomInt(digits.length)],
            symbols[this.cryptoRandomInt(symbols.length)],
        ];

        // Fill remaining 12 characters from the full set
        const remaining: string[] = [];
        for (let i = 0; i < 12; i++) {
            remaining.push(allChars[this.cryptoRandomInt(allChars.length)]);
        }

        // Shuffle all characters together using Fisher-Yates with crypto random
        const combined = [...mandatory, ...remaining];
        for (let i = combined.length - 1; i > 0; i--) {
            const j = this.cryptoRandomInt(i + 1);
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return combined.join('');
    }

    /** Generate a cryptographically secure random integer in [0, max) */
    private cryptoRandomInt(max: number): number {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    }
}

// ==========================================
// Export Singleton
// ==========================================

export const userService = new UserManagementService();
