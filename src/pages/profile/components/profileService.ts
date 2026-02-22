/**
 * Copyright IBM Corp. 2026
 *
 * ProfileService - Handles profile-related API calls (get, update, change password).
 */

import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import type { User } from '@/shared/types';
import { parseAPIError } from '@/shared/utils/errors';

// ==========================================
// Types
// ==========================================

export interface ProfileData {
    user: User;
    permissions: string[];
}

export interface UpdateProfilePayload {
    first_name?: string;
    last_name?: string;
    email?: string;
}

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

// ==========================================
// Profile Service
// ==========================================

class ProfileService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'ProfileService');
    }

    async getProfile(): Promise<ProfileData> {
        if (env.useMockData) {
            return this.getMockProfile();
        }
        try {
            return await this.get<ProfileData>(API_ENDPOINTS.ME);
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    async updateProfile(data: UpdateProfilePayload): Promise<{ message: string; user: User }> {
        if (env.useMockData) {
            return this.mockUpdateProfile(data);
        }
        try {
            return await this.put<{ message: string; user: User }>(API_ENDPOINTS.ME, data);
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    async changePassword(data: ChangePasswordPayload): Promise<{ message: string }> {
        if (env.useMockData) {
            return this.mockChangePassword(data);
        }
        try {
            return await this.put<{ message: string }>(`${API_ENDPOINTS.ME}/password`, data);
        } catch (error) {
            throw new Error(parseAPIError(error));
        }
    }

    private getMockProfile(): Promise<ProfileData> {
        const mockUser: User = {
            id: 1,
            email: 'admin@example.com',
            username: 'admin',
            first_name: 'Demo',
            last_name: 'User',
            role: 'network-ops',
            is_active: true,
            email_verified: true,
            last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        };
        return new Promise(resolve =>
            setTimeout(() => resolve({ user: mockUser, permissions: ['view-alerts', 'acknowledge-alerts'] }), 400)
        );
    }

    private mockUpdateProfile(data: UpdateProfilePayload): Promise<{ message: string; user: User }> {
        const updatedUser: User = {
            id: 1,
            email: data.email || 'admin@example.com',
            username: 'admin',
            first_name: data.first_name || 'Demo',
            last_name: data.last_name || 'User',
            role: 'network-ops',
            is_active: true,
            email_verified: true,
            last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        };
        return new Promise(resolve =>
            setTimeout(() => resolve({ message: 'Profile updated successfully', user: updatedUser }), 500)
        );
    }

    private mockChangePassword(data: ChangePasswordPayload): Promise<{ message: string }> {
        if (data.current_password === 'wrong') {
            return new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Current password is incorrect')), 400)
            );
        }
        return new Promise(resolve =>
            setTimeout(() => resolve({ message: 'Password changed successfully' }), 500)
        );
    }
}

export const profileService = new ProfileService();
