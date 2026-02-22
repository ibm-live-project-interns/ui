/**
 * Shared types and constants for the Priority Alerts page and its child components.
 */

import type { KPICardProps, KPISeverity } from '@/components/ui/KPICard';
import type { Severity } from '@/shared/types/common.types';
import { SEVERITY_CONFIG } from '@/shared/constants/severity';
import type { PriorityAlert } from '@/features/alerts/types/alert.types';

// ==========================================
// Constants
// ==========================================

export const QUICK_FILTERS = ['Critical Only', 'Unacknowledged', 'My Devices', 'Repeated Alerts'];
export const MAX_BULK_ALERTS = 100;

export const ALERT_TABLE_HEADERS = [
    { key: 'severity', header: 'Severity' },
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'device', header: 'Device' },
    { key: 'aiSummary', header: 'AI Summary' },
    { key: 'status', header: 'Status' },
    { key: 'confidence', header: 'Confidence' },
    { key: 'actions', header: 'Actions' },
];

// ==========================================
// Table Row Type
// ==========================================

export interface AlertTableRow {
    id: string;
    severity: string;
    timestamp: string;
    device: string;
    aiSummary: string;
    status: string;
    confidence: number;
    actions: string;
}

// ==========================================
// Helpers
// ==========================================

/**
 * Safely render a timestamp value that may be a string, object with relative/absolute, or unknown.
 */
export function renderTimestampValue(ts: unknown): string {
    if (typeof ts === 'string') return ts;
    if (!ts) return 'N/A';
    const candidate = (ts as Record<string, unknown>).relative ?? (ts as Record<string, unknown>).absolute ?? ts;
    return (typeof candidate === 'object') ? JSON.stringify(candidate) : String(candidate);
}

/**
 * Generate KPI card data from the full alerts array.
 */
export function generateKPIData(alerts: PriorityAlert[]): KPICardProps[] {
    const counts: Record<Severity, number> = {
        critical: 0,
        high: 0,
        major: 0,
        medium: 0,
        minor: 0,
        low: 0,
        info: 0,
    };

    alerts.forEach((alert) => {
        if (counts[alert.severity] !== undefined) {
            counts[alert.severity]++;
        }
    });

    return [
        {
            id: 'critical',
            label: 'Critical Alerts',
            value: counts.critical,
            subtitle: `Priority ${SEVERITY_CONFIG.critical.priority}`,
            icon: SEVERITY_CONFIG.critical.icon,
            iconColor: SEVERITY_CONFIG.critical.color,
            severity: 'critical' as KPISeverity,
        },
        {
            id: 'major',
            label: 'Major Alerts',
            value: counts.major,
            subtitle: `Priority ${SEVERITY_CONFIG.major.priority}`,
            icon: SEVERITY_CONFIG.major.icon,
            iconColor: SEVERITY_CONFIG.major.color,
            severity: 'major' as KPISeverity,
        },
        {
            id: 'minor',
            label: 'Minor Alerts',
            value: counts.minor,
            subtitle: `Priority ${SEVERITY_CONFIG.minor.priority}`,
            icon: SEVERITY_CONFIG.minor.icon,
            iconColor: SEVERITY_CONFIG.minor.color,
            severity: 'minor' as KPISeverity,
        },
        {
            id: 'info',
            label: 'Info Alerts',
            value: counts.info,
            subtitle: `Priority ${SEVERITY_CONFIG.info.priority}`,
            icon: SEVERITY_CONFIG.info.icon,
            iconColor: SEVERITY_CONFIG.info.color,
            severity: 'info' as KPISeverity,
        },
    ];
}
