/**
 * Alert Data Service
 *
 * Unified data layer for alert operations.
 * Automatically switches between mock data and real API based on environment config.
 *
 * Usage:
 *   import { alertDataService } from '@/services/AlertDataService';
 *   const alerts = await alertDataService.getAlerts();
 */

import { env, API_ENDPOINTS } from '@/config';
import { HttpService } from './HttpService';
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
    Severity,
} from '@/constants';
import {
    MOCK_PRIORITY_ALERTS,
    MOCK_NOC_ALERTS,
    MOCK_ALERT_DETAIL,
    MOCK_SEVERITY_DISTRIBUTION,
    MOCK_TOP_NOISY_DEVICES,
    MOCK_AI_IMPACT_METRICS,
    ALERTS_OVER_TIME,
    MOCK_TRENDS_KPI,
    MOCK_TOP_RECURRING_ALERT_TYPES,
    MOCK_ALERT_DISTRIBUTION_TIME,
    MOCK_AI_INSIGHTS,
    getActiveAlertCount as getMockActiveAlertCount,
    getAlertCountBySeverity as getMockAlertCountBySeverity,
} from '@/__mocks__/alerts.mock';

// ==========================================
// Service Interface
// ==========================================

export interface TrendKPI {
    id: string;
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    subtitle?: string;
    tag?: { text: string; type: string };
}

export interface RecurringAlert {
    id: string;
    name: string;
    count: number;
    severity: string;
    avgResolution: string;
    percentage: number;
}

export interface AlertDistribution {
    group: string;
    value: number;
    description?: string; // For compatibility
}

export interface AIInsight {
    id: string;
    type: 'pattern' | 'optimization' | 'recommendation';
    description: string;
    action: string;
}

export interface IAlertDataService {
    // Alert queries
    getAlerts(): Promise<PriorityAlert[]>;
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
    createTicket(id: string, details?: { title: string; description: string; priority: string }): Promise<void>;
    exportReport(format: 'csv' | 'pdf'): Promise<void>;
}

// ==========================================
// Mock Implementation
// ==========================================

