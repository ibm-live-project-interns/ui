/**
 * PasswordChangeForm - Password change fields with requirements checklist.
 * Handles both regular users and Google OAuth users (shows info notice).
 */

import React from 'react';
import {
    Tile,
    Button,
    InlineNotification,
    PasswordInput,
    Column,
} from '@carbon/react';
import { Password, Information } from '@carbon/icons-react';
import type { NotificationState } from './profile.types';

interface PasswordChangeFormProps {
    isOAuthSession: boolean;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    onCurrentPasswordChange: (value: string) => void;
    onNewPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSubmit: () => void;
    isFormValid: boolean;
    isSaving: boolean;
    notification: NotificationState | null;
    onDismissNotification: () => void;
}

export const PasswordChangeForm = React.memo(function PasswordChangeForm({
    isOAuthSession,
    currentPassword,
    newPassword,
    confirmPassword,
    onCurrentPasswordChange,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
    isFormValid,
    isSaving,
    notification,
    onDismissNotification,
}: PasswordChangeFormProps) {
    if (isOAuthSession) {
        return (
            <Column lg={16} md={8} sm={4}>
                <Tile className="profile-section">
                    <h3 className="profile-section__title">Security</h3>
                    <p className="profile-section__description">
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
        );
    }

    return (
        <Column lg={16} md={8} sm={4}>
            <Tile className="profile-section">
                <h3 className="profile-section__title">Security</h3>
                <p className="profile-section__description">
                    Change your password. You will remain logged in on this device after changing your password.
                </p>

                {notification && (
                    <div className="profile-section__notification">
                        <InlineNotification
                            kind={notification.kind}
                            title={notification.title}
                            subtitle={notification.subtitle}
                            lowContrast
                            onCloseButtonClick={onDismissNotification}
                        />
                    </div>
                )}

                <div className="profile-password__fields">
                    <PasswordInput
                        id="profile-current-password"
                        labelText="Current Password"
                        value={currentPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCurrentPasswordChange(e.target.value)}
                        placeholder="Enter your current password"
                        autoComplete="off"
                    />
                    <PasswordInput
                        id="profile-new-password"
                        labelText="New Password"
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewPasswordChange(e.target.value)}
                        placeholder="Enter a new password"
                        invalid={newPassword.length > 0 && newPassword.length < 8}
                        invalidText="Password must be at least 8 characters."
                        autoComplete="off"
                    />
                    <PasswordInput
                        id="profile-confirm-password"
                        labelText="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onConfirmPasswordChange(e.target.value)}
                        placeholder="Confirm your new password"
                        invalid={confirmPassword.length > 0 && confirmPassword !== newPassword}
                        invalidText="Passwords do not match."
                        autoComplete="off"
                    />
                </div>

                {/* Password requirements hint */}
                <div className="profile-password__requirements">
                    <div className="profile-password__requirements-header">
                        <Information size={16} />
                        <strong>Password requirements:</strong>
                    </div>
                    <ul className="profile-password__requirements-list">
                        <li className={newPassword.length >= 8 ? 'profile-password__requirement--met' : ''}>
                            At least 8 characters
                        </li>
                        <li className={newPassword !== currentPassword && newPassword.length > 0 ? 'profile-password__requirement--met' : ''}>
                            Must be different from current password
                        </li>
                        <li className={confirmPassword.length > 0 && confirmPassword === newPassword ? 'profile-password__requirement--met' : ''}>
                            Confirmation must match new password
                        </li>
                    </ul>
                </div>

                <div className="profile-section__actions">
                    <Button
                        kind="primary"
                        size="md"
                        renderIcon={Password}
                        onClick={onSubmit}
                        disabled={!isFormValid || isSaving}
                    >
                        {isSaving ? 'Changing...' : 'Change Password'}
                    </Button>
                </div>
            </Tile>
        </Column>
    );
});

export default PasswordChangeForm;
