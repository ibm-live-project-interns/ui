/**
 * Alert Data Service - Type Definitions
 *
 * All interfaces, types, and backend response shapes used by the alert service.
 * Separated from implementation for clean dependency management.
 */

import type {
    PriorityAlert,
    DetailedAlert,
    SummaryAlert,
    AlertSummary,
    ChartDataPoint,
    DistributionDataPoint,
    NoisyDevice,
    AIMetric,
    TimePeriod,
} from '@/features/alerts/types';
import type {
    Severity,
    TrendKPI,
    RecurringAlert,
    AIInsight,
} from '@/shared/types';

// Re-export for external consumers
export type { TrendKPI, RecurringAlert, AIInsight };

// Also re-export alert types needed by consumers
export type {
    PriorityAlert,
    DetailedAlert,
    SummaryAlert,
    AlertSummary,
    ChartDataPoint,
    DistributionDataPoint,
    NoisyDevice,
    AIMetric,
    TimePeriod,
    Severity,
};

// ==========================================
// Backend Alert Shape (snake_case from Go API)
// ==========================================

/** Represents the raw alert JSON returned by the Go backend */
export interface BackendAlert {
    id?: string;
    severity?: string;
    status?: string;
    title?: string;
    ai_title?: string;
    description?: string;
    category?: string;
    ai_summary?: string;
    ai_confidence?: number;
    confidence?: number;
    timestamp?: string;
    device_id?: string;
    device_name?: string;
    device_ip?: string;
    device_model?: string;
    device_vendor?: string;
    device_type?: string;
    device_location?: string;
    location?: string;
    source_ip?: string;
    interface_name?: string;
    interface_alias?: string;
    device?: {
        name?: string;
        ip?: string;
        model?: string;
        vendor?: string;
        icon?: string;
    } | string;
    aiAnalysis?: {
        summary?: string;
        rootCauses?: string[];
        businessImpact?: string;
        recommendedActions?: string[];
    };
    ai_root_cause?: string | string[];
    root_causes?: string | string[];
    ai_impact?: string;
    business_impact?: string;
    ai_recommendation?: string | string[];
    recommended_actions?: string | string[];
    raw_payload?: string;
    raw_data?: string;
    similar_count?: number;
    similar_events?: number;
    history?: Array<{
        id: string;
        timestamp: string;
        title: string;
        severity: string;
        resolution: string;
    }>;
}

// ==========================================
// Backend Response Interfaces
// ==========================================

/** Raw summary response from backend */
export interface BackendAlertSummary {
    total?: number;
    activeCount?: number;
    criticalCount?: number;
    majorCount?: number;
    minorCount?: number;
    infoCount?: number;
    by_severity?: Record<string, number>;
    bySeverity?: Record<string, number>;
}

/** Raw time series data point from backend */
export interface BackendTimeSeriesPoint {
    timestamp?: string;
    date?: string;
    value?: number;
    label?: string;
    group?: string;
}

/** Raw severity distribution point from backend */
export interface BackendSeverityPoint {
    group?: string;
    severity?: string;
    value?: number;
    count?: number;
}

/** Raw noisy device from backend */
export interface BackendNoisyDevice {
    id?: string;
    name?: string;
    device_id?: string;
    device_name?: string;
    device?: {
        name?: string;
        ip?: string;
        icon?: string;
    };
    alertCount?: number;
    alert_count?: number;
    top_issue?: string;
    topIssue?: string;
    severity?: string;
}

/** Raw AI metrics response from backend */
export interface BackendAIMetrics {
    success_rate?: number;
    successRate?: number;
    total_processed?: number;
    totalProcessed?: number;
    alerts_enriched?: number;
    alertsEnriched?: number;
}

/** Raw trends KPI response from backend */
export interface BackendTrendsKPI {
    alert_volume?: number;
    alert_volume_change?: number;
    mttr?: number;
    mttr_change?: number;
    acknowledge_rate?: number;
    resolution_rate?: number;
}

/** Raw recurring alert from backend */
export interface BackendRecurringAlert {
    id?: string;
    pattern?: string;
    name?: string;
    count?: number;
    severity?: string;
    avg_resolution?: string;
    avgResolution?: string;
    percentage?: number;
    devices?: string[];
    first_seen?: string;
    firstSeen?: string;
    last_seen?: string;
    lastSeen?: string;
}

