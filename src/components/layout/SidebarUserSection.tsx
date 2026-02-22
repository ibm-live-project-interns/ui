/**
 * SidebarUserSection Component
 *
 * The user profile footer at the bottom of the sidebar navigation.
 * Extracted from AppHeader to reduce component size.
 *
 * Features:
 * - User avatar with initials
 * - Display name and role label
 * - Slide-up logout menu
 * - Click outside to close
 * - Keyboard accessible (Enter to toggle, aria-expanded)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Logout, ChevronUp } from '@carbon/icons-react';
import { authService } from '@/shared/services';
import { ROLE_NAMES } from '@/shared/types';
import type { User } from '@/shared/types';

// ==========================================
// Helpers
// ==========================================

/** Get initials from username, email, or name */
function getInitials(name?: string, email?: string): string {
    if (name && name.length > 0) {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return '??';
}

/** Get display name from user object */
function getDisplayName(user: User | null): string {
    if (!user) return 'User';
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'User';
}

// ==========================================
// Component
// ==========================================

const SidebarUserSection = React.memo(function SidebarUserSection() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="sidenav-user-footer" ref={userMenuRef}>
            {/* Logout menu - slides up when open */}
            <div className={`sidenav-user-menu ${userMenuOpen ? 'open' : ''}`}>
                <button
                    className="sidenav-user-menu-item"
                    aria-label="Log out of your account"
                    onClick={() => {
                        authService.logout();
                        setUserMenuOpen(false);
                    }}
                >
                    <Logout size={16} />
                    <span>Log out</span>
                </button>
            </div>

            {/* User profile row - stays at bottom */}
            <div
                className="sidenav-user-profile"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                role="button"
                tabIndex={0}
                aria-label={`User menu for ${getDisplayName(authService.currentUser)}`}
                aria-expanded={userMenuOpen}
                onKeyDown={(e) => e.key === 'Enter' && setUserMenuOpen(!userMenuOpen)}
            >
                <div className="sidenav-user-avatar">
                    {getInitials(authService.currentUser?.username, authService.currentUser?.email)}
                </div>
                <div className="sidenav-user-info">
                    <span className="sidenav-user-name">{getDisplayName(authService.currentUser)}</span>
                    <span className="sidenav-user-role">{authService.currentUser?.role ? ROLE_NAMES[authService.currentUser.role] : 'Viewer'}</span>
                </div>
                <ChevronUp
                    size={16}
                    className={`sidenav-user-chevron ${userMenuOpen ? 'open' : ''}`}
                />
            </div>
        </div>
    );
});

export { SidebarUserSection };
export default SidebarUserSection;
