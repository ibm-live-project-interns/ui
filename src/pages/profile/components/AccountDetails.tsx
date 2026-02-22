/**
 * AccountDetails - Editable first name, last name, email fields with save button.
 */

import React from 'react';
import {
    Tile,
    TextInput,
    Button,
    InlineNotification,
    Column,
} from '@carbon/react';
import { Save } from '@carbon/icons-react';
import type { NotificationState } from './profile.types';

interface AccountDetailsProps {
    firstName: string;
    lastName: string;
    email: string;
    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onSave: () => void;
    hasChanges: boolean;
    isSaving: boolean;
    notification: NotificationState | null;
    onDismissNotification: () => void;
}

export const AccountDetails = React.memo(function AccountDetails({
    firstName,
    lastName,
    email,
    onFirstNameChange,
    onLastNameChange,
    onEmailChange,
    onSave,
    hasChanges,
    isSaving,
    notification,
    onDismissNotification,
}: AccountDetailsProps) {
    return (
        <Column lg={16} md={8} sm={4}>
            <Tile className="profile-section">
                <h3 className="profile-section__title">Account Details</h3>
                <p className="profile-section__description">Update your personal information.</p>

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

                <div className="profile-form__row">
                    <TextInput
                        id="profile-first-name"
                        labelText="First Name"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFirstNameChange(e.target.value)}
                        placeholder="Enter first name"
                        maxLength={100}
                        invalid={firstName.length > 0 && !firstName.trim()}
                        invalidText="First name cannot be empty."
                    />
                    <TextInput
                        id="profile-last-name"
                        labelText="Last Name"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onLastNameChange(e.target.value)}
                        placeholder="Enter last name"
                        maxLength={100}
                        invalid={lastName.length > 0 && !lastName.trim()}
                        invalidText="Last name cannot be empty."
                    />
                </div>

                <div className="profile-form__field">
                    <TextInput
                        id="profile-email"
                        labelText="Email Address"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
                        placeholder="Enter email address"
                        type="email"
                        invalid={email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                        invalidText="Please enter a valid email address."
                    />
                </div>

                <div className="profile-section__actions">
                    <Button
                        kind="primary"
                        size="md"
                        renderIcon={Save}
                        onClick={onSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </Tile>
        </Column>
    );
});

export default AccountDetails;
