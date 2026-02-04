/**
 * Alert Types
 *
 * Type definitions specific to alerts feature.
 */

import type {
    Severity,
    AlertStatus,
    DeviceInfo,
    ExtendedDeviceInfo,
    TimestampInfo,
    ChartDataPoint,
    DistributionDataPoint,
    NoisyDevice,
    TimePeriod,
    AIMetric,
} from '@/shared/types';

// Re-export common types for convenience
export type {
    Severity,
    AlertStatus,
    DeviceInfo,
    ExtendedDeviceInfo,
    TimestampInfo,
    ChartDataPoint,
    DistributionDataPoint,
    NoisyDevice,
    TimePeriod,
    AIMetric,
};

// ==========================================
// Alert Interfaces
// ==========================================

export interface BaseAlert {
    id: string;
    severity: Severity;
    status: AlertStatus;
    timestamp: TimestampInfo;
    device: DeviceInfo;
}

export interface SummaryAlert extends BaseAlert {
    aiSummary: string;
}

export interface PriorityAlert extends SummaryAlert {
    aiTitle: string;
    confidence: number;
}

export interface HistoricalAlert {
    id: string;
    timestamp: string;
    title: string;
    resolution: string;
    severity: Severity;
}

export interface DetailedAlert extends PriorityAlert {
    similarEvents: number;
    aiAnalysis: {
        summary: string;
        rootCauses: string[];
        businessImpact: string;
        recommendedActions: string[];
    };
    rawData: string;
    extendedDevice: ExtendedDeviceInfo;
    history: HistoricalAlert[];
}

export interface AlertSummary {
    activeCount: number;
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    infoCount: number;
}
