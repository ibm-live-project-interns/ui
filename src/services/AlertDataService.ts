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

import { env, API_ENDPOINTS, buildApiUrl } from '@/config';
import { HttpService } from './HttpService';
import type {
    PriorityAlert,
    DetailedAlert,
    SummaryAlert,
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
    getActiveAlertCount as getMockActiveAlertCount,
    getAlertCountBySeverity as getMockAlertCountBySeverity,
} from '@/__mocks__/alerts.mock';

// ==========================================
// Service Interface
// ==========================================

export interface IAlertDataService {
    // Alert queries
    getAlerts(): Promise<PriorityAlert[]>;
    getNocAlerts(): Promise<SummaryAlert[]>;
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
}

// ==========================================
// API Implementation
// ==========================================

class ApiAlertDataService extends HttpService implements IAlertDataService {
    constructor() {
        super(buildApiUrl(''));
    }

    async getAlerts(): Promise<PriorityAlert[]> {
        return this.get<PriorityAlert[]>(API_ENDPOINTS.ALERTS);
    }

    async getNocAlerts(): Promise<SummaryAlert[]> {
        return this.get<SummaryAlert[]>(API_ENDPOINTS.ALERTS_SUMMARY);
    }

    async getAlertById(id: string): Promise<DetailedAlert | null> {
        try {
            return await this.get<DetailedAlert>(API_ENDPOINTS.ALERT_BY_ID(id));
        } catch {
            return null;
        }
    }

    async getActiveAlertCount(): Promise<number> {
        const summary = await this.get<{ activeCount: number }>(API_ENDPOINTS.ALERTS_SUMMARY);
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
