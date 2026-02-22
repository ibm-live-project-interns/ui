/**
 * Copyright IBM Corp. 2026
 *
 * useTrends - Custom hook encapsulating all state, data fetching,
 * theme detection, chart data computation, and event handlers
 * for the Trends & Insights page.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowDown,
    Time,
    Repeat,
    ArrowUp,
} from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';

import type { KPICardProps } from '@/components/ui';
import type { NoisyDeviceItem } from '@/components/ui';
import { alertDataService } from '@/shared/services';
import type {
    TrendKPI,
    RecurringAlert,
    AlertDistribution as AlertDistributionData,
    AIInsight,
} from '@/features/alerts/services/alertService';
import { TIME_PERIOD_OPTIONS } from '@/shared/constants/severity';
import type { Severity } from '@/shared/types/common.types';
import type { ChartDataPoint, NoisyDevice } from '@/shared/types/api.types';
import type { AIMetric } from '@/features/alerts/types';
import type { DeviceIcon } from '@/shared/types/common.types';
import { useToast } from '@/contexts';
import { useFetchData, useThemeDetection } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';

// ==========================================
// Types
// ==========================================

/**
 * Extended noisy device shape - covers both the normalized NoisyDevice format
 * and potential raw API variants with nested device objects.
 */
interface NoisyDeviceWithExtras extends NoisyDevice {
    device_name?: string;
    ip?: string;
    icon?: string;
    model?: string;
    device?: {
        name?: string;
        ip?: string;
        icon?: string;
        model?: string;
    };
    alert_count?: number;
    severity?: string;
}

// KPI Icon mapping
const KPI_ICON_MAP: Record<string, CarbonIconType> = {
    'alert-volume': ArrowDown,
    'mttr': Time,
    'recurring-alerts': Repeat,
    'escalation-rate': ArrowUp,
};

// KPI Severity mapping
const KPI_SEVERITY_MAP: Record<string, 'critical' | 'major' | 'minor' | 'info' | 'success' | 'neutral'> = {
    'alert-volume': 'info',
    'mttr': 'success',
    'recurring-alerts': 'info',
    'escalation-rate': 'info',
};

// Composite type for the aggregated trends fetch
interface TrendsFetchResult {
    kpis: TrendKPI[];
    overTime: ChartDataPoint[];
    recurring: RecurringAlert[];
    distribution: AlertDistributionData[];
    metrics: AIMetric[];
    devices: NoisyDeviceItem[];
    insights: AIInsight[];
    aiOverTime: ChartDataPoint[];
}

// ==========================================
// Return type
// ==========================================

export interface UseTrendsReturn {
    // State
    isLoading: boolean;
    selectedTimePeriod: typeof TIME_PERIOD_OPTIONS[number];
    setSelectedTimePeriod: (period: typeof TIME_PERIOD_OPTIONS[number]) => void;
    currentTheme: string;
    lastFetchTime: Date | null;

    // Data
    kpiCards: KPICardProps[];
    alertsOverTime: ChartDataPoint[];
    recurringAlerts: RecurringAlert[];
    detailsDistribution: AlertDistributionData[];
    aiMetrics: AIMetric[];
    noisyDevices: NoisyDeviceItem[];
    aiInsights: AIInsight[];
    aiImpactOverTime: ChartDataPoint[];

    // Derived
    systemStatus: { text: string; color: string };
    isEmptyPage: boolean;

    // Actions
    handleInsightAction: (insight: AIInsight) => void;
    handleExportReport: () => void;
    navigateToDevices: () => void;
}

// ==========================================
// Hook
// ==========================================