class MockAlertDataService implements IAlertDataService {
    private simulateDelay(): Promise<void> {
        // Simulate network latency in mock mode for realistic UX
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    async getAlerts(): Promise<PriorityAlert[]> {
        await this.simulateDelay();
        return MOCK_PRIORITY_ALERTS;
    }

    async getNocAlerts(): Promise<SummaryAlert[]> {
        await this.simulateDelay();
        return MOCK_NOC_ALERTS;
    }

    async getAlertsSummary(): Promise<AlertSummary> {
        await this.simulateDelay();
        // Construct summary from active count mocks or return a static mock object if available
        // For now, construct it dynamically from count helpers to ensure consistency
        const active = await getMockActiveAlertCount();
        const critical = await getMockAlertCountBySeverity('critical');
        const major = await getMockAlertCountBySeverity('major');
        const minor = await getMockAlertCountBySeverity('minor');
        const info = await getMockAlertCountBySeverity('info');

        return {
            activeCount: active,
            criticalCount: critical,
            majorCount: major,
            minorCount: minor,
            infoCount: info
        };
    }

    async getAlertById(id: string): Promise<DetailedAlert | null> {
        await this.simulateDelay();
        // First check if the ID matches our detailed mock
        if (id === MOCK_ALERT_DETAIL.id) {
            return MOCK_ALERT_DETAIL;
        }
        // Otherwise try to find in priority alerts and return a detailed version
        const alert = MOCK_PRIORITY_ALERTS.find(a => a.id === id);
        if (alert) {
            // Create a DetailedAlert from PriorityAlert
            return {
                ...MOCK_ALERT_DETAIL,
                id: alert.id,
                aiTitle: alert.aiTitle,
                severity: alert.severity,
                status: alert.status,
                device: alert.device,
                timestamp: alert.timestamp,
                aiSummary: alert.aiSummary,
                confidence: alert.confidence,
            };
        }
        return null;
    }

    async getActiveAlertCount(): Promise<number> {
        await this.simulateDelay();
        return getMockActiveAlertCount();
    }

    async getAlertCountBySeverity(severity: Severity): Promise<number> {
        await this.simulateDelay();
        return getMockAlertCountBySeverity(severity);
    }

    async getAlertsOverTime(period: TimePeriod): Promise<ChartDataPoint[]> {
        await this.simulateDelay();
        return ALERTS_OVER_TIME[period];
    }

    async getSeverityDistribution(): Promise<DistributionDataPoint[]> {
        await this.simulateDelay();
        return MOCK_SEVERITY_DISTRIBUTION;
    }

    async getNoisyDevices(): Promise<NoisyDevice[]> {
        await this.simulateDelay();
        return MOCK_TOP_NOISY_DEVICES;
    }

    async getAIMetrics(): Promise<AIMetric[]> {
        await this.simulateDelay();
        return MOCK_AI_IMPACT_METRICS;
    }

    async getTrendsKPI(): Promise<TrendKPI[]> {
        await this.simulateDelay();
        return MOCK_TRENDS_KPI as unknown as TrendKPI[];
    }

    async getRecurringAlerts(): Promise<RecurringAlert[]> {
        await this.simulateDelay();
        return MOCK_TOP_RECURRING_ALERT_TYPES;
    }

    async getAlertDistributionTime(): Promise<AlertDistribution[]> {
        await this.simulateDelay();
        return MOCK_ALERT_DISTRIBUTION_TIME;
    }

    async getAIInsights(): Promise<AIInsight[]> {
        await this.simulateDelay();
        return MOCK_AI_INSIGHTS as AIInsight[];
    }

    async getAIImpactOverTime(): Promise<ChartDataPoint[]> {
        await this.simulateDelay();
        // Return duplicate of over-time for now in mock to avoid creating more mock data
        return ALERTS_OVER_TIME['24h'];
    }

    async acknowledgeAlert(id: string): Promise<void> {
        await this.simulateDelay();
        console.log(`[Mock] Acknowledged alert ${id}`);
    }

    async dismissAlert(id: string): Promise<void> {
        await this.simulateDelay();
        console.log(`[Mock] Dismissed alert ${id}`);
    }

    async createTicket(id: string, details?: { title: string; description: string; priority: string }): Promise<void> {
        await this.simulateDelay();
        console.log(`[Mock] Created ticket for alert ${id}`, details);
    }

    async exportReport(format: 'csv' | 'pdf'): Promise<void> {
        await this.simulateDelay();

        const alerts = MOCK_PRIORITY_ALERTS;

        if (format === 'csv') {
            const headers = ['ID', 'Severity', 'Status', 'Device', 'IP', 'Summary', 'Confidence', 'Timestamp'];
            const rows = alerts.map(a => [
                a.id,
                a.severity,
                a.status,
                a.device.name,
                a.device.ip,
                `"${a.aiSummary.replace(/"/g, '""')}"`, // Escape quotes in CSV
                `${a.confidence}%`,
                a.timestamp.absolute
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            // Trigger download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `alerts-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            // PDF would require a library like jsPDF - for now just log
            console.log(`[Mock] PDF export not implemented yet`);
        }
    }
}

// ==========================================
// API Implementation
// ==========================================

class ApiAlertDataService extends HttpService implements IAlertDataService {
    constructor() {
        // Build URL: baseUrl + /api/v1
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
    }

    async getAlerts(): Promise<PriorityAlert[]> {
        return this.get<PriorityAlert[]>(API_ENDPOINTS.ALERTS);
    }

    async getNocAlerts(): Promise<SummaryAlert[]> {
        return this.get<SummaryAlert[]>(API_ENDPOINTS.ALERTS);
    }

    async getAlertsSummary(): Promise<AlertSummary> {
        return this.get<AlertSummary>(API_ENDPOINTS.ALERTS_SUMMARY);
    }

    async getAlertById(id: string): Promise<DetailedAlert | null> {
        try {
            return await this.get<DetailedAlert>(API_ENDPOINTS.ALERT_BY_ID(id));
        } catch {
            return null;
        }
    }

    async getActiveAlertCount(): Promise<number> {
        const summary = await this.getAlertsSummary();
        return summary.activeCount;
    }

    async getAlertCountBySeverity(severity: Severity): Promise<number> {
        const distribution = await this.getSeverityDistribution();
        const item = distribution.find(d => d.group.toLowerCase() === severity);
        return item?.value ?? 0;
    }

    async getAlertsOverTime(period: TimePeriod): Promise<ChartDataPoint[]> {
        return this.get<ChartDataPoint[]>(`${API_ENDPOINTS.ALERTS_OVER_TIME}?period=${period}`);
    }

    async getSeverityDistribution(): Promise<DistributionDataPoint[]> {
        return this.get<DistributionDataPoint[]>(API_ENDPOINTS.ALERTS_SEVERITY_DISTRIBUTION);
    }

    async getNoisyDevices(): Promise<NoisyDevice[]> {
        return this.get<NoisyDevice[]>(API_ENDPOINTS.DEVICES_NOISY);
    }

    async getAIMetrics(): Promise<AIMetric[]> {
        return this.get<AIMetric[]>(API_ENDPOINTS.AI_METRICS);
    }

    async getTrendsKPI(): Promise<TrendKPI[]> {
        return this.get<TrendKPI[]>('/trends/kpi');
    }

    async getRecurringAlerts(): Promise<RecurringAlert[]> {
        return this.get<RecurringAlert[]>('/alerts/recurring');
    }

    async getAlertDistributionTime(): Promise<AlertDistribution[]> {
        return this.get<AlertDistribution[]>('/alerts/distribution/time');
    }

    async getAIInsights(): Promise<AIInsight[]> {
        return this.get<AIInsight[]>('/ai/insights');
    }

    async getAIImpactOverTime(): Promise<ChartDataPoint[]> {
        return this.get<ChartDataPoint[]>('/ai/impact-over-time');
    }

    async acknowledgeAlert(id: string): Promise<void> {
        return this.post<void>(`/alerts/${id}/acknowledge`, {});
    }

    async dismissAlert(id: string): Promise<void> {
        return this.post<void>(`/alerts/${id}/dismiss`, {});
    }

    async createTicket(id: string, details?: { title: string; description: string; priority: string }): Promise<void> {
        return this.post<void>('/tickets', { alertId: id, ...details });
    }

    async exportReport(format: 'csv' | 'pdf'): Promise<void> {
        // For file downloads, we might need a different handling in HttpService,
        // but for now assuming it triggers a download or returns a URL
        return this.get<void>(`/reports/export?format=${format}`);
    }
}

// ==========================================
// Service Factory
// ==========================================

function createAlertDataService(): IAlertDataService {
    if (env.useMockData) {
        console.info('[AlertDataService] Using mock data');
        return new MockAlertDataService();
    }
    console.info('[AlertDataService] Using API:', env.apiBaseUrl);
    return new ApiAlertDataService();
}

// Export singleton instance
export const alertDataService = createAlertDataService();
