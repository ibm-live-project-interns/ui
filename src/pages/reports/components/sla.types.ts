/**
 * Copyright IBM Corp. 2026
 *
 * SLA Reports - Shared types and constants.
 */

import type { SeverityBreakdown } from './ComplianceBySeverityTable';
import type { SLAViolation } from './ViolationsTable';
import type { SLATrendPoint } from './ComplianceTrendChart';

// ==========================================
// API Response Types
// ==========================================

export interface SLAOverview {
    compliance_percent: number;
    mttr_minutes: number;
    mttr_display: string;
    mtta_minutes: number;
    mtta_display: string;
    total_violations: number;
    total_alerts: number;
    resolved_count: number;
    period: string;
    by_severity: SeverityBreakdown[];
}

export interface SLAViolationsResponse {
    violations: SLAViolation[];
    total: number;
    period: string;
}

export interface SLATrendResponse {
    trend: SLATrendPoint[];
    period: string;
}

export interface PeriodOption {
    id: string;
    text: string;
}

// ==========================================
// Constants
// ==========================================

export const SLA_PERIOD_OPTIONS: PeriodOption[] = [
    { id: '7d', text: 'Last 7 Days' },
    { id: '30d', text: 'Last 30 Days' },
    { id: '90d', text: 'Last 90 Days' },
];

export const SLA_TARGET_PERCENT = 99.9;