/** Raw AI insight from backend */
export interface BackendAIInsight {
    id?: string;
    type?: string;
    title?: string;
    description?: string;
    action_items?: string[] | string;
    action?: string;
    severity?: string;
    confidence?: number;
}

/** Raw distribution time data point from backend */
export interface BackendDistributionTimePoint {
    group?: string;
    hour?: string;
    value?: number;
    count?: number;
}

/** Raw AI impact data point from backend */
export interface BackendAIImpactPoint {
    timestamp?: string;
    date?: string;
    alerts_processed?: number;
    patterns_detected?: number;
    mttr_improvement_pct?: number;
}

/** Raw on-call schedule entry from backend */
export interface BackendOnCallEntry {
    id: string | number;
    name?: string;
    username?: string;
    role?: string;
    is_primary?: boolean;
    rotation_type?: string;
    start_time?: string;
    end_time?: string;
    contact?: string;
    email?: string;
    phone?: string;
}

/** Suggested runbooks response from backend */
export interface BackendSuggestedRunbooksResponse {
    suggestions?: SuggestedRunbook[];
    runbooks?: SuggestedRunbook[];
}

// ==========================================
// Service-specific Types
// ==========================================

export interface AlertDistribution {
    group: string;
    value: number;
    description?: string;
}

// ==========================================
// Enrichment Types
// ==========================================

export interface LinkedTicket {
    id: string;
    ticket_number: string;
    title: string;
    status: string;
    priority: string;
}

export interface SuggestedRunbook {
    id: string;
    title: string;
    category: string;
    estimated_time: string;
}

export interface PostMortemActionItem {
    description: string;
    assignee: string;
    due_date: string;
}

export interface PostMortem {
    id: string;
    alert_id: string;
    title: string;
    root_cause_category: string;
    impact_description: string;
    action_items: PostMortemActionItem[];
    prevention_measures: string;
    created_at: string;
    created_by: string;
}

export interface CreatePostMortemRequest {
    title: string;
    root_cause_category: string;
    impact_description: string;
    action_items: PostMortemActionItem[];
    prevention_measures: string;
}

export type BulkActionType = 'acknowledge' | 'resolve' | 'dismiss';

export interface BulkActionResult {
    succeeded: string[];
    failed: Record<string, string>;
}

export interface OnCallScheduleEntry {
    id: string;
    name: string;
    role: string;
    rotation_type: string;
    start_time: string;
    end_time: string;
    contact: string;
}

export interface IAlertDataService {
    // Alert queries
    getAlerts(period?: string): Promise<PriorityAlert[]>;
    getNocAlerts(): Promise<SummaryAlert[]>;
    getAlertsSummary(): Promise<AlertSummary>;
    getAlertById(id: string): Promise<DetailedAlert | null>;
    getActiveAlertCount(): Promise<number>;
    getAlertCountBySeverity(severity: Severity): Promise<number>;

    // Chart data
    getAlertsOverTime(period: TimePeriod): Promise<ChartDataPoint[]>;
    getSeverityDistribution(): Promise<DistributionDataPoint[]>;

    // Device data
    getNoisyDevices(): Promise<NoisyDevice[]>;

    // AI metrics
    getAIMetrics(): Promise<AIMetric[]>;

    // Trends & Insights
    getTrendsKPI(): Promise<TrendKPI[]>;
    getRecurringAlerts(): Promise<RecurringAlert[]>;
    getAlertDistributionTime(): Promise<AlertDistribution[]>;
    getAIInsights(): Promise<AIInsight[]>;
    getAIImpactOverTime(): Promise<ChartDataPoint[]>;

    // Actions
    acknowledgeAlert(id: string): Promise<void>;
    dismissAlert(id: string): Promise<void>;
    reanalyzeAlert(id: string): Promise<void>;
    createTicket(id: string, details?: { title: string; description: string; priority: string }): Promise<void>;
    exportReport(format: 'csv' | 'pdf'): Promise<void>;

    // Enrichment
    getAlertTickets(id: string): Promise<LinkedTicket[]>;
    getSuggestedRunbooks(category: string, severity: string, query?: string): Promise<SuggestedRunbook[]>;
    getAlertPostMortem(id: string): Promise<PostMortem | null>;
    createAlertPostMortem(id: string, data: CreatePostMortemRequest): Promise<PostMortem>;
    bulkAction(action: BulkActionType, alertIds: string[]): Promise<BulkActionResult>;
    getOnCallSchedules(): Promise<OnCallScheduleEntry[]>;
}
