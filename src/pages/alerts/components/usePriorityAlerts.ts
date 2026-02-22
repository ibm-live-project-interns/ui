/**
 * Copyright IBM Corp. 2026
 *
 * usePriorityAlerts - Custom hook encapsulating all state, data fetching,
 * filtering, pagination, bulk actions, and event handlers for the
 * Priority Alerts page.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logger } from '@/shared/utils/logger';
import { SEVERITY_FILTER_OPTIONS, TIME_PERIOD_OPTIONS } from '@/shared/constants/severity';
import { STATUS_FILTER_OPTIONS } from '@/shared/constants/status';
import type { PriorityAlert } from '@/features/alerts/types/alert.types';
import { alertDataService } from '@/shared/services';
import type { BulkActionType } from '@/features/alerts/services/alertService';
import { normalizeAlert } from '@/shared/utils/normalizeAlert';
import { API_BASE_URL } from '@/shared/config/api.config';
import type { KPICardProps } from '@/components/ui/KPICard';
import type { DropdownFilterConfig } from '@/components/ui/FilterBar';
import { useToast } from '@/contexts';
import { useFetchData } from '@/shared/hooks';

import {
    generateKPIData,
    renderTimestampValue,
    QUICK_FILTERS,
    MAX_BULK_ALERTS,
} from './types';

// ==========================================
// Return type
// ==========================================

export interface UsePriorityAlertsReturn {
    // Data
    alerts: PriorityAlert[];
    isLoading: boolean;
    isBulkActing: boolean;

    // Filtering
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filteredAlerts: PriorityAlert[];
    activeQuickFilters: string[];
    filterDropdowns: DropdownFilterConfig[];

    // Pagination
    currentPage: number;
    pageSize: number;
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
    paginatedAlerts: PriorityAlert[];
    tableRows: Array<{
        id: string;
        severity: string;
        timestamp: string;
        device: string;
        aiSummary: string;
        status: string;
        confidence: number;
        actions: string;
    }>;

    // KPIs
    kpiData: KPICardProps[];

    // Actions
    handleAcknowledgeAlert: (alertId: string) => Promise<void>;
    handleAcknowledgeAll: () => Promise<void>;
    handleExportCSV: () => Promise<void>;
    handleBulkAction: (action: BulkActionType, selectedIds: string[]) => Promise<void>;
    toggleQuickFilter: (filter: string) => void;
    clearAllFilters: () => void;
    onSearchChange: (value: string) => void;
    navigateToAlert: (id: string) => void;
    onPaginationChange: (page: number, size: number) => void;
}

// ==========================================
// Hook
// ==========================================

export function usePriorityAlerts(): UsePriorityAlertsReturn {
    const [searchParams] = useSearchParams();
    const deviceFilter = searchParams.get('device');

    const [searchQuery, setSearchQuery] = useState(deviceFilter || '');
    const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_FILTER_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState(STATUS_FILTER_OPTIONS[0]);
    const [selectedTime, setSelectedTime] = useState(TIME_PERIOD_OPTIONS[2]); // Default to 30d
    const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isBulkActing, setIsBulkActing] = useState(false);

    const navigate = useNavigate();
    const { addToast } = useToast();

    // Update search when device filter changes from URL
    useEffect(() => {
        if (deviceFilter) {
            setSearchQuery(deviceFilter);
        }
    }, [deviceFilter]);

    // Fetch alerts via useFetchData
    const { data: rawAlerts, isLoading, refetch } = useFetchData(
        async (_signal) => {
            const data = await alertDataService.getAlerts(selectedTime.id);
            return (data || []).map((a: unknown) => normalizeAlert(a));
        },
        [selectedTime],
        {
            onError: (err) => {
                logger.error('Failed to fetch priority alerts', err);
                addToast('error', 'Load Failed', 'Could not fetch alerts');
            },
        }
    );
    const alerts = rawAlerts ?? [];

    // Auto-refresh interval using refetch
    useEffect(() => {
        const interval = setInterval(refetch, 30000);
        return () => clearInterval(interval);
    }, [refetch]);

    // ==========================================
    // Action Handlers
    // ==========================================

    const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
        try {
            await alertDataService.acknowledgeAlert(alertId);
            await refetch();
            addToast('success', 'Acknowledged', `Alert ${alertId} acknowledged`);
        } catch (error) {
            logger.error('Failed to acknowledge alert', error);
            addToast('error', 'Action Failed', 'Could not acknowledge alert');
        }
    }, [refetch, addToast]);

    const handleAcknowledgeAll = useCallback(async () => {
        try {
            const alertsToAck = alerts.map(a => a.id);
            await Promise.all(alertsToAck.map(id => alertDataService.acknowledgeAlert(id)));
            await refetch();
            addToast('success', 'All Acknowledged', `${alertsToAck.length} alerts acknowledged`);
        } catch (error) {
            logger.error('Failed to acknowledge alerts', error);
            addToast('error', 'Action Failed', 'Could not acknowledge all alerts');
        }
    }, [alerts, refetch, addToast]);

    const handleExportCSV = useCallback(async () => {
        try {
            const token = localStorage.getItem('noc_token');
            const response = await fetch(`${API_BASE_URL}/api/v1/reports/export?type=alerts`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`Export failed with status ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `alerts-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            addToast('success', 'Export Complete', 'Alerts CSV downloaded');
        } catch (error) {
            logger.error('Failed to export alerts CSV', error);
            addToast('error', 'Export Failed', 'Could not export alerts CSV');
        }
    }, [addToast]);

    // Bulk Actions
    const handleBulkAction = useCallback(async (action: BulkActionType, selectedIds: string[]) => {
        if (selectedIds.length === 0) {
            addToast('warning', 'No Selection', 'Please select at least one alert');
            return;
        }

        if (selectedIds.length > MAX_BULK_ALERTS) {
            addToast('error', 'Too Many Selected', `Maximum ${MAX_BULK_ALERTS} alerts per batch. You selected ${selectedIds.length}.`);
            return;
        }

        setIsBulkActing(true);
        try {
            const result = await alertDataService.bulkAction(action, selectedIds);
            const succeededCount = result?.succeeded?.length || 0;
            const failedEntries = result?.failed ? Object.entries(result.failed) : [];

            if (succeededCount > 0) {
                const actionLabel = action === 'acknowledge' ? 'acknowledged' : action === 'resolve' ? 'resolved' : 'dismissed';
                addToast('success', 'Bulk Action Complete', `${succeededCount} alert${succeededCount !== 1 ? 's' : ''} ${actionLabel}`);
            }

            if (failedEntries.length > 0) {
                failedEntries.forEach(([id, reason]) => {
                    addToast('error', `Failed: ${id}`, reason);
                });
            }

            await refetch();
        } catch (error) {
            logger.error(`Bulk ${action} failed`, error);
            addToast('error', 'Bulk Action Failed', `Could not ${action} selected alerts`);
        } finally {
            setIsBulkActing(false);
        }
    }, [addToast, refetch]);

    // ==========================================
    // Filtering & Pagination
    // ==========================================

    const filteredAlerts = useMemo(() => {
        let result = [...alerts];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (alert) =>
                    alert.device?.name?.toLowerCase().includes(query) ||
                    alert.device?.ip?.toLowerCase().includes(query) ||
                    (alert.aiSummary || '').toLowerCase().includes(query) ||
                    (alert.aiTitle || '').toLowerCase().includes(query) ||
                    (alert.id || '').toLowerCase().includes(query)
            );
        }

        if (selectedSeverity.id !== 'all') {
            result = result.filter((alert) => alert.severity === selectedSeverity.id);
        }

        if (selectedStatus.id !== 'all') {
            result = result.filter((alert) => alert.status === selectedStatus.id);
        }

        if (activeQuickFilters.includes('Critical Only')) {
            result = result.filter((alert) => alert.severity === 'critical');
        }

        if (activeQuickFilters.includes('Unacknowledged')) {
            result = result.filter((alert) => alert.status === 'open');
        }

        if (activeQuickFilters.includes('My Devices')) {
            const deviceCounts = new Map<string, number>();
            alerts.forEach(a => {
                const name = a.device?.name;
                if (name) deviceCounts.set(name, (deviceCounts.get(name) || 0) + 1);
            });
            const topDevices = [...deviceCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name]) => name);
            result = result.filter((alert) => topDevices.includes(alert.device?.name));
        }

        if (activeQuickFilters.includes('Repeated Alerts')) {
            const alertCounts = new Map<string, number>();
            alerts.forEach(a => alertCounts.set(a.aiTitle, (alertCounts.get(a.aiTitle) || 0) + 1));
            result = result.filter((alert) => (alertCounts.get(alert.aiTitle) || 0) > 1);
        }

        return result;
    }, [searchQuery, selectedSeverity, selectedStatus, activeQuickFilters, alerts]);

    const kpiData = useMemo(() => generateKPIData(alerts), [alerts]);

    const paginatedAlerts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAlerts.slice(start, start + pageSize);
    }, [filteredAlerts, currentPage, pageSize]);

    const tableRows = useMemo(() =>
        paginatedAlerts.map(alert => ({
            id: alert.id,
            severity: alert.severity,
            timestamp: renderTimestampValue(alert.timestamp),
            device: alert.device?.name || 'Unknown',
            aiSummary: alert.aiSummary || 'No summary',
            status: alert.status,
            confidence: alert.confidence,
            actions: '',
        })),
        [paginatedAlerts]
    );

    // ==========================================
    // Filter Controls
    // ==========================================

    const toggleQuickFilter = useCallback((filter: string) => {
        setActiveQuickFilters((prev) =>
            prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter]
        );
        setCurrentPage(1);
    }, []);

    const clearAllFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedSeverity(SEVERITY_FILTER_OPTIONS[0]);
        setSelectedStatus(STATUS_FILTER_OPTIONS[0]);
        setSelectedTime(TIME_PERIOD_OPTIONS[2]);
        setActiveQuickFilters([]);
        setCurrentPage(1);
    }, []);

    const onSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    }, []);

    const navigateToAlert = useCallback((id: string) => {
        navigate(`/alerts/${id}`);
    }, [navigate]);

    const onPaginationChange = useCallback((page: number, size: number) => {
        setCurrentPage(page);
        setPageSize(size);
    }, []);

    const filterDropdowns: DropdownFilterConfig[] = useMemo(() => [
        {
            id: 'severity-filter',
            label: 'Severity',
            options: SEVERITY_FILTER_OPTIONS,
            selectedItem: selectedSeverity,
            onChange: (item) => {
                setSelectedSeverity(item || SEVERITY_FILTER_OPTIONS[0]);
                setCurrentPage(1);
            },
        },
        {
            id: 'status-filter',
            label: 'Status',
            options: STATUS_FILTER_OPTIONS,
            selectedItem: selectedStatus,
            onChange: (item) => {
                setSelectedStatus(item || STATUS_FILTER_OPTIONS[0]);
                setCurrentPage(1);
            },
        },
        {
            id: 'time-filter',
            label: 'Time Period',
            options: TIME_PERIOD_OPTIONS,
            selectedItem: selectedTime,
            onChange: (item) => {
                setSelectedTime(item || TIME_PERIOD_OPTIONS[0]);
                setCurrentPage(1);
            },
        },
    ], [selectedSeverity, selectedStatus, selectedTime]);

    return {
        alerts,
        isLoading,
        isBulkActing,
        searchQuery,
        setSearchQuery,
        filteredAlerts,
        activeQuickFilters,
        filterDropdowns,
        currentPage,
        pageSize,
        setCurrentPage,
        setPageSize,
        paginatedAlerts,
        tableRows,
        kpiData,
        handleAcknowledgeAlert,
        handleAcknowledgeAll,
        handleExportCSV,
        handleBulkAction,
        toggleQuickFilter,
        clearAllFilters,
        onSearchChange,
        navigateToAlert,
        onPaginationChange,
    };
}
