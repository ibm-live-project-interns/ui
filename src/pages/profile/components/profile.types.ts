/**
 * Shared types and helpers for Profile page components.
 */

import { ROLE_NAMES } from '@/shared/types';
import type { RoleID } from '@/shared/types';

export interface NotificationState {
    kind: 'success' | 'error' | 'info' | 'warning';
    title: string;
    subtitle: string;
}

export function formatDate(dateStr: string | undefined | null): string {
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

export function formatRelativeTime(dateStr: string | undefined | null): string {
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

export function getRoleName(role: string): string {
    return ROLE_NAMES[role as RoleID] || role;
}

export function getRoleTagType(role: string): 'blue' | 'cyan' | 'teal' | 'purple' | 'red' {
    const map: Record<string, 'blue' | 'cyan' | 'teal' | 'purple' | 'red'> = {
        'sysadmin': 'red',
        'senior-eng': 'purple',
        'network-admin': 'teal',
        'sre': 'cyan',
        'network-ops': 'blue',
    };
    return map[role] || 'blue';
}

export function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
}
