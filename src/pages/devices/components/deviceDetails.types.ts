/**
 * Copyright IBM Corp. 2026
 *
 * Device Details - Shared Types, Constants, and Helper Functions
 * Used by DeviceDetailsPage and its child components.
 */

import type { DeviceDetails } from '@/shared/services';
import { env, API_ENDPOINTS } from '@/shared/config';

// ==========================================
// Types
// ==========================================

export interface MetricDataPoint {
    group: string;
    date: Date;
    value: number;
}

export type MetricsPeriod = '1h' | '6h' | '24h' | '7d';

export interface MetricsAPIResponse {
    metrics: Array<{
        timestamp: string;
        cpu_usage: number;
        memory_usage: number;
        bandwidth_in: number;
        bandwidth_out: number;
        error_rate: number;
    }>;
    device_id: string;
    period: string;
}

export interface Incident {
    id: string;
    time: string;
    severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
    description: string;
    category: string;
    ticketId?: string;
}

// ==========================================
// Constants
// ==========================================

export const PERIOD_OPTIONS: { key: MetricsPeriod; label: string }[] = [
    { key: '1h', label: '1 Hour' },
    { key: '6h', label: '6 Hours' },
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
];

export const INCIDENT_HEADERS = [
    { header: 'TIME', key: 'time' },
    { header: 'SEVERITY', key: 'severity' },
    { header: 'DESCRIPTION', key: 'description' },
    { header: 'CATEGORY', key: 'category' },
    { header: 'TICKET', key: 'ticketId' },
];

// ==========================================
// Helper Functions
// ==========================================

/**
 * Build the full metrics API URL for a given device and period.
 * Uses the centralized API_ENDPOINTS config.
 */
export function buildMetricsUrl(id: string, period: MetricsPeriod): string {
    const base = env.apiBaseUrl.replace(/\/$/, '');
    return `${base}/api/${env.apiVersion}${API_ENDPOINTS.DEVICE_METRICS(id)}?period=${period}`;
}

/**
 * Map a device status to a badge hex color for the PageHeader.
 */
export function getStatusBadgeColor(status: DeviceDetails['status']): string {
    switch (status) {
        case 'online': return 'var(--cds-support-success, #24a148)';
        case 'critical': return 'var(--cds-support-error, #da1e28)';
        case 'warning': return 'var(--cds-support-warning, #ff832b)';
        case 'offline': return 'var(--cds-text-helper, #8d8d8d)';
        default: return 'var(--cds-text-helper, #8d8d8d)';
    }
}

/**
 * Map a device status to its display config (color, icon name, label).
 */
export function getStatusConfigKey(status: DeviceDetails['status']): 'online' | 'warning' | 'critical' | 'offline' {
    if (status === 'online' || status === 'warning' || status === 'critical' || status === 'offline') {
        return status;
    }
    return 'offline';
}

/**
 * Map a health score to its display color.
 */
export function getHealthColor(score: number): string {
    if (score >= 80) return 'var(--cds-support-success, #24a148)';
    if (score >= 50) return 'var(--cds-support-warning, #ff832b)';
    return 'var(--cds-support-error, #da1e28)';
}
