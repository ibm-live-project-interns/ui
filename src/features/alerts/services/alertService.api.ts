/**
 * Alert Data Service - API Implementation
 *
 * Real backend API client for all alert-related operations.
 * Extends HttpService for authenticated HTTP requests.
 */

import { env, API_ENDPOINTS } from '@/shared/config';
import { HttpService } from '@/shared/api';
import { alertLogger } from '@/shared/utils/logger';
import type { DeviceIcon, Severity } from '@/shared/types';
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
import type { TrendKPI, RecurringAlert, AIInsight } from '@/shared/types';
import type {
    IAlertDataService,
    AlertDistribution,
    LinkedTicket,
    SuggestedRunbook,
    PostMortem,
    CreatePostMortemRequest,
    BulkActionType,
    BulkActionResult,
    OnCallScheduleEntry,
    BackendAlert,
    BackendAlertSummary,
    BackendTimeSeriesPoint,
    BackendSeverityPoint,
    BackendNoisyDevice,
    BackendAIMetrics,
    BackendTrendsKPI,
    BackendRecurringAlert,
    BackendAIInsight,
    BackendDistributionTimePoint,
    BackendAIImpactPoint,
    BackendOnCallEntry,
    BackendSuggestedRunbooksResponse,
} from './alertService.types';

