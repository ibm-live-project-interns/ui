/**
 * Shared types, constants, and helpers for the Runbooks page and its child components.
 */

import type { KPICardProps } from '@/components/ui/KPICard';
import {
    Book,
    Category,
    StarFilled,
    Time,
} from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

export interface RunbookStats {
    total_runbooks: number;
    total_categories: number;
    most_used_title: string;
    most_used_count: number;
    recently_updated: string;
    recently_updated_at: string;
}

export interface RunbooksResponse {
    runbooks: import('./RunbookCard').Runbook[];
    total: number;
    stats: RunbookStats;
}

export interface FilterOption {
    id: string;
    text: string;
}

// ==========================================
// Constants
// ==========================================

export const CATEGORY_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Categories' },
    { id: 'Hardware', text: 'Hardware' },
    { id: 'Network', text: 'Network' },
    { id: 'Software', text: 'Software' },
    { id: 'Security', text: 'Security' },
];

export const EMPTY_RUNBOOK_FORM = {
    title: '',
    category: '',
    description: '',
    steps: [''],
    related_alert_types: [] as string[],
};

export const DEFAULT_STATS: RunbookStats = {
    total_runbooks: 0,
    total_categories: 0,
    most_used_title: 'N/A',
    most_used_count: 0,
    recently_updated: 'N/A',
    recently_updated_at: '',
};

// ==========================================
// Step ID Generator
// ==========================================

/** Counter for unique step IDs -- array indices cause reconciliation issues when reordering */
let stepIdCounter = 0;

export function nextStepId(): string {
    return `step-${++stepIdCounter}`;
}

// ==========================================
// Helpers
// ==========================================

export function formatRelativeDate(isoString: string): string {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return isoString;
    }
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trimEnd() + '...';
}

// ==========================================
// KPI Data Generator
// ==========================================

export function generateRunbookKPIData(stats: RunbookStats): KPICardProps[] {
    return [
        {
            id: 'total-runbooks',
            label: 'Total Runbooks',
            value: stats.total_runbooks,
            icon: Book,
            iconColor: '#0f62fe',
            severity: 'info' as const,
            subtitle: 'Knowledge base articles',
        },
        {
            id: 'categories',
            label: 'Categories',
            value: stats.total_categories,
            icon: Category,
            iconColor: '#8a3ffc',
            severity: 'neutral' as const,
            subtitle: 'Hardware, Network, Software, Security',
        },
        {
            id: 'most-used',
            label: 'Most Used Runbook',
            value: stats.most_used_count,
            icon: StarFilled,
            iconColor: '#f1c21b',
            severity: 'success' as const,
            subtitle: truncateText(stats.most_used_title, 40),
        },
        {
            id: 'recently-updated',
            label: 'Recently Updated',
            value: formatRelativeDate(stats.recently_updated_at),
            icon: Time,
            iconColor: '#198038',
            severity: 'success' as const,
            subtitle: truncateText(stats.recently_updated, 40),
        },
    ];
}
