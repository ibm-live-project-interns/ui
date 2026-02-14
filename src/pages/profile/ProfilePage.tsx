/**
 * Copyright IBM Corp. 2026
 *
 * Profile Page
 *
 * Allows authenticated users to view and update their profile information,
 * change their password, and see account metadata (role, created date, etc.).
 *
 * Sections:
 * 1. Profile Header - Avatar placeholder, name, email, role tag
 * 2. Account Details - Editable first name, last name, email
 * 3. Security - Change password form with validation
 * 4. Account Info - Read-only role, created date, last login, email verified status
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Tile,
    TextInput,
    Button,
    Tag,
    InlineNotification,
    PasswordInput,
    SkeletonText,
    Column,
    Grid,
} from '@carbon/react';
import {
    UserAvatar,
    Save,
    Password,
    CheckmarkFilled,
    CloseFilled,
    Information,
    Time,
    UserRole,
} from '@carbon/icons-react';
import { PageHeader } from '@/components/ui';
import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import { ROLE_NAMES } from '@/shared/types';
import type { User, RoleID } from '@/shared/types';
import { parseAPIError } from '@/shared/utils/errors';
import { useToast } from '@/contexts';
import { authService } from '@/features/auth/services/authService';

// ==========================================
// Types
// ==========================================

interface ProfileData {
    user: User;
    permissions: string[];
}

interface UpdateProfilePayload {
    first_name?: string;
    last_name?: string;
    email?: string;
}

interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

interface NotificationState {
    kind: 'success' | 'error' | 'info' | 'warning';
    title: string;
    subtitle: string;
}

// ==========================================
// Profile Service (internal to this page)
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

    // --- Mock helpers ---

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

const profileService = new ProfileService();

// ==========================================
// Helper Functions
// ==========================================

function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'N/A';
    }
}

function formatRelativeTime(dateStr: string | undefined | null): string {
    if (!dateStr) return 'Never';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Never';
        const now = Date.now();
        const diffMs = now - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        return formatDate(dateStr);
    } catch {
        return 'Never';
    }
}

function getRoleName(role: string): string {
    return ROLE_NAMES[role as RoleID] || role;
}

function getRoleTagType(role: string): 'blue' | 'cyan' | 'teal' | 'purple' | 'red' {
    const map: Record<string, 'blue' | 'cyan' | 'teal' | 'purple' | 'red'> = {
        'sysadmin': 'red',
        'senior-eng': 'purple',
        'network-admin': 'teal',
        'sre': 'cyan',
        'network-ops': 'blue',
    };
    return map[role] || 'blue';
}

function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
}

// ==========================================
// Component
// ==========================================

export function ProfilePage() {
    const { addToast } = useToast();

    // Profile data state
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

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

    // ---- Data Fetching ----

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await profileService.getProfile();
            const u = data.user;
            setUser(u);
            setFirstName(u.first_name || '');
            setLastName(u.last_name || '');
            setEmail(u.email || '');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load profile';
            setLoadError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // ---- Profile Update Handler ----

    const handleProfileSave = useCallback(async () => {
        if (!user) return;

        // Build payload only with changed fields
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

        // Validate email format
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

            // Also update the cached user in localStorage so the sidebar/header reflect changes
            const storedUser = localStorage.getItem('noc_user');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    const updated = { ...parsed, ...response.user };
                    localStorage.setItem('noc_user', JSON.stringify(updated));
                } catch {
                    // Non-fatal
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

        // Client-side validation
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
            // Clear the form on success
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

    // ---- Render ----

    if (loading) {
        return (
            <div className="profile-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/dashboard' },
                        { label: 'Profile', active: true },
                    ]}
                    title="My Profile"
                    showBorder
                />
                <div className="profile-page__content" style={{ padding: '2rem' }}>
                    <SkeletonText heading width="30%" />
                    <div style={{ marginTop: '1rem' }}><SkeletonText paragraph lineCount={4} /></div>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="profile-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/dashboard' },
                        { label: 'Profile', active: true },
                    ]}
                    title="My Profile"
                    showBorder
                />
                <div className="profile-page__content" style={{ padding: '2rem' }}>
                    <InlineNotification
                        kind="error"
                        title="Failed to load profile"
                        subtitle={loadError}
                        lowContrast
                    >
                        <Button kind="ghost" size="sm" onClick={fetchProfile}>
                            Retry
                        </Button>
                    </InlineNotification>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: '/dashboard' },
                    { label: 'Profile', active: true },
                ]}
                title="My Profile"
                subtitle="View and manage your account information and security settings."
                showBorder
            />

            <div className="profile-page__content" style={{ padding: '1.5rem 2rem', maxWidth: '960px' }}>
                {/* ========================================
                    Profile Header
                   ======================================== */}
                <Tile style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Avatar placeholder */}
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--cds-interactive, #0f62fe)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '1.75rem',
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            {user ? getInitials(user.first_name, user.last_name) : <UserAvatar size={32} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
                                {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'User'}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0.5rem', color: 'var(--cds-text-secondary, #525252)', fontSize: '0.875rem' }}>
                                {user?.email}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Tag type={getRoleTagType(user?.role || '')} size="sm">
                                    {getRoleName(user?.role || '')}
                                </Tag>
                                {user?.is_active && (
                                    <Tag type="green" size="sm">Active</Tag>
                                )}
                            </div>
                        </div>
                    </div>
                </Tile>

                <Grid condensed style={{ padding: 0 }}>
                    {/* ========================================
                        Account Details Section
                       ======================================== */}
                    <Column lg={16} md={8} sm={4} style={{ marginBottom: '1.5rem' }}>
                        <Tile style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 600 }}>
                                Account Details
                            </h3>
                            <p style={{ margin: '0 0 1.5rem', color: 'var(--cds-text-secondary, #525252)', fontSize: '0.875rem' }}>
                                Update your personal information.
                            </p>

                            {profileNotification && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <InlineNotification
                                        kind={profileNotification.kind}
                                        title={profileNotification.title}
                                        subtitle={profileNotification.subtitle}
                                        lowContrast
                                        onCloseButtonClick={() => setProfileNotification(null)}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <TextInput
                                    id="profile-first-name"
                                    labelText="First Name"
                                    value={firstName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                    maxLength={100}
                                />
                                <TextInput
                                    id="profile-last-name"
                                    labelText="Last Name"
                                    value={lastName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                    placeholder="Enter last name"
                                    maxLength={100}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <TextInput
                                    id="profile-email"
                                    labelText="Email Address"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    type="email"
                                    invalid={email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                                    invalidText="Please enter a valid email address."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    kind="primary"
                                    size="md"
                                    renderIcon={Save}
                                    onClick={handleProfileSave}
                                    disabled={!hasProfileChanges || profileSaving}
                                >
                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </Tile>
                    </Column>

                    {/* ========================================
                        Security Section
                        Hidden for Google OAuth users (no password to manage)
                       ======================================== */}
                    {authService.isOAuthSession() ? (
                        <Column lg={16} md={8} sm={4} style={{ marginBottom: '1.5rem' }}>
                            <Tile style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 600 }}>
                                    Security
                                </h3>
                                <p style={{ margin: '0 0 1rem', color: 'var(--cds-text-secondary, #525252)', fontSize: '0.875rem' }}>
                                    You signed in with Google. Password management is not available for OAuth accounts.
                                </p>
                                <InlineNotification
                                    kind="info"
                                    title="Google Account"
                                    subtitle="Your password is managed by Google. To change your password, visit your Google Account settings."
                                    lowContrast
                                    hideCloseButton
                                />
                            </Tile>
                        </Column>
                    ) : (
                        <Column lg={16} md={8} sm={4} style={{ marginBottom: '1.5rem' }}>
                            <Tile style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 600 }}>
                                    Security
                                </h3>
                                <p style={{ margin: '0 0 1.5rem', color: 'var(--cds-text-secondary, #525252)', fontSize: '0.875rem' }}>
                                    Change your password. You will remain logged in on this device after changing your password.
                                </p>

                                {passwordNotification && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <InlineNotification
                                            kind={passwordNotification.kind}
                                            title={passwordNotification.title}
                                            subtitle={passwordNotification.subtitle}
                                            lowContrast
                                            onCloseButtonClick={() => setPasswordNotification(null)}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                                    <PasswordInput
                                        id="profile-current-password"
                                        labelText="Current Password"
                                        value={currentPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        autoComplete="off"
                                    />
                                    <PasswordInput
                                        id="profile-new-password"
                                        labelText="New Password"
                                        value={newPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                        placeholder="Enter a new password"
                                        invalid={newPassword.length > 0 && newPassword.length < 8}
                                        invalidText="Password must be at least 8 characters."
                                        autoComplete="off"
                                    />
                                    <PasswordInput
                                        id="profile-confirm-password"
                                        labelText="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your new password"
                                        invalid={confirmPassword.length > 0 && confirmPassword !== newPassword}
                                        invalidText="Passwords do not match."
                                        autoComplete="off"
                                    />
                                </div>

                                {/* Password requirements hint */}
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'var(--cds-layer-02, #f4f4f4)',
                                        borderRadius: '4px',
                                        marginBottom: '1.5rem',
                                        fontSize: '0.8125rem',
                                        color: 'var(--cds-text-secondary, #525252)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Information size={16} />
                                        <strong>Password requirements:</strong>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyleType: 'disc' }}>
                                        <li style={{ color: newPassword.length >= 8 ? 'var(--cds-support-success, #198038)' : undefined }}>
                                            At least 8 characters
                                        </li>
                                        <li style={{ color: newPassword !== currentPassword && newPassword.length > 0 ? 'var(--cds-support-success, #198038)' : undefined }}>
                                            Must be different from current password
                                        </li>
                                        <li style={{ color: confirmPassword.length > 0 && confirmPassword === newPassword ? 'var(--cds-support-success, #198038)' : undefined }}>
                                            Confirmation must match new password
                                        </li>
                                    </ul>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        kind="primary"
                                        size="md"
                                        renderIcon={Password}
                                        onClick={handlePasswordChange}
                                        disabled={!isPasswordFormValid || passwordSaving}
                                    >
                                        {passwordSaving ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </div>
                            </Tile>
                        </Column>
                    )}

                    {/* ========================================
                        Account Info Section (read-only)
                       ======================================== */}
                    <Column lg={16} md={8} sm={4} style={{ marginBottom: '1.5rem' }}>
                        <Tile style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 600 }}>
                                Account Information
                            </h3>
                            <p style={{ margin: '0 0 1.5rem', color: 'var(--cds-text-secondary, #525252)', fontSize: '0.875rem' }}>
                                System-managed account details. Contact an administrator to change your role.
                            </p>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '1.5rem',
                                }}
                            >
                                {/* Role */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        <UserRole size={16} style={{ color: 'var(--cds-text-secondary, #525252)' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary, #525252)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Role
                                        </span>
                                    </div>
                                    <Tag type={getRoleTagType(user?.role || '')} size="md">
                                        {getRoleName(user?.role || '')}
                                    </Tag>
                                </div>

                                {/* Account Created */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        <Time size={16} style={{ color: 'var(--cds-text-secondary, #525252)' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary, #525252)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Account Created
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.875rem' }}>
                                        {formatDate(user?.created_at)}
                                    </span>
                                </div>

                                {/* Last Login */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        <Time size={16} style={{ color: 'var(--cds-text-secondary, #525252)' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary, #525252)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Last Login
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.875rem' }}>
                                        {formatRelativeTime(user?.last_login)}
                                    </span>
                                </div>

                                {/* Email Verified */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        {user?.email_verified ? (
                                            <CheckmarkFilled size={16} style={{ color: 'var(--cds-support-success, #198038)' }} />
                                        ) : (
                                            <CloseFilled size={16} style={{ color: 'var(--cds-support-error, #da1e28)' }} />
                                        )}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary, #525252)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Email Verified
                                        </span>
                                    </div>
                                    <Tag type={user?.email_verified ? 'green' : 'red'} size="sm">
                                        {user?.email_verified ? 'Verified' : 'Not Verified'}
                                    </Tag>
                                </div>
                            </div>
                        </Tile>
                    </Column>
                </Grid>
            </div>
        </div>
    );
}

export default ProfilePage;
