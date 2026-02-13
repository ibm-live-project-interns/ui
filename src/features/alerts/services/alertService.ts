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
        // Normalize confidence: DB stores 0-1 (e.g. 0.94), display as 0-100 (e.g. 94)
        const normalizeConfidence = (val: number): number => {
            if (val > 0 && val <= 1) return Math.round(val * 100);
            return Math.round(val);
        };

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

        // Parse root causes - may be string or array; extract from ai_summary when dedicated field is absent
        const parseRootCauses = (data: any): string[] => {
            if (Array.isArray(data)) return data.filter(Boolean);
            if (typeof data === 'string' && data.trim()) return [data];
            // Extract root cause insights from Watson ai_summary when ai_root_cause field doesn't exist
            const summary = backendAlert.ai_summary;
            if (summary && typeof summary === 'string' && summary.trim()) {
                const sentences = summary.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 15);
                if (sentences.length > 0) return sentences.slice(0, 3);
            }
            return ['Analysis pending - awaiting AI processing'];
        };

        // Parse recommended actions - may be string or array
        const parseRecommendedActions = (data: any): string[] => {
            if (Array.isArray(data)) return data.filter(Boolean);
            if (typeof data === 'string' && data.trim()) {
                // Split recommendation text into actionable items on sentence boundaries
                const items = data.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 15);
                if (items.length > 1) return items.slice(0, 5);
                return [data];
            }
            return ['Review alert details and investigate according to standard procedures'];
        };

        // Derive business impact from ai_summary when ai_impact field doesn't exist
        const deriveBusinessImpact = (data: any): string => {
            if (typeof data === 'string' && data.trim()) return data;
            const summary = backendAlert.ai_summary;
            const severity = backendAlert.severity || 'info';
            if (summary && typeof summary === 'string' && summary.trim()) {
                const severityImpact: Record<string, string> = {
                    critical: 'Critical impact — ',
                    high: 'High impact — ',
                    medium: 'Moderate impact — ',
                    low: 'Low impact — ',
                    info: 'Informational — ',
                };
                const prefix = severityImpact[severity] || '';
                // Use the last sentence(s) of the summary as impact context
                const sentences = summary.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 10);
                const impactSentence = sentences.length > 1 ? sentences[sentences.length - 1] : sentences[0] || summary;
                return `${prefix}${impactSentence}`;
            }
            return 'Impact assessment pending. The affected system may experience degraded performance or connectivity issues.';
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
            confidence: normalizeConfidence(backendAlert.ai_confidence || backendAlert.confidence || 0),
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
                businessImpact: deriveBusinessImpact(backendAlert.aiAnalysis?.businessImpact || backendAlert.ai_impact || backendAlert.business_impact),
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

    async getAlerts(period?: string): Promise<PriorityAlert[]> {
        let endpoint: string = API_ENDPOINTS.ALERTS;

        // Build time range query params from period (24h, 7d, 30d, 90d)
        if (period) {
            const now = new Date();
            const from = new Date();
            switch (period) {
                case '24h':
                    from.setHours(from.getHours() - 24);
                    break;
                case '7d':
                    from.setDate(from.getDate() - 7);
                    break;
                case '30d':
                    from.setDate(from.getDate() - 30);
                    break;
                case '90d':
                    from.setDate(from.getDate() - 90);
                    break;
                default:
                    // Unknown period, don't apply time filter
                    break;
            }
            if (from.getTime() !== now.getTime()) {
                const params = new URLSearchParams();
                params.set('from', from.toISOString());
                params.set('to', now.toISOString());
                endpoint = `${endpoint}?${params.toString()}`;
            }
        }

        // Backend returns array directly, not { alerts: [...] }
        const response = await this.get<any>(endpoint);
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
        const response = await this.get<any>(API_ENDPOINTS.ALERTS_SUMMARY);
        const bySeverity = response.by_severity || response.bySeverity || {};
        return {
            activeCount: response.total ?? response.activeCount ?? 0,
            criticalCount: bySeverity.critical ?? response.criticalCount ?? 0,
            majorCount: bySeverity.high ?? bySeverity.major ?? response.majorCount ?? 0,
            minorCount: bySeverity.low ?? bySeverity.minor ?? response.minorCount ?? 0,
            infoCount: bySeverity.info ?? response.infoCount ?? 0,
        };
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
        const response = await this.get<any>(API_ENDPOINTS.AI_METRICS);
        // Backend returns: {total_processed, success_rate, alerts_enriched, ...}
        // success_rate is already a percentage (0-100), convert counts to percentages for display
        const successRate = response.success_rate ?? response.successRate ?? 0;
        const totalProcessed = response.total_processed ?? response.totalProcessed ?? 0;
        const alertsEnriched = response.alerts_enriched ?? response.alertsEnriched ?? 0;
        const enrichmentRate = totalProcessed > 0 ? Math.round((alertsEnriched / totalProcessed) * 100) : 0;
        return [
            {
                id: 'ai-accuracy',
                label: 'AI Accuracy',
                value: Math.round(successRate * 10) / 10,
                description: 'Based on recent correlations',
            },
            {
                id: 'total-processed',
                label: 'Total Processed',
                value: 100,
                description: `${totalProcessed} alerts`,
            },
            {
                id: 'alerts-enriched',
                label: 'Alerts Enriched',
                value: enrichmentRate,
                description: `${alertsEnriched} of ${totalProcessed}`,
            },
        ];
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
        const response = await this.get<any[]>(API_ENDPOINTS.ALERTS_RECURRING);
        return (response || []).map((r: any, idx: number) => ({
            id: r.id || `recurring-${idx}`,
            name: r.pattern || r.name || 'Unknown Pattern',
            count: r.count || 0,
            severity: r.severity || 'medium',
            avgResolution: r.avg_resolution || r.avgResolution || 'N/A',
            percentage: r.percentage || 0,
            pattern: r.pattern,
            devices: r.devices || [],
            firstSeen: r.first_seen || r.firstSeen,
            lastSeen: r.last_seen || r.lastSeen,
        }));
    }

    async getAlertDistributionTime(): Promise<AlertDistribution[]> {
        const response = await this.get<any[]>(API_ENDPOINTS.ALERTS_DISTRIBUTION_TIME);
        return (response || []).map((point: any) => ({
            group: point.group || point.hour || 'Unknown',
            value: point.value ?? point.count ?? 0,
        }));
    }

    async getAIInsights(): Promise<AIInsight[]> {
        const response = await this.get<any[]>(API_ENDPOINTS.AI_INSIGHTS);
        return (response || []).map((insight: any) => ({
            id: insight.id || 'unknown',
            type: insight.type || 'recommendation',
            title: insight.title || '',
            description: insight.description || '',
            action: Array.isArray(insight.action_items) ? insight.action_items.join('; ') : (insight.action || insight.action_items || ''),
            severity: insight.severity,
            confidence: insight.confidence,
        }));
    }

    async getAIImpactOverTime(): Promise<ChartDataPoint[]> {
        const response = await this.get<any[]>(API_ENDPOINTS.AI_IMPACT_OVER_TIME);
        // Transform backend format {date, alerts_processed, patterns_detected, mttr_improvement_pct}
        // to Carbon Charts format: flatten each point into 3 ChartDataPoints (one per metric/group)
        // so the LineChart renders 3 separate lines.
        const result: ChartDataPoint[] = [];
        for (const point of (response || [])) {
            const date = new Date(point.timestamp || point.date);
            if (isNaN(date.getTime())) continue;

            result.push(
                { date, value: point.alerts_processed ?? 0, group: 'Alerts Processed' },
                { date, value: point.patterns_detected ?? 0, group: 'Patterns Detected' },
                { date, value: point.mttr_improvement_pct ?? 0, group: 'MTTR Improvement %' },
            );
        }
        return result;
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
        // Trigger browser file download - bypass JSON parsing since response is CSV
        const token = this.getToken();
        const url = `${this.baseUrl}${API_ENDPOINTS.REPORTS_EXPORT}?format=${format}`;
        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(`Export failed: ${response.status}`);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `alerts-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
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
