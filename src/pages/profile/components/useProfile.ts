/**
 * Copyright IBM Corp. 2026
 *
 * useProfile - Custom hook encapsulating all state, data-fetching, validation,
 * and mutation logic for the Profile page.
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/shared/types';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';
import { authService } from '@/features/auth/services/authService';
import { useFetchData } from '@/shared/hooks';
import type { NotificationState } from './profile.types';
import { profileService } from './profileService';
import type { UpdateProfilePayload } from './profileService';

// ==========================================
// Return type
// ==========================================

export interface UseProfileReturn {
    // Profile data
    user: User | null;
    loading: boolean;
    loadError: string | null;
    fetchProfile: () => void;

    // Account details form
    firstName: string;
    lastName: string;
    email: string;
    setFirstName: (v: string) => void;
    setLastName: (v: string) => void;
    setEmail: (v: string) => void;
    profileSaving: boolean;
    profileNotification: NotificationState | null;
    setProfileNotification: (n: NotificationState | null) => void;
    handleProfileSave: () => Promise<void>;
    hasProfileChanges: boolean;

    // Password form
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    setCurrentPassword: (v: string) => void;
    setNewPassword: (v: string) => void;
    setConfirmPassword: (v: string) => void;
    passwordSaving: boolean;
    passwordNotification: NotificationState | null;
    setPasswordNotification: (n: NotificationState | null) => void;
    handlePasswordChange: () => Promise<void>;
    isPasswordFormValid: boolean;

    // OAuth
    isOAuthSession: boolean;
}

// ==========================================
// Hook
// ==========================================

export function useProfile(): UseProfileReturn {
    const { addToast } = useToast();

    // Profile data fetching via useFetchData
    const { data: profileData, isLoading: loading, error: loadError, refetch: fetchProfile } = useFetchData(
        async (_signal) => profileService.getProfile(),
        [],
    );

    // Mutable user state — updated on fetch and on profile save
    const [user, setUser] = useState<User | null>(null);

    // Account details form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileNotification, setProfileNotification] = useState<NotificationState | null>(null);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordNotification, setPasswordNotification] = useState<NotificationState | null>(null);

    // Sync form fields when profile data is fetched
    useEffect(() => {
        if (profileData) {
            const u = profileData.user;
            setUser(u);
            setFirstName(u.first_name || '');
            setLastName(u.last_name || '');
            setEmail(u.email || '');
        }
    }, [profileData]);

    // ---- Profile Update Handler ----

    const handleProfileSave = useCallback(async () => {
        if (!user) return;

        if (!firstName.trim()) {
            setProfileNotification({
                kind: 'error',
                title: 'Validation error',
                subtitle: 'First name cannot be empty.',
            });
            return;
        }
        if (!lastName.trim()) {
            setProfileNotification({
                kind: 'error',
                title: 'Validation error',
                subtitle: 'Last name cannot be empty.',
            });
            return;
        }

        const payload: UpdateProfilePayload = {};
        if (firstName.trim() !== user.first_name) payload.first_name = firstName.trim();
        if (lastName.trim() !== user.last_name) payload.last_name = lastName.trim();
        if (email.trim() !== user.email) payload.email = email.trim();

        if (Object.keys(payload).length === 0) {
            setProfileNotification({
                kind: 'info',
                title: 'No changes',
                subtitle: 'No fields have been modified.',
            });
            return;
        }

        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            setProfileNotification({
                kind: 'error',
                title: 'Invalid email',
                subtitle: 'Please enter a valid email address.',
            });
            return;
        }

        setProfileSaving(true);
        setProfileNotification(null);
        try {
            const response = await profileService.updateProfile(payload);
            setUser(response.user);
            setFirstName(response.user.first_name || '');
            setLastName(response.user.last_name || '');
            setEmail(response.user.email || '');

            const storedUser = localStorage.getItem('noc_user');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    const updated = { ...parsed, ...response.user };
                    localStorage.setItem('noc_user', JSON.stringify(updated));
                } catch (err) {
                    logger.warn('Failed to update cached user in localStorage', err);
                }
            }

            setProfileNotification(null);
            addToast('success', 'Profile updated', response.message || 'Your profile has been updated successfully.');
        } catch (err) {
            setProfileNotification({
                kind: 'error',
                title: 'Update failed',
                subtitle: err instanceof Error ? err.message : 'Failed to update profile.',
            });
        } finally {
            setProfileSaving(false);
        }
    }, [user, firstName, lastName, email, addToast]);

    // ---- Password Change Handler ----

    const handlePasswordChange = useCallback(async () => {
        setPasswordNotification(null);

        if (!currentPassword) {
            setPasswordNotification({
                kind: 'error',
                title: 'Validation error',
                subtitle: 'Current password is required.',
            });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordNotification({
                kind: 'error',
                title: 'Validation error',
                subtitle: 'New password must be at least 8 characters long.',
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordNotification({
                kind: 'error',
                title: 'Validation error',
                subtitle: 'New password and confirmation do not match.',
            });
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordNotification({
                kind: 'error',
                title: 'Validation error',
                subtitle: 'New password must be different from current password.',
            });
            return;
        }

        setPasswordSaving(true);
        try {
            const response = await profileService.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordNotification(null);
            addToast('success', 'Password changed', response.message || 'Your password has been changed successfully.');
        } catch (err) {
            setPasswordNotification({
                kind: 'error',
                title: 'Password change failed',
                subtitle: err instanceof Error ? err.message : 'Failed to change password.',
            });
        } finally {
            setPasswordSaving(false);
        }
    }, [currentPassword, newPassword, confirmPassword, addToast]);

    // ---- Derived state ----

    const hasProfileChanges = user
        ? firstName.trim() !== user.first_name ||
          lastName.trim() !== user.last_name ||
          email.trim() !== user.email
        : false;

    const isPasswordFormValid =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword &&
        currentPassword !== newPassword;

    const isOAuthSession = authService.isOAuthSession();

    return {
        user,
        loading,
        loadError,
        fetchProfile,

        firstName,
        lastName,
        email,
        setFirstName,
        setLastName,
        setEmail,
        profileSaving,
        profileNotification,
        setProfileNotification,
        handleProfileSave,
        hasProfileChanges,

        currentPassword,
        newPassword,
        confirmPassword,
        setCurrentPassword,
        setNewPassword,
        setConfirmPassword,
        passwordSaving,
        passwordNotification,
        setPasswordNotification,
        handlePasswordChange,
        isPasswordFormValid,

        isOAuthSession,
    };
}
