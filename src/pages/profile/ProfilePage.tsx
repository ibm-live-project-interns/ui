/**
 * Copyright IBM Corp. 2026
 *
 * Profile Page
 *
 * Allows authenticated users to view and update their profile information,
 * change their password, and see account metadata (role, created date, etc.).
 *
 * Child components:
 * - ProfileHeader: Avatar, name, email, role tags
 * - AccountDetails: Editable name/email fields
 * - PasswordChangeForm: Password change with requirements
 * - AccountInfo: Read-only account metadata
 *
 * All state management lives in the useProfile hook.
 */

import {
    Button,
    InlineNotification,
    SkeletonText,
    Grid,
} from '@carbon/react';
import { PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout';

// Page-specific child components and hook
import {
    ProfileHeader,
    AccountDetails,
    PasswordChangeForm,
    AccountInfo,
    useProfile,
} from './components';

import '@/styles/pages/_profile.scss';

// ==========================================
// Breadcrumbs (static)
// ==========================================

const BREADCRUMBS = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Profile', active: true },
];

// ==========================================
// Component
// ==========================================

export function ProfilePage() {
    const {
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
    } = useProfile();

    // ---- Loading ----

    if (loading) {
        return (
            <PageLayout>
            <div className="profile-page">
                <PageHeader
                    breadcrumbs={BREADCRUMBS}
                    title="My Profile"
                    showBorder
                />
                <div className="profile-page__skeleton">
                    <SkeletonText heading width="30%" />
                    <div className="u-skeleton-mt"><SkeletonText paragraph lineCount={4} /></div>
                </div>
            </div>
            </PageLayout>
        );
    }

    // ---- Error ----

    if (loadError) {
        return (
            <PageLayout>
            <div className="profile-page">
                <PageHeader
                    breadcrumbs={BREADCRUMBS}
                    title="My Profile"
                    showBorder
                />
                <div className="profile-page__error">
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
            </PageLayout>
        );
    }

    // ---- Main ----

    return (
        <PageLayout>
        <div className="profile-page">
            <PageHeader
                breadcrumbs={BREADCRUMBS}
                title="My Profile"
                subtitle="View and manage your account information and security settings."
                showBorder
            />

            <div className="profile-page__content">
                <ProfileHeader user={user} />

                <Grid condensed className="profile-page__grid">
                    <AccountDetails
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        onFirstNameChange={setFirstName}
                        onLastNameChange={setLastName}
                        onEmailChange={setEmail}
                        onSave={handleProfileSave}
                        hasChanges={hasProfileChanges}
                        isSaving={profileSaving}
                        notification={profileNotification}
                        onDismissNotification={() => setProfileNotification(null)}
                    />

                    <PasswordChangeForm
                        isOAuthSession={isOAuthSession}
                        currentPassword={currentPassword}
                        newPassword={newPassword}
                        confirmPassword={confirmPassword}
                        onCurrentPasswordChange={setCurrentPassword}
                        onNewPasswordChange={setNewPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handlePasswordChange}
                        isFormValid={isPasswordFormValid}
                        isSaving={passwordSaving}
                        notification={passwordNotification}
                        onDismissNotification={() => setPasswordNotification(null)}
                    />

                    <AccountInfo user={user} />
                </Grid>
            </div>
        </div>
        </PageLayout>
    );
}

export default ProfilePage;
