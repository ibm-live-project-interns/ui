/**
 * Ticket Constants and Utilities
 *
 * Single source of truth for ticket-related configurations.
 * Use these constants instead of hardcoding values in components.
 */

import type { ReactElement } from 'react';
import { Tag } from '@carbon/react';
import type { TicketPriority, TicketStatus } from '@/shared/types';
import { PRIORITY_COLORS } from './colors';

// Re-export types for convenience
export type { TicketPriority, TicketStatus };

// ==========================================
// Priority Configuration
// ==========================================

export interface PriorityConfig {
    label: string;
    color: string;
    tagType: 'red' | 'magenta' | 'purple' | 'blue' | 'teal' | 'green';
    description: string;
    order: number;
}

export const PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
    critical: {
        label: 'Critical',
        color: PRIORITY_COLORS.critical,
        tagType: 'red',
        description: 'Requires immediate attention',
        order: 1,
    },
    high: {
        label: 'High',
        color: PRIORITY_COLORS.high,
        tagType: 'magenta',
        description: 'Urgent priority',
        order: 2,
    },
    medium: {
        label: 'Medium',
        color: PRIORITY_COLORS.medium,
        tagType: 'purple',
        description: 'Normal priority',
        order: 3,
    },
    low: {
        label: 'Low',
        color: PRIORITY_COLORS.low,
        tagType: 'blue',
        description: 'Can be addressed later',
        order: 4,
    },
};

export const PRIORITY_ORDER: TicketPriority[] = ['critical', 'high', 'medium', 'low'];

// ==========================================
// Ticket Status Configuration
// ==========================================

export interface TicketStatusConfig {
    label: string;
    color: string;
    tagType: 'red' | 'magenta' | 'purple' | 'blue' | 'teal' | 'green' | 'gray' | 'cool-gray';
    description: string;
}

export const TICKET_STATUS_CONFIG: Record<TicketStatus, TicketStatusConfig> = {
    open: {
        label: 'Open',
        color: 'var(--cds-support-error, #da1e28)',
        tagType: 'red',
        description: 'Awaiting action',
    },
    'in-progress': {
        label: 'In Progress',
        color: 'var(--cds-support-warning, #ff832b)',
        tagType: 'magenta',
        description: 'Being worked on',
    },
    pending: {
        label: 'Pending',
        color: 'var(--cds-support-info, #8a3ffc)',
        tagType: 'purple',
        description: 'Awaiting response',
    },
    resolved: {
        label: 'Resolved',
        color: 'var(--cds-support-success, #24a148)',
        tagType: 'green',
        description: 'Issue fixed',
    },
    closed: {
        label: 'Closed',
        color: 'var(--cds-text-helper, #6f6f6f)',
        tagType: 'gray',
        description: 'Ticket closed',
    },
};

export const TICKET_STATUS_ORDER: TicketStatus[] = ['open', 'in-progress', 'pending', 'resolved', 'closed'];

// ==========================================
// Filter Options for Dropdowns
// ==========================================

import type { FilterOption } from './severity';

export const PRIORITY_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Priorities' },
    { id: 'critical', text: 'Critical' },
    { id: 'high', text: 'High' },
    { id: 'medium', text: 'Medium' },
    { id: 'low', text: 'Low' },
];

export const TICKET_STATUS_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Status' },
    { id: 'open', text: 'Open' },
    { id: 'in-progress', text: 'In Progress' },
    { id: 'pending', text: 'Pending' },
    { id: 'resolved', text: 'Resolved' },
    { id: 'closed', text: 'Closed' },
];

// ==========================================
// Helper Functions
// ==========================================

export function getPriorityTag(priority: TicketPriority, size: 'sm' | 'md' = 'sm'): ReactElement {
    const config = PRIORITY_CONFIG[priority];
    return <Tag type={config.tagType} size={size}>{config.label}</Tag>;
}

export function getTicketStatusTag(status: TicketStatus, size: 'sm' | 'md' = 'sm'): ReactElement {
    const config = TICKET_STATUS_CONFIG[status];
    return <Tag type={config.tagType} size={size}>{config.label}</Tag>;
}

export function sortByPriority<T extends { priority: TicketPriority }>(items: T[]): T[] {
    return [...items].sort((a, b) =>
        PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order
    );
}
