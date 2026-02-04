/**
 * Status Constants and Utilities
 *
 * Alert status configurations and helpers.
 * Values must match backend models/alert.go AlertStatus constants.
 */

import type { ReactElement } from 'react';
import { Tag } from '@carbon/react';
import type { AlertStatus, StatusDisplay } from '@/shared/types';

// ==========================================
// Status Configuration
// Matches backend: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
// ==========================================

export interface StatusConfig {
    label: StatusDisplay;
    tagType: 'teal' | 'blue' | 'green' | 'gray';
}

export const STATUS_CONFIG: Record<AlertStatus, StatusConfig> = {
    open: { label: 'Open', tagType: 'teal' },
    acknowledged: { label: 'Acknowledged', tagType: 'blue' },
    resolved: { label: 'Resolved', tagType: 'green' },
    dismissed: { label: 'Dismissed', tagType: 'gray' },
};

export const STATUS_ORDER: AlertStatus[] = ['open', 'acknowledged', 'resolved', 'dismissed'];

// Import FilterOption from severity to keep single source
import type { FilterOption } from './severity';

/** Filter dropdown options for alert status */
export const STATUS_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Status' },
    { id: 'open', text: 'Open' },
    { id: 'acknowledged', text: 'Acknowledged' },
    { id: 'resolved', text: 'Resolved' },
    { id: 'dismissed', text: 'Dismissed' },
];

// ==========================================
// Helper Functions
// ==========================================

export function normalizeStatus(status: string): AlertStatus {
    const lower = status.toLowerCase();
    if (['open', 'acknowledged', 'resolved', 'dismissed'].includes(lower)) {
        return lower as AlertStatus;
    }
    return 'open';
}

export function toDisplayStatus(status: AlertStatus): StatusDisplay {
    return STATUS_CONFIG[status].label;
}

export function getStatusTag(status: AlertStatus | string | undefined, size: 'sm' | 'md' = 'sm'): ReactElement {
    // Normalize and validate status
    const normalizedStatus = status ? normalizeStatus(String(status)) : 'open';
    const config = STATUS_CONFIG[normalizedStatus];
    // Fallback if config somehow still undefined
    if (!config) {
        return <Tag type="gray" size={size}>Unknown</Tag>;
    }
    return <Tag type={config.tagType} size={size}>{config.label}</Tag>;
}
