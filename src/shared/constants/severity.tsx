/**
 * Severity Constants and Utilities
 *
 * Single source of truth for severity-related configurations.
 */

import type { ReactElement } from 'react';
import { Tag } from '@carbon/react';
import {
    ErrorFilled,
    WarningFilled,
    WarningAlt,
    InformationFilled,
} from '@carbon/icons-react';
import type { Severity, SeverityDisplay } from '@/shared/types';
import { SEVERITY_COLORS, SEVERITY_BG_COLORS } from './colors';

// Re-export for convenience
export type { Severity, SeverityDisplay };

// ==========================================
// Severity Configuration
// ==========================================

export interface SeverityConfig {
    label: SeverityDisplay;
    color: string;
    backgroundColor: string;
    tagType: 'red' | 'magenta' | 'purple' | 'blue' | 'teal';
    icon: typeof ErrorFilled;
    description: string;
    priority: number;
}

export const SEVERITY_CONFIG: Record<Severity, SeverityConfig> = {
    critical: {
        label: 'Critical',
        color: SEVERITY_COLORS.critical,
        backgroundColor: SEVERITY_BG_COLORS.critical,
        tagType: 'red',
        icon: ErrorFilled,
        description: 'Requires immediate action',
        priority: 1,
    },
    high: {
        label: 'High',
        color: SEVERITY_COLORS.high,
        backgroundColor: SEVERITY_BG_COLORS.high,
        tagType: 'magenta',
        icon: WarningFilled,
        description: 'High priority issues',
        priority: 2,
    },
    major: {
        label: 'Major',
        color: SEVERITY_COLORS.major,
        backgroundColor: SEVERITY_BG_COLORS.major,
        tagType: 'magenta',
        icon: WarningFilled,
        description: 'High priority issues',
        priority: 2,
    },
    medium: {
        label: 'Medium',
        color: SEVERITY_COLORS.medium,
        backgroundColor: SEVERITY_BG_COLORS.medium,
        tagType: 'purple',
        icon: WarningAlt,
        description: 'Monitor closely',
        priority: 3,
    },
    minor: {
        label: 'Minor',
        color: SEVERITY_COLORS.minor,
        backgroundColor: SEVERITY_BG_COLORS.minor,
        tagType: 'purple',
        icon: WarningAlt,
        description: 'Monitor closely',
        priority: 3,
    },
    low: {
        label: 'Low',
        color: SEVERITY_COLORS.low,
        backgroundColor: SEVERITY_BG_COLORS.low,
        tagType: 'teal',
        icon: InformationFilled,
        description: 'Low priority',
        priority: 4,
    },
    info: {
        label: 'Info',
        color: SEVERITY_COLORS.info,
        backgroundColor: SEVERITY_BG_COLORS.info,
        tagType: 'blue',
        icon: InformationFilled,
        description: 'Informational only',
        priority: 5,
    },
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'major', 'medium', 'minor', 'low', 'info'];

/** Filter option type */
export interface FilterOption {
    id: string;
    text: string;
}

/** Filter dropdown options for severity */
export const SEVERITY_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Severities' },
    { id: 'critical', text: 'Critical' },
    { id: 'high', text: 'High' },
    { id: 'medium', text: 'Medium' },
    { id: 'low', text: 'Low' },
    { id: 'info', text: 'Info' },
];

/** Time period filter options for charts and data queries */
export const TIME_PERIOD_OPTIONS: FilterOption[] = [
    { id: '24h', text: 'Last 24 Hours' },
    { id: '7d', text: 'Last 7 Days' },
    { id: '30d', text: 'Last 30 Days' },
    { id: '90d', text: 'Last 90 Days' },
];

// ==========================================
// Helper Functions
// ==========================================

export function normalizeSeverity(severity: string): Severity {
    const lower = severity.toLowerCase();
    if (['critical', 'high', 'major', 'medium', 'minor', 'low', 'info'].includes(lower)) {
        return lower as Severity;
    }
    return 'info';
}

export function toDisplaySeverity(severity: Severity): SeverityDisplay {
    return SEVERITY_CONFIG[severity].label;
}

export function getSeverityIcon(severity: Severity, size: number = 24): ReactElement {
    const config = SEVERITY_CONFIG[severity];
    const IconComponent = config.icon;
    return <IconComponent size={size} style={{ color: config.color }} />;
}

export function getSeverityTag(severity: Severity, size: 'sm' | 'md' = 'sm'): ReactElement {
    const config = SEVERITY_CONFIG[severity];
    return <Tag type={config.tagType} size={size}>{config.label}</Tag>;
}

export function getSeverityBackgroundClass(severity: Severity): string {
    return `severity-bg severity-bg--${severity}`;
}

export function sortBySeverity<T extends { severity: Severity }>(items: T[]): T[] {
    return [...items].sort((a, b) =>
        SEVERITY_CONFIG[a.severity].priority - SEVERITY_CONFIG[b.severity].priority
    );
}