export function useTrends(): UseTrendsReturn {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIOD_OPTIONS[2]);
    const currentTheme = useThemeDetection();
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

    // Handle AI insight actions
    const handleInsightAction = useCallback((insight: AIInsight) => {
        switch (insight.type) {
            case 'pattern':
                navigate('/priority-alerts');
                addToast('info', 'Pattern Analysis', 'Navigating to alerts matching this pattern');
                break;
            case 'optimization':
                navigate('/settings');
                addToast('success', 'Optimization Applied', insight.description);
                break;
            case 'recommendation':
                addToast('success', 'Recommendation Noted', `Action: ${insight.action}`);
                break;
            default:
                addToast('info', 'Action Triggered', insight.action || 'Action triggered');
        }
    }, [navigate, addToast]);

    const handleExportReport = useCallback(() => {
        addToast('info', 'Coming soon', 'PDF export is not yet implemented. CSV export is available from the Reports Hub.');
    }, [addToast]);

    const navigateToDevices = useCallback(() => {
        navigate('/devices');
    }, [navigate]);

    // Fetch all trends data via useFetchData
    const { data: trendsData, isLoading, refetch } = useFetchData<TrendsFetchResult>(
        async (_signal) => {
            const timePeriod = selectedTimePeriod.id as '24h' | '7d' | '30d' | '90d';
            const [
                kpis,
                overTime,
                recurring,
                distribution,
                metrics,
                rawDevices,
                insights,
                aiOverTime
            ] = await Promise.all([
                alertDataService.getTrendsKPI(),
                alertDataService.getAlertsOverTime(timePeriod),
                alertDataService.getRecurringAlerts(),
                alertDataService.getAlertDistributionTime(),
                alertDataService.getAIMetrics(),
                alertDataService.getNoisyDevices(),
                alertDataService.getAIInsights(),
                alertDataService.getAIImpactOverTime()
            ]);

            // Transform noisy devices to NoisyDeviceItem format
            const devices: NoisyDeviceItem[] = ((rawDevices || []) as NoisyDeviceWithExtras[]).map((d: NoisyDeviceWithExtras) => {
                const deviceName = typeof d.name === 'string' ? d.name
                    : d.device?.name || d.device_name || 'Unknown Device';
                const deviceIp = typeof d.ip === 'string' ? d.ip
                    : d.device?.ip || '';
                const deviceIcon = (typeof d.icon === 'string' ? d.icon
                    : d.device?.icon || 'server') as DeviceIcon;
                const deviceModel = typeof d.model === 'string' ? d.model
                    : d.device?.model || '';

                return {
                    device: {
                        name: deviceName,
                        ip: deviceIp,
                        icon: deviceIcon,
                        model: deviceModel,
                    },
                    alertCount: d.alertCount || d.alert_count || 0,
                    severity: (d.severity || 'minor') as Severity
                };
            });

            return {
                kpis: kpis || [],
                overTime: overTime || [],
                recurring: recurring || [],
                distribution: distribution || [],
                metrics: metrics || [],
                devices,
                insights: insights || [],
                aiOverTime: aiOverTime || [],
            };
        },
        [selectedTimePeriod],
        {
            onError: (err) => {
                logger.error('Failed to fetch trends data', err);
            },
        }
    );

    // Destructure trends data with safe defaults
    const trendsKPI = trendsData?.kpis ?? [];
    const alertsOverTime = trendsData?.overTime ?? [];
    const recurringAlerts = trendsData?.recurring ?? [];
    const detailsDistribution = trendsData?.distribution ?? [];
    const aiMetrics = trendsData?.metrics ?? [];
    const noisyDevices = trendsData?.devices ?? [];
    const aiInsights = trendsData?.insights ?? [];
    const aiImpactOverTime = trendsData?.aiOverTime ?? [];

    // Update lastFetchTime whenever data changes
    useEffect(() => {
        if (trendsData) {
            setLastFetchTime(new Date());
        }
    }, [trendsData]);

    // Auto-refresh interval using refetch
    useEffect(() => {
        const autoRefreshSetting = localStorage.getItem('settings_autoRefresh');
        const autoRefreshEnabled = autoRefreshSetting !== 'false';
        let interval: ReturnType<typeof setInterval> | null = null;
        if (autoRefreshEnabled) {
            const refreshMs = parseInt(localStorage.getItem('settings_refreshInterval') || '60', 10) * 1000;
            interval = setInterval(refetch, refreshMs > 0 ? refreshMs : 60000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [refetch]);

    // Transform API data to KPICardProps format
    const kpiCards: KPICardProps[] = useMemo(() => {
        if (!trendsKPI || trendsKPI.length === 0) return [];
        return trendsKPI.map((kpi) => {
            const trendObj = kpi.trend ? {
                direction: (kpi.trend === 'stable' ? 'stable' : kpi.trend) as 'up' | 'down' | 'stable',
                value: kpi.trend === 'up' ? '\u2191' : kpi.trend === 'down' ? '\u2193' : '\u2014',
                isPositive: kpi.trend === 'down',
            } : undefined;

            return {
                id: kpi.id,
                label: kpi.label,
                value: kpi.value,
                subtitle: kpi.subtitle || 'Compared to last period',
                icon: KPI_ICON_MAP[kpi.id] || KPI_ICON_MAP['alert-volume'],
                iconColor: '#0f62fe',
                severity: KPI_SEVERITY_MAP[kpi.id] || 'info',
                trend: trendObj,
            };
        });
    }, [trendsKPI]);

    // Derive system status from actual alert data
    const systemStatus = useMemo(() => {
        const alertVolumeKpi = trendsKPI.find(k => k.id === 'alert-volume');
        const alertVolume = alertVolumeKpi ? parseInt(String(alertVolumeKpi.value), 10) : 0;
        if (alertVolume > 200) return { text: 'Degraded', color: '#da1e28' };
        if (alertVolume > 50) return { text: 'Under Pressure', color: '#ff832b' };
        if (trendsKPI.length === 0 && !isLoading) return { text: 'No Data', color: '#525252' };
        return { text: 'Operational', color: '#24a148' };
    }, [trendsKPI, isLoading]);

    // Empty state
    const isEmptyPage = trendsKPI.length === 0 && alertsOverTime.length === 0 && recurringAlerts.length === 0;

    return {
        isLoading,
        selectedTimePeriod,
        setSelectedTimePeriod,
        currentTheme,
        lastFetchTime,
        kpiCards,
        alertsOverTime,
        recurringAlerts,
        detailsDistribution,
        aiMetrics,
        noisyDevices,
        aiInsights,
        aiImpactOverTime,
        systemStatus,
        isEmptyPage,
        handleInsightAction,
        handleExportReport,
        navigateToDevices,
    };
}