export class ApiAlertDataService extends HttpService implements IAlertDataService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
    }

    // Helper to transform backend alert to frontend format
    private transformAlert(backendAlert: BackendAlert): DetailedAlert {
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
        const parseRootCauses = (data: unknown): string[] => {
            if (Array.isArray(data)) return data.map(String).filter(Boolean);
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
        const parseRecommendedActions = (data: unknown): string[] => {
            if (Array.isArray(data)) return data.map(String).filter(Boolean);
            if (typeof data === 'string' && data.trim()) {
                // Split recommendation text into actionable items on sentence boundaries
                const items = data.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 15);
                if (items.length > 1) return items.slice(0, 5);
                return [data];
            }
            return ['Review alert details and investigate according to standard procedures'];
        };

        // Derive business impact from ai_summary when ai_impact field doesn't exist
        const deriveBusinessImpact = (data: unknown): string => {
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
        let deviceIcon: string = 'server';

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
            severity: (backendAlert.severity || 'info') as Severity,
            status: (backendAlert.status || 'open') as DetailedAlert['status'],
            category: backendAlert.category || undefined,
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
                icon: deviceIcon as DeviceIcon,
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
                icon: deviceIcon as DeviceIcon,
                vendor: deviceVendor,
                model: deviceModel,
                interface: backendAlert.interface_name || 'Unknown',
                interfaceAlias: backendAlert.interface_alias || 'Unknown',
            },
            similarEvents: backendAlert.similar_count || backendAlert.similar_events || (() => {
                // Deterministic fallback based on severity instead of Math.random()
                const severityFallback: Record<string, number> = { critical: 5, high: 3, medium: 2, low: 1, info: 0 };
                return severityFallback[backendAlert.severity || 'info'] ?? 0;
            })(),
            history: (backendAlert.history || []).map(h => ({
                ...h,
                severity: h.severity as Severity,
            })),
        };
    }

    async getAlerts(period?: string): Promise<PriorityAlert[]> {
        let endpoint: string = API_ENDPOINTS.ALERTS;

        // Build time range query params from period (24h, 7d, 30d, 90d)
        // Only apply filter for known period values (not 'all' or unknown)
        const KNOWN_PERIODS = ['24h', '7d', '30d', '90d'] as const;
        if (period && (KNOWN_PERIODS as readonly string[]).includes(period)) {
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
            }
            const params = new URLSearchParams();
            params.set('from', from.toISOString());
            params.set('to', now.toISOString());
            endpoint = `${endpoint}?${params.toString()}`;
        }

        // Backend returns array directly, not { alerts: [...] }
        const response = await this.get<BackendAlert[] | { alerts: BackendAlert[] }>(endpoint);
        const alerts: BackendAlert[] = Array.isArray(response) ? response : ((response as { alerts: BackendAlert[] }).alerts || []);
        return alerts.map((alert) => this.transformAlert(alert));
    }

    async getNocAlerts(): Promise<SummaryAlert[]> {
        // Backend returns array directly, not { alerts: [...] }
        const response = await this.get<BackendAlert[] | { alerts: BackendAlert[] }>(API_ENDPOINTS.ALERTS);
        const alerts: BackendAlert[] = Array.isArray(response) ? response : ((response as { alerts: BackendAlert[] }).alerts || []);
        return alerts.map((alert) => this.transformAlert(alert));
    }

    async getAlertsSummary(): Promise<AlertSummary> {
        const response = await this.get<BackendAlertSummary>(API_ENDPOINTS.ALERTS_SUMMARY);
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
            const backendAlert = await this.get<BackendAlert>(API_ENDPOINTS.ALERT_BY_ID(id));
            return this.transformAlert(backendAlert);
        } catch (error) {
            // 404 means the alert does not exist -- return null
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            // Auth and server errors must propagate so the UI shows an error state
            alertLogger.warn('Failed to fetch alert by ID', { id, error });
            throw error;
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
        const response = await this.get<BackendTimeSeriesPoint[]>(`${API_ENDPOINTS.ALERTS_OVER_TIME}?period=${period}`);
        // Transform backend format { timestamp, value, label } to Carbon Charts format { date, value, group }
        // Note: backend "label" is a time label (e.g. "10:00"), NOT a series group name.
        // For StackedAreaChart, "group" must be a constant series name so all points
        // belong to the same series, otherwise each point becomes its own layer.
        return (response || []).map((point: BackendTimeSeriesPoint) => ({
            date: new Date(point.timestamp || point.date || ''),
            value: point.value ?? 0,
            group: point.group || 'Alerts'
        })).filter((point: ChartDataPoint) => !isNaN(new Date(point.date).getTime()));
    }

    async getSeverityDistribution(): Promise<DistributionDataPoint[]> {
        const response = await this.get<BackendSeverityPoint[]>(API_ENDPOINTS.ALERTS_SEVERITY_DISTRIBUTION);
        // Transform backend format { severity, count, percent } to Carbon Charts format { group, value }
        return (response || []).map((point: BackendSeverityPoint) => ({
            group: point.group || point.severity || 'Unknown',
            value: point.value ?? point.count ?? 0
        }));
    }

    async getNoisyDevices(): Promise<NoisyDevice[]> {
        try {
            const response = await this.get<BackendNoisyDevice[]>(API_ENDPOINTS.DEVICES_NOISY);
            // Handle different API response formats
            const devices: BackendNoisyDevice[] = Array.isArray(response) ? response : [];
            const totalAlerts = devices.reduce((sum, d) => {
                const count = d.alertCount || d.alert_count || 0;
                return sum + count;
            }, 0);

            return devices.map((d: BackendNoisyDevice) => {
                const alertCount = d.alertCount || d.alert_count || 0;
                // Handle both nested device object and flat structure
                const deviceName = typeof d.name === 'string' ? d.name
                    : d.device?.name || d.device_name || 'Unknown';
                const deviceId = typeof d.id === 'string' ? d.id
                    : d.device?.ip || d.device_id || deviceName;
                return {
                    id: deviceId || '',
                    name: deviceName,
                    alertCount,
                    percentage: totalAlerts > 0 ? Math.round((alertCount / totalAlerts) * 100) : 0,
                    topIssue: d.top_issue || d.topIssue || d.severity || 'Alert',
                };
            });
        } catch (error) {
            alertLogger.warn('Failed to fetch noisy devices', error);
            return [];
        }
    }

    async getAIMetrics(): Promise<AIMetric[]> {
        const response = await this.get<BackendAIMetrics>(API_ENDPOINTS.AI_METRICS);
        // Backend returns: {total_processed, success_rate, alerts_enriched, ...}
        const successRate = response?.success_rate ?? response?.successRate ?? 0;
        const totalProcessed = response?.total_processed ?? response?.totalProcessed ?? 0;
        const alertsEnriched = response?.alerts_enriched ?? response?.alertsEnriched ?? 0;
        const enrichmentRate = totalProcessed > 0 ? Math.round((alertsEnriched / totalProcessed) * 100) : 0;

        // Ensure values are always numbers, never undefined
        const accuracyValue = typeof successRate === 'number' ? Math.round(successRate * 10) / 10 : 0;
        const processedValue = typeof totalProcessed === 'number' ? totalProcessed : 0;
        const enrichedValue = typeof enrichmentRate === 'number' ? enrichmentRate : 0;

        return [
            {
                id: 'ai-accuracy',
                label: 'AI Accuracy',
                value: accuracyValue,
                description: 'Based on recent correlations',
            },
            {
                id: 'total-processed',
                label: 'Total Processed',
                value: processedValue,
                description: `${processedValue} alerts`,
            },
            {
                id: 'alerts-enriched',
                label: 'Alerts Enriched',
                value: enrichedValue,
                description: `${alertsEnriched} of ${processedValue}`,
            },
        ];
    }

    async getTrendsKPI(): Promise<TrendKPI[]> {
        const response = await this.get<BackendTrendsKPI>(API_ENDPOINTS.TRENDS_KPI);
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
        const response = await this.get<BackendRecurringAlert[]>(API_ENDPOINTS.ALERTS_RECURRING);
        return (response || []).map((r: BackendRecurringAlert, idx: number) => ({
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
        const response = await this.get<BackendDistributionTimePoint[]>(API_ENDPOINTS.ALERTS_DISTRIBUTION_TIME);
        return (response || []).map((point: BackendDistributionTimePoint) => ({
            group: point.group || point.hour || 'Unknown',
            value: point.value ?? point.count ?? 0,
        }));
    }

    async getAIInsights(): Promise<AIInsight[]> {
        const response = await this.get<BackendAIInsight[]>(API_ENDPOINTS.AI_INSIGHTS);
        return (response || []).map((insight: BackendAIInsight) => ({
            id: insight.id || 'unknown',
            type: (insight.type || 'recommendation') as AIInsight['type'],
            title: insight.title || '',
            description: insight.description || '',
            action: Array.isArray(insight.action_items) ? insight.action_items.join('; ') : (insight.action || (typeof insight.action_items === 'string' ? insight.action_items : '') || ''),
            severity: insight.severity as AIInsight['severity'],
            confidence: insight.confidence,
        }));
    }

    async getAIImpactOverTime(): Promise<ChartDataPoint[]> {
        const response = await this.get<BackendAIImpactPoint[]>(API_ENDPOINTS.AI_IMPACT_OVER_TIME);
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
        return this.post<void>(API_ENDPOINTS.TICKETS, { alert_id: id, ...details });
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
        a.download = `alerts-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    }

    // ==========================================
    // Enrichment Methods
    // ==========================================

    async reanalyzeAlert(id: string): Promise<void> {
        return this.post<void>(API_ENDPOINTS.REANALYZE_ALERT(id), {});
    }

    async getAlertTickets(id: string): Promise<LinkedTicket[]> {
        const response = await this.get<LinkedTicket[] | { tickets: LinkedTicket[] }>(API_ENDPOINTS.ALERTS_TICKETS(id));
        return Array.isArray(response) ? response : (response?.tickets || []);
    }

    async getSuggestedRunbooks(category: string, severity: string, query?: string): Promise<SuggestedRunbook[]> {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (severity) params.set('severity', severity);
        if (query) params.set('query', query);
        const endpoint = `${API_ENDPOINTS.RUNBOOKS_SUGGEST}?${params.toString()}`;
        const response = await this.get<SuggestedRunbook[] | BackendSuggestedRunbooksResponse>(endpoint);
        if (Array.isArray(response)) return response;
        // Backend wraps results in { suggestions: [...] }
        return (response as BackendSuggestedRunbooksResponse)?.suggestions || (response as BackendSuggestedRunbooksResponse)?.runbooks || [];
    }

    async getAlertPostMortem(id: string): Promise<PostMortem | null> {
        try {
            const response = await this.get<PostMortem | { post_mortem: PostMortem }>(API_ENDPOINTS.ALERTS_POST_MORTEM(id));
            if (!response) return null;
            return 'post_mortem' in response ? response.post_mortem : response;
        } catch (error) {
            // 404 means no post-mortem exists yet -- return null
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            // Auth and server errors must propagate so the UI shows an error state
            alertLogger.warn('Failed to fetch post-mortem for alert', { id, error });
            throw error;
        }
    }

    async createAlertPostMortem(id: string, data: CreatePostMortemRequest): Promise<PostMortem> {
        return this.post<PostMortem>(API_ENDPOINTS.ALERTS_POST_MORTEM(id), data);
    }

    async bulkAction(action: BulkActionType, alertIds: string[]): Promise<BulkActionResult> {
        return this.post<BulkActionResult>(API_ENDPOINTS.ALERTS_BULK_ACTION, {
            action,
            alert_ids: alertIds,
        });
    }

    async getOnCallSchedules(): Promise<OnCallScheduleEntry[]> {
        const response = await this.get<BackendOnCallEntry[] | { schedules: BackendOnCallEntry[] }>(API_ENDPOINTS.ON_CALL_SCHEDULES);
        const raw: BackendOnCallEntry[] = Array.isArray(response) ? response : (response?.schedules || []);
        return raw.map((s: BackendOnCallEntry) => ({
            id: String(s.id),
            name: s.name || s.username || 'Unknown',
            role: s.role || (s.is_primary ? 'Primary On-Call' : 'Secondary On-Call'),
            rotation_type: s.rotation_type || 'weekly',
            start_time: s.start_time || '',
            end_time: s.end_time || '',
            contact: s.contact || s.email || s.phone || undefined,
        }));
    }
}
