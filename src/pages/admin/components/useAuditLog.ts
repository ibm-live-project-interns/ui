/**
 * Copyright IBM Corp. 2026
 *
 * useAuditLog - Custom hook encapsulating all state and data-fetching logic
 * for the Audit Log page.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DropdownFilterConfig } from '@/components/ui/FilterBar';
import { logger } from '@/shared/utils/logger';
import { useFetchData } from '@/shared/hooks';

import { auditLogService } from './auditLogService';
import type { AuditLogEntry, AuditLogStats, FilterOption } from './audit-log.types';
import {
    getActionLabel,
    formatTimestamp,
    formatDetails,
    getResourceLabel,
    RESULT_FILTER_OPTIONS,
    RESOURCE_FILTER_OPTIONS,
} from './audit-log.types';

// ==========================================
// Return type
// ==========================================

export interface UseAuditLogReturn {
    // Data
    auditLogs: AuditLogEntry[];
    totalLogs: number;
    stats: AuditLogStats;
    isLoading: boolean;
    loadError: string | null;

    // Filter state
    searchInput: string;
    setSearchInput: (value: string) => void;
    setSearchQuery: (value: string) => void;
    filterDropdowns: DropdownFilterConfig[];
    startDate: string;
    endDate: string;
    handleStartDateChange: (dates: Date[]) => void;
    handleEndDateChange: (dates: Date[]) => void;
    hasActiveFilters: boolean;
    clearAllFilters: () => void;

    // Pagination
    currentPage: number;
    pageSize: number;
    handlePageChange: (page: number, newPageSize: number) => void;

    // Actions
    fetchAuditLogs: () => Promise<void>;
    handleExportCSV: () => void;
}

// ==========================================
// Hook
// ==========================================

export function useAuditLog(): UseAuditLogReturn {
    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAction, setSelectedAction] = useState<FilterOption>({ id: 'all', text: 'All Actions' });
    const [selectedResource, setSelectedResource] = useState<FilterOption>(RESOURCE_FILTER_OPTIONS[0]);
    const [selectedResult, setSelectedResult] = useState<FilterOption>(RESULT_FILTER_OPTIONS[0]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedAction, selectedResource, selectedResult, startDate, endDate]);

    // Fetch available actions on mount
    const { data: actionsData } = useFetchData(
        async (_signal) => {
            const actions = await auditLogService.getActions();
            if (actions.length > 0) {
                return [
                    { id: 'all', text: 'All Actions' } as FilterOption,
                    ...actions.map((a) => ({ id: a, text: getActionLabel(a) } as FilterOption)),
                ];
            }
            return [{ id: 'all', text: 'All Actions' } as FilterOption];
        },
        [],
    );

    const availableActions = actionsData ?? [{ id: 'all', text: 'All Actions' } as FilterOption];

    // Fetch audit logs
    const { data: logsResult, isLoading, error: loadError, refetch: refetchLogs } = useFetchData(
        async (_signal) => {
            const response = await auditLogService.getAuditLogs({
                search: searchQuery || undefined,
                action: selectedAction.id !== 'all' ? selectedAction.id : undefined,
                resource: selectedResource.id !== 'all' ? selectedResource.id : undefined,
                result: selectedResult.id !== 'all' ? selectedResult.id : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                limit: pageSize,
                offset: (currentPage - 1) * pageSize,
            });
            return {
                audit_logs: response.audit_logs || [] as AuditLogEntry[],
                total: response.total || 0,
                stats: response.stats,
            };
        },
        [searchQuery, selectedAction, selectedResource, selectedResult, startDate, endDate, currentPage, pageSize],
        {
            onError: (err) => logger.error('Failed to fetch audit logs', err),
        }
    );

    const auditLogs = logsResult?.audit_logs ?? [];
    const totalLogs = logsResult?.total ?? 0;
    const stats: AuditLogStats = logsResult?.stats ?? {
        total_actions_24h: 0,
        failed_actions_24h: 0,
        active_users_24h: 0,
        most_active_user: 'N/A',
        most_active_user_actions: 0,
    };

    // Wrap refetch as an async function matching the original fetchAuditLogs signature
    const fetchAuditLogs = useCallback(async () => {
        refetchLogs();
    }, [refetchLogs]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSearchInput('');
        setSearchQuery('');
        setSelectedAction({ id: 'all', text: 'All Actions' });
        setSelectedResource(RESOURCE_FILTER_OPTIONS[0]);
        setSelectedResult(RESULT_FILTER_OPTIONS[0]);
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    }, []);

    // Whether any filters are active
    const hasActiveFilters = !!(
        searchQuery ||
        selectedAction.id !== 'all' ||
        selectedResource.id !== 'all' ||
        selectedResult.id !== 'all' ||
        startDate ||
        endDate
    );

    // FilterBar dropdown configs
    const filterDropdowns: DropdownFilterConfig[] = useMemo(() => [
        {
            id: 'action-filter',
            label: 'Action',
            options: availableActions,
            selectedItem: selectedAction,
            onChange: (item) => {
                setSelectedAction(item || { id: 'all', text: 'All Actions' });
                setCurrentPage(1);
            },
        },
        {
            id: 'resource-filter',
            label: 'Resource',
            options: RESOURCE_FILTER_OPTIONS,
            selectedItem: selectedResource,
            onChange: (item) => {
                setSelectedResource(item || RESOURCE_FILTER_OPTIONS[0]);
                setCurrentPage(1);
            },
        },
        {
            id: 'result-filter',
            label: 'Result',
            options: RESULT_FILTER_OPTIONS,
            selectedItem: selectedResult,
            onChange: (item) => {
                setSelectedResult(item || RESULT_FILTER_OPTIONS[0]);
                setCurrentPage(1);
            },
        },
    ], [availableActions, selectedAction, selectedResource, selectedResult]);

    // Export to CSV
    const handleExportCSV = useCallback(() => {
        if (auditLogs.length === 0) return;

        const csvHeaders = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'Details', 'IP Address', 'Result'];
        const csvRows = auditLogs.map((log) => [
            formatTimestamp(log.created_at),
            log.username,
            getActionLabel(log.action),
            getResourceLabel(log.resource),
            log.resource_id || '',
            formatDetails(log.details).replace(/,/g, ';'),
            log.ip_address || '',
            log.result,
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [auditLogs]);

    // Handle date picker changes
    const handleStartDateChange = useCallback((dates: Date[]) => {
        if (dates && dates.length > 0 && dates[0]) {
            setStartDate(dates[0].toISOString().slice(0, 10));
            setCurrentPage(1);
        } else {
            setStartDate('');
        }
    }, []);

    const handleEndDateChange = useCallback((dates: Date[]) => {
        if (dates && dates.length > 0 && dates[0]) {
            setEndDate(dates[0].toISOString().slice(0, 10));
            setCurrentPage(1);
        } else {
            setEndDate('');
        }
    }, []);

    const handlePageChange = useCallback((page: number, newPageSize: number) => {
        setCurrentPage(page);
        setPageSize(newPageSize);
    }, []);

    return {
        auditLogs,
        totalLogs,
        stats,
        isLoading,
        loadError,
        searchInput,
        setSearchInput,
        setSearchQuery,
        filterDropdowns,
        startDate,
        endDate,
        handleStartDateChange,
        handleEndDateChange,
        hasActiveFilters,
        clearAllFilters,
        currentPage,
        pageSize,
        handlePageChange,
        fetchAuditLogs,
        handleExportCSV,
    };
}
