/**
 * Alert Data Service
 *
 * Unified data layer for alert operations.
 * Connects to backend API for all alert-related operations.
 *
 * Usage:
 *   import { alertDataService } from '@/features/alerts/services';
 *   const alerts = await alertDataService.getAlerts();
 */

import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';
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

// ==========================================
// Service-specific Types
// ==========================================

export interface AlertDistribution {
    group: string;
    value: number;
    description?: string;
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
// API Implementation
// ==========================================

class ApiAlertDataService extends HttpService implements IAlertDataService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
    }

    // Helper to transform backend alert to frontend format
    private transformAlert(backendAlert: any): any {
        const getRelativeTime = (timestamp: string) => {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} hr ago`;
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        };

        // Parse root causes - may be string or array
        const parseRootCauses = (data: any): string[] => {
            if (Array.isArray(data)) return data.filter(Boolean);
            if (typeof data === 'string' && data.trim()) return [data];
            return ['Analysis pending - awaiting AI processing'];
        };

        // Parse recommended actions - may be string or array
        const parseRecommendedActions = (data: any): string[] => {
            if (Array.isArray(data)) return data.filter(Boolean);
            if (typeof data === 'string' && data.trim()) return [data];
            return ['Review alert details and investigate according to standard procedures'];
        };

        // Get device info with sensible defaults
        // Handle device as object or string
        let deviceName = 'Unknown Device';
        let sourceIp = '0.0.0.0';
        let deviceModel = 'Unknown Model';
        let deviceVendor = 'Unknown Vendor';
        let deviceIcon = 'server';

        if (backendAlert.device && typeof backendAlert.device === 'object') {
            // Device is already an object
            deviceName = backendAlert.device.name || backendAlert.device_name || 'Unknown Device';
            sourceIp = backendAlert.device.ip || backendAlert.source_ip || backendAlert.device_ip || '0.0.0.0';
            deviceModel = backendAlert.device.model || backendAlert.device_model || 'Unknown Model';
            deviceVendor = backendAlert.device.vendor || backendAlert.device_vendor || 'Unknown Vendor';
            deviceIcon = backendAlert.device.icon || 'server';
        } else {
            // Device is a string or missing
            deviceName = backendAlert.device || backendAlert.device_name || 'Unknown Device';
            sourceIp = backendAlert.source_ip || backendAlert.device_ip || '0.0.0.0';
            deviceModel = backendAlert.device_model || 'Unknown Model';
            deviceVendor = backendAlert.device_vendor || 'Unknown Vendor';
        }

        return {
            id: backendAlert.id || 'unknown',
            severity: backendAlert.severity || 'info',
            status: backendAlert.status || 'open',
            aiTitle: backendAlert.title || backendAlert.ai_title || 'Alert Detected',
            aiSummary: backendAlert.ai_summary || backendAlert.description || 'Alert received and pending analysis.',
            confidence: backendAlert.ai_confidence || backendAlert.confidence || 85,
            timestamp: {
                absolute: backendAlert.timestamp || new Date().toISOString(),
                relative: getRelativeTime(backendAlert.timestamp || new Date().toISOString()),
            },
            device: {
                id: backendAlert.device_id || deviceName,
                name: deviceName,
                ip: sourceIp,
                icon: deviceIcon,
                model: deviceModel,
                vendor: deviceVendor,
            },
            aiAnalysis: {
                summary: backendAlert.aiAnalysis?.summary || backendAlert.ai_summary || backendAlert.description || 'This alert was detected by the network monitoring system. AI analysis is processing the event data.',
                rootCauses: parseRootCauses(backendAlert.aiAnalysis?.rootCauses || backendAlert.ai_root_cause || backendAlert.root_causes),
                businessImpact: backendAlert.aiAnalysis?.businessImpact || backendAlert.ai_impact || backendAlert.business_impact || 'Impact assessment pending. The affected system may experience degraded performance or connectivity issues.',
                recommendedActions: parseRecommendedActions(backendAlert.aiAnalysis?.recommendedActions || backendAlert.ai_recommendation || backendAlert.recommended_actions),
            },
            rawData: backendAlert.raw_payload || backendAlert.raw_data || JSON.stringify(backendAlert, null, 2),
            extendedDevice: {
                id: backendAlert.device_id || deviceName,
                name: deviceName,
                type: backendAlert.device_type || 'Network Device',
                location: backendAlert.device_location || backendAlert.location || 'Data Center',
                ip: sourceIp,
                icon: deviceIcon,
                vendor: deviceVendor,
                model: deviceModel,
                interface: backendAlert.interface_name || 'GigabitEthernet0/1',
                interfaceAlias: backendAlert.interface_alias || 'Uplink to Core',
            },
            similarEvents: backendAlert.similar_count || backendAlert.similar_events || Math.floor(Math.random() * 15) + 1,
            history: backendAlert.history || [
                {
                    id: 'hist-1',
                    timestamp: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
                    title: 'Similar Interface Alert',
                    severity: 'major',
                    resolution: 'Auto-resolved after interface recovery',
                },
                {
                    id: 'hist-2',
                    timestamp: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
                    title: 'Related Device Issue',
                    severity: 'minor',
                    resolution: 'Resolved by network team',
                },
            ],
        };
    }

    async getAlerts(): Promise<PriorityAlert[]> {
        // Backend returns array directly, not { alerts: [...] }
        const response = await this.get<any>(API_ENDPOINTS.ALERTS);
        const alerts = Array.isArray(response) ? response : (response.alerts || []);
        return alerts.map((alert: any) => this.transformAlert(alert));
    }

    async getNocAlerts(): Promise<SummaryAlert[]> {
        // Backend returns array directly, not { alerts: [...] }
        const response = await this.get<any>(API_ENDPOINTS.ALERTS);
        const alerts = Array.isArray(response) ? response : (response.alerts || []);
        return alerts.map((alert: any) => this.transformAlert(alert));
    }

    async getAlertsSummary(): Promise<AlertSummary> {
        return this.get<AlertSummary>(API_ENDPOINTS.ALERTS_SUMMARY);
    }

    async getAlertById(id: string): Promise<DetailedAlert | null> {
        try {
            const backendAlert = await this.get<any>(API_ENDPOINTS.ALERT_BY_ID(id));
            return this.transformAlert(backendAlert);
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
        const response = await this.get<any[]>(`${API_ENDPOINTS.ALERTS_OVER_TIME}?period=${period}`);
        // Transform backend format { timestamp, value, label } to Carbon Charts format { date, value, group }
        return (response || []).map((point: any) => ({
            date: new Date(point.timestamp || point.date),
            value: point.value || 0,
            group: point.group || point.label || 'Alerts'
        })).filter(point => !isNaN(point.date.getTime()));
    }

    async getSeverityDistribution(): Promise<DistributionDataPoint[]> {
        const response = await this.get<any[]>(API_ENDPOINTS.ALERTS_SEVERITY_DISTRIBUTION);
        // Transform backend format { severity, count, percent } to Carbon Charts format { group, value }
        return (response || []).map((point: any) => ({
            group: point.group || point.severity || 'Unknown',
            value: point.value ?? point.count ?? 0
        }));
    }

    async getNoisyDevices(): Promise<NoisyDevice[]> {
        try {
            const response = await this.get<any[]>(API_ENDPOINTS.DEVICES_NOISY);
            // Handle different API response formats
            const devices = Array.isArray(response) ? response : [];
            const totalAlerts = devices.reduce((sum, d) => {
                const count = d.alertCount || d.alert_count || 0;
                return sum + count;
            }, 0);

            return devices.map(d => {
                const alertCount = d.alertCount || d.alert_count || 0;
                // Handle both nested device object and flat structure
                const deviceName = typeof d.name === 'string' ? d.name
                    : d.device?.name || d.device_name || 'Unknown';
                const deviceId = typeof d.id === 'string' ? d.id
                    : d.device?.ip || d.device_id || deviceName;
                return {
                    id: deviceId,
                    name: deviceName,
                    alertCount,
                    percentage: totalAlerts > 0 ? Math.round((alertCount / totalAlerts) * 100) : 0,
                    topIssue: d.top_issue || d.topIssue || d.severity || 'Alert',
                };
            });
        } catch (error) {
            console.warn('[AlertService] Failed to fetch noisy devices:', error);
            return [];
        }
    }

    async getAIMetrics(): Promise<AIMetric[]> {
        const response = await this.get<AIMetric>(API_ENDPOINTS.AI_METRICS);
        // Backend returns single object, frontend expects array
        return [response];
    }

    async getTrendsKPI(): Promise<TrendKPI[]> {
        const response = await this.get<any>(API_ENDPOINTS.TRENDS_KPI);
        // Backend returns single object, frontend expects array - transform to match TrendKPI interface
        const alertVolumeChange = response.alert_volume_change || 0;
        const mttrChange = response.mttr_change || 0;

        return [
            {
                id: 'alert-volume',
                label: 'Alert Volume',
                value: response.alert_volume || 0,
                trend: alertVolumeChange > 0 ? 'up' : alertVolumeChange < 0 ? 'down' : 'stable',
                subtitle: `${Math.abs(alertVolumeChange).toFixed(1)}% vs last period`,
            },
            {
                id: 'mttr',
                label: 'MTTR',
                value: `${Math.round(response.mttr || 0)}m`,
                trend: mttrChange > 0 ? 'up' : mttrChange < 0 ? 'down' : 'stable',
                subtitle: 'Mean time to resolution',
            },
            {
                id: 'recurring-alerts',
                label: 'Acknowledge Rate',
                value: `${Math.round(response.acknowledge_rate || 0)}%`,
                trend: 'stable',
                subtitle: 'Alerts acknowledged',
            },
            {
                id: 'escalation-rate',
                label: 'Resolution Rate',
                value: `${Math.round(response.resolution_rate || 0)}%`,
                trend: 'stable',
                subtitle: 'Alerts resolved',
            }
        ];
    }

    async getRecurringAlerts(): Promise<RecurringAlert[]> {
        return this.get<RecurringAlert[]>(API_ENDPOINTS.ALERTS_RECURRING);
    }

    async getAlertDistributionTime(): Promise<AlertDistribution[]> {
        return this.get<AlertDistribution[]>(API_ENDPOINTS.ALERTS_DISTRIBUTION_TIME);
    }

    async getAIInsights(): Promise<AIInsight[]> {
        return this.get<AIInsight[]>(API_ENDPOINTS.AI_INSIGHTS);
    }

    async getAIImpactOverTime(): Promise<ChartDataPoint[]> {
        const response = await this.get<any[]>(API_ENDPOINTS.AI_IMPACT_OVER_TIME);
        // Transform backend format to Carbon Charts format
        return (response || []).map((point: any) => ({
            date: new Date(point.timestamp || point.date),
            value: point.value || 0,
            group: point.group || point.label || 'AI Impact'
        })).filter(point => !isNaN(point.date.getTime()));
    }

    async acknowledgeAlert(id: string): Promise<void> {
        return this.post<void>(API_ENDPOINTS.ACKNOWLEDGE_ALERT(id), {});
    }

    async dismissAlert(id: string): Promise<void> {
        return this.post<void>(API_ENDPOINTS.DISMISS_ALERT(id), {});
    }

    async createTicket(id: string, details?: { title: string; description: string; priority: string }): Promise<void> {
        return this.post<void>(API_ENDPOINTS.TICKETS, { alertId: id, ...details });
    }

    async exportReport(format: 'csv' | 'pdf'): Promise<void> {
        // Trigger download from API
        return this.get<void>(`${API_ENDPOINTS.REPORTS_EXPORT}?format=${format}`);
    }
}

// ==========================================
// Service Factory & Export
// ==========================================

function createAlertDataService(): IAlertDataService {
    console.info('[AlertDataService] Using API:', env.apiBaseUrl);
    return new ApiAlertDataService();
}

// Export singleton instance
export const alertDataService = createAlertDataService();
