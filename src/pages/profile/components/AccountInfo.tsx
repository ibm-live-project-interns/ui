/**
 * AccountInfo - Read-only account information section (role, dates, email verified).
 */

import React from 'react';
import { Tile, Tag, Column } from '@carbon/react';
import {
    CheckmarkFilled,
    CloseFilled,
    Time,
    UserRole,
} from '@carbon/icons-react';
import type { User } from '@/shared/types';
import { formatDate, formatRelativeTime, getRoleName, getRoleTagType } from './profile.types';

interface AccountInfoProps {
    user: User | null;
}

export const AccountInfo = React.memo(function AccountInfo({ user }: AccountInfoProps) {
    return (
        <Column lg={16} md={8} sm={4}>
            <Tile className="profile-section">
                <h3 className="profile-section__title">Account Information</h3>
                <p className="profile-section__description">
                    System-managed account details. Contact an administrator to change your role.
                </p>

                <div className="profile-info-grid">
                    {/* Role */}
                    <div>
                        <div className="profile-info-item__label">
                            <UserRole size={16} className="profile-info-item__label-icon" />
                            <span className="profile-info-item__label-text">Role</span>
                        </div>
                        <Tag type={getRoleTagType(user?.role || '')} size="md">
                            {getRoleName(user?.role || '')}
                        </Tag>
                    </div>

                    {/* Account Created */}
                    <div>
                        <div className="profile-info-item__label">
                            <Time size={16} className="profile-info-item__label-icon" />
                            <span className="profile-info-item__label-text">Account Created</span>
                        </div>
                        <span className="profile-info-item__value">
                            {formatDate(user?.created_at)}
                        </span>
                    </div>

                    {/* Last Login */}
                    <div>
                        <div className="profile-info-item__label">
                            <Time size={16} className="profile-info-item__label-icon" />
                            <span className="profile-info-item__label-text">Last Login</span>
                        </div>
                        <span className="profile-info-item__value">
                            {formatRelativeTime(user?.last_login)}
                        </span>
                    </div>

                    {/* Email Verified */}
                    <div>
                        <div className="profile-info-item__label">
                            {user?.email_verified ? (
                                <CheckmarkFilled size={16} className="u-icon-success" />
                            ) : (
                                <CloseFilled size={16} className="u-icon-error" />
                            )}
                            <span className="profile-info-item__label-text">Email Verified</span>
                        </div>
                        <Tag type={user?.email_verified ? 'green' : 'red'} size="sm">
                            {user?.email_verified ? 'Verified' : 'Not Verified'}
                        </Tag>
                    </div>
                </div>
            </Tile>
        </Column>
    );
});

export default AccountInfo;
