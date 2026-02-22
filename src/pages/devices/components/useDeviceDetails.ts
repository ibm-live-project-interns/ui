/**
 * Copyright IBM Corp. 2026
 *
 * useDeviceDetails - Custom hook encapsulating all state, data fetching,
 * metrics loading, incidents, and action handlers for the Device Details page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceService, alertDataService } from '@/shared/services';
import { useThemeDetection, useFetchData } from '@/shared/hooks';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';
import type { DeviceDetails } from '@/shared/services';

import type { MetricDataPoint, MetricsPeriod, MetricsAPIResponse, Incident } from './deviceDetails.types';
import { buildMetricsUrl } from './deviceDetails.types';

// ==========================================
// Return type
// ==========================================

export interface UseDeviceDetailsReturn {
    // Params
    deviceId: string | undefined;
    theme: string;

    // Data
    device: DeviceDetails | null;
    metricHistory: MetricDataPoint[];
    incidents: Incident[];

    // Loading / error
    isLoading: boolean;
    metricsLoading: boolean;
    error: string | null;

    // Metrics period
    metricsPeriod: MetricsPeriod;
    handlePeriodChange: (period: MetricsPeriod) => void;

    // Actions
    handleRefresh: () => void;
    navigateBack: () => void;
    navigateToSettings: () => void;
    navigateToAlert: (alertId: string) => void;
    navigateToTicket: (ticketId: string) => void;
    navigateToDeviceAlerts: (deviceName: string) => void;
}

// ==========================================
// Hook
// ==========================================

export function useDeviceDetails(): UseDeviceDetailsReturn {
    const { deviceId } = useParams<{ deviceId: string }>();
    const navigate = useNavigate();
    const theme = useThemeDetection();
    const { addToast } = useToast();

    const [metricHistory, setMetricHistory] = useState<MetricDataPoint[]>([]);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>('24h');

    // Ref to avoid stale closure in the fetcher
    const metricsPeriodRef = useRef<MetricsPeriod>(metricsPeriod);
    metricsPeriodRef.current = metricsPeriod;

    // Fetch metrics from the backend endpoint (kept separate since it can be
    // triggered independently by the period selector)
    const fetchMetrics = useCallback(async (id: string, period: MetricsPeriod, signal?: AbortSignal) => {
        setMetricsLoading(true);
        try {
            const token = localStorage.getItem('noc_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(buildMetricsUrl(id, period), { headers, signal });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data: MetricsAPIResponse = await response.json();
            if (!data.metrics || data.metrics.length === 0) {
                setMetricHistory([]);
                return;
            }

            // Transform API response into chart-compatible MetricDataPoint array.
            const points: MetricDataPoint[] = [];
            for (const m of data.metrics) {
                const date = new Date(m.timestamp);
                points.push(
                    { group: 'CPU', date, value: m.cpu_usage },
                    { group: 'Memory', date, value: m.memory_usage },
                );
            }
            setMetricHistory(points);
        } catch (err) {
            // Silently ignore aborted requests
            if (err instanceof DOMException && err.name === 'AbortError') return;
            logger.warn('Failed to fetch device metrics, chart will show empty state', err);
            setMetricHistory([]);
        } finally {
            setMetricsLoading(false);
        }
    }, []);

    // Primary data fetch: device details + incidents + metrics
    const { data: deviceResult, isLoading, error, refetch } = useFetchData(
        async (signal) => {
            if (!deviceId) return null;

            // Fetch device details from API
            const deviceData = await deviceService.getDeviceById(deviceId);
            if (signal.aborted) return null;

            // Fetch alerts and filter for this device
            let incidentData: Incident[] = [];
            try {
                const alerts = await alertDataService.getAlerts();
                if (!signal.aborted) {
                    const deviceAlerts = alerts.filter(alert =>
                        alert.device?.name === deviceData.name ||
                        alert.device?.ip === deviceData.ip
                    );
                    incidentData = deviceAlerts.slice(0, 10).map(alert => ({
                        id: alert.id,
                        time: alert.timestamp?.relative || alert.timestamp?.absolute || 'Unknown',
                        severity: alert.severity as Incident['severity'],
                        description: alert.aiSummary || alert.aiTitle || 'Alert detected',
                        category: alert.device?.name || 'General',
                        ticketId: undefined,
                    }));
                }
            } catch (alertErr) {
                if (!signal.aborted) {
                    logger.warn('Failed to fetch alerts for device incidents table', alertErr);
                }
            }

            // Fetch metrics from backend using the current period ref
            if (!signal.aborted) {
                await fetchMetrics(deviceId, metricsPeriodRef.current, signal);
            }

            return { device: deviceData, incidents: incidentData };
        },
        [deviceId],
        {
            onError: (err) => logger.error('Failed to fetch device', err),
        }
    );

    const device = deviceResult?.device ?? null;
    const incidents = deviceResult?.incidents ?? [];

    // 30-second auto-refresh
    useEffect(() => {
        const interval = setInterval(refetch, 30000);
        return () => clearInterval(interval);
    }, [refetch]);

    // When the user changes the period selector, re-fetch only metrics
    const handlePeriodChange = useCallback((period: MetricsPeriod) => {
        setMetricsPeriod(period);
        if (deviceId) {
            fetchMetrics(deviceId, period);
        }
    }, [deviceId, fetchMetrics]);

    // Manual refresh handler with toast feedback
    const handleRefresh = useCallback(() => {
        refetch();
        addToast('success', 'Refreshed', 'Device data has been refreshed');
    }, [refetch, addToast]);

    // Navigation helpers
    const navigateBack = useCallback(() => navigate('/devices'), [navigate]);
    const navigateToSettings = useCallback(() => navigate('/settings'), [navigate]);
    const navigateToAlert = useCallback((alertId: string) => navigate(`/alerts/${alertId}`), [navigate]);
    const navigateToTicket = useCallback((ticketId: string) => navigate(`/tickets/${ticketId}`), [navigate]);
    const navigateToDeviceAlerts = useCallback((deviceName: string) =>
        navigate(`/priority-alerts?device=${encodeURIComponent(deviceName)}`),
    [navigate]);

    return {
        deviceId,
        theme,
        device,
        metricHistory,
        incidents,
        isLoading,
        metricsLoading,
        error,
        metricsPeriod,
        handlePeriodChange,
        handleRefresh,
        navigateBack,
        navigateToSettings,
        navigateToAlert,
        navigateToTicket,
        navigateToDeviceAlerts,
    };
}
