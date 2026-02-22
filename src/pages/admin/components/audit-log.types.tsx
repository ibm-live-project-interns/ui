/**
 * Shared types and helpers for AuditLog components.
 */

import { Tag } from '@carbon/react';
import { CheckmarkFilled, CloseFilled } from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

export interface AuditLogEntry {
    id: number;
    created_at: string;
    user_id: number;
    username: string;
    action: string;
    resource: string;
    resource_id: string;
    details: Record<string, unknown> | null;
    ip_address: string;
    result: 'success' | 'failure';
}

export interface AuditLogStats {
    total_actions_24h: number;
    failed_actions_24h: number;
    active_users_24h: number;
    most_active_user: string;
    most_active_user_actions: number;
}

export interface FilterOption {
    id: string;
    text: string;
}

// ==========================================
// Display helpers
// ==========================================

const ACTION_LABELS: Record<string, string> = {
    'user.create': 'User Created',
    'user.update': 'User Updated',
    'user.delete': 'User Deleted',
    'user.login': 'User Login',
    'user.logout': 'User Logout',
    'user.password_reset': 'Password Reset',
    'alert.acknowledge': 'Alert Acknowledged',
    'alert.resolve': 'Alert Resolved',
    'alert.dismiss': 'Alert Dismissed',
    'ticket.create': 'Ticket Created',
    'ticket.update': 'Ticket Updated',
    'ticket.delete': 'Ticket Deleted',
    'config.create': 'Config Created',
    'config.update': 'Config Updated',
    'config.delete': 'Config Deleted',
    'report.export': 'Report Exported',
};

const RESOURCE_LABELS: Record<string, string> = {
    user: 'User',
    alert: 'Alert',
    ticket: 'Ticket',
    config: 'Configuration',
    session: 'Session',
    report: 'Report',
    device: 'Device',
};

export function getActionLabel(action: string): string {
    return ACTION_LABELS[action] || action;
}

export function getResourceLabel(resource: string): string {
    return RESOURCE_LABELS[resource] || resource;
}

export function getResultTag(result: string) {
    if (result === 'success') {
        return <Tag type="green" size="sm" renderIcon={CheckmarkFilled}>Success</Tag>;
    }
    return <Tag type="red" size="sm" renderIcon={CloseFilled}>Failure</Tag>;
}

export function getActionTag(action: string) {
    const prefix = action.split('.')[0];
    const tagTypes: Record<string, 'blue' | 'teal' | 'purple' | 'cyan' | 'magenta' | 'warm-gray'> = {
        user: 'blue',
        alert: 'magenta',
        ticket: 'teal',
        config: 'purple',
        report: 'cyan',
        session: 'warm-gray',
    };
    const tagType = tagTypes[prefix] || 'warm-gray';
    return <Tag type={tagType} size="sm">{getActionLabel(action)}</Tag>;
}

export function formatTimestamp(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    } catch {
        return isoString;
    }
}

export function formatDetails(details: Record<string, unknown> | null): string {
    if (!details || Object.keys(details).length === 0) return '--';
    return Object.entries(details)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(', ');
}

/** Build a navigation path for a resource type + resource ID */
export function getResourceLink(resource: string, resourceId: string): string | null {
    if (!resourceId) return null;
    switch (resource) {
        case 'alert': return `/alerts/${resourceId}`;
        case 'ticket': return `/tickets/${resourceId}`;
        case 'device': return `/devices/${resourceId}`;
        case 'user': return null;
        case 'config': return '/configuration';
        default: return null;
    }
}

// ==========================================
// Filter Options
// ==========================================

export const RESULT_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Results' },
    { id: 'success', text: 'Success' },
    { id: 'failure', text: 'Failure' },
];

export const RESOURCE_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Resources' },
    { id: 'user', text: 'User' },
    { id: 'alert', text: 'Alert' },
    { id: 'ticket', text: 'Ticket' },
    { id: 'config', text: 'Configuration' },
    { id: 'session', text: 'Session' },
    { id: 'report', text: 'Report' },
    { id: 'device', text: 'Device' },
];
