/**
 * ProfileHeader - Avatar, name, email, and role tags tile.
 */

import { Tile, Tag } from '@carbon/react';
import { UserAvatar } from '@carbon/icons-react';
import type { User } from '@/shared/types';
import { getInitials, getRoleName, getRoleTagType } from './profile.types';

interface ProfileHeaderProps {
    user: User | null;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <Tile className="profile-header">
            <div className="profile-header__avatar">
                {user ? getInitials(user.first_name, user.last_name) : <UserAvatar size={32} />}
            </div>
            <div className="profile-header__info">
                <h2 className="profile-header__name">
                    {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'User'}
                </h2>
                <p className="profile-header__email">
                    {user?.email}
                </p>
                <div className="profile-header__tags">
                    <Tag type={getRoleTagType(user?.role || '')} size="sm">
                        {getRoleName(user?.role || '')}
                    </Tag>
                    {user?.is_active && (
                        <Tag type="green" size="sm">Active</Tag>
                    )}
                </div>
            </div>
        </Tile>
    );
}

export default ProfileHeader;
