/**
 * Copyright IBM Corp. 2026
 *
 * Audit Log Page
 * Displays system-wide audit trail for sysadmin users.
 * Shows all user actions with filtering, pagination, and export capabilities.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DataTable,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    Search,
    Dropdown,
    Tag,
    Pagination,
    DataTableSkeleton,
    SkeletonText,
    Tile,
    Button,
    DatePicker,
    DatePickerInput,
} from '@carbon/react';
import {
    Download,
    Activity,
    ErrorFilled,
    UserMultiple,
    UserAvatar,
    CheckmarkFilled,
    CloseFilled,
    Close,
    Renew,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader, DataTableWrapper } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';

// Config
import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';

// Styles
import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_audit-log.scss';

// ==========================================
// Types
// ==========================================

interface AuditLogEntry {
    id: number;
    created_at: string;
    user_id: number;
    username: string;
    action: string;
    resource: string;
    resource_id: string;
    details: Record<string, unknown> | null;
    ip_address: string;
    result: 'success' | 'failure';
}

interface AuditLogStats {
    total_actions_24h: number;
    failed_actions_24h: number;
    active_users_24h: number;
    most_active_user: string;
    most_active_user_actions: number;
}

interface AuditLogResponse {
    audit_logs: AuditLogEntry[];
    total: number;
    stats: AuditLogStats;
}

interface FilterOption {
    id: string;
    text: string;
}

// ==========================================
// Audit Log API Service
// ==========================================

class AuditLogService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'AuditLogService');
    }

    async getAuditLogs(params: {
        search?: string;
        action?: string;
        resource?: string;
        username?: string;
        result?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
    }): Promise<AuditLogResponse> {
        const queryParts: string[] = [];
        if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params.action) queryParts.push(`action=${encodeURIComponent(params.action)}`);
        if (params.resource) queryParts.push(`resource=${encodeURIComponent(params.resource)}`);
        if (params.username) queryParts.push(`username=${encodeURIComponent(params.username)}`);
        if (params.result) queryParts.push(`result=${encodeURIComponent(params.result)}`);
        if (params.start_date) queryParts.push(`start_date=${encodeURIComponent(params.start_date)}`);
        if (params.end_date) queryParts.push(`end_date=${encodeURIComponent(params.end_date)}`);
        if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
        if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);

        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        try {
            return await this.get<AuditLogResponse>(`/audit-logs${query}`);
        } catch (error) {
            console.warn('[AuditLogService] GET /audit-logs not available, returning empty:', error);
            return {
                audit_logs: [],
                total: 0,
                stats: {
                    total_actions_24h: 0,
                    failed_actions_24h: 0,
                    active_users_24h: 0,
                    most_active_user: 'N/A',
                    most_active_user_actions: 0,
                },
            };
        }
    }

    async getActions(): Promise<string[]> {
        try {
            const response = await this.get<{ actions: string[] }>('/audit-logs/actions');
            return response.actions || [];
        } catch {
            return [];
        }
    }
}

const auditLogService = new AuditLogService();

// ==========================================
// Action type display helpers
// ==========================================

const ACTION_LABELS: Record<string, string> = {
    'user.create': 'User Created',
    'user.update': 'User Updated',
    'user.delete': 'User Deleted',
    'user.login': 'User Login',
    'user.logout': 'User Logout',
    'user.password_reset': 'Password Reset',
    'alert.acknowledge': 'Alert Acknowledged',
    'alert.resolve': 'Alert Resolved',
    'alert.dismiss': 'Alert Dismissed',
    'ticket.create': 'Ticket Created',
    'ticket.update': 'Ticket Updated',
    'ticket.delete': 'Ticket Deleted',
    'config.create': 'Config Created',
    'config.update': 'Config Updated',
    'config.delete': 'Config Deleted',
    'report.export': 'Report Exported',
};

const RESOURCE_LABELS: Record<string, string> = {
    user: 'User',
    alert: 'Alert',
    ticket: 'Ticket',
    config: 'Configuration',
    session: 'Session',
    report: 'Report',
    device: 'Device',
};

function getActionLabel(action: string): string {
    return ACTION_LABELS[action] || action;
}

function getResourceLabel(resource: string): string {
    return RESOURCE_LABELS[resource] || resource;
}

function getResultTag(result: string) {
    if (result === 'success') {
        return <Tag type="green" size="sm" renderIcon={CheckmarkFilled}>Success</Tag>;
    }
    return <Tag type="red" size="sm" renderIcon={CloseFilled}>Failure</Tag>;
}

function getActionTag(action: string) {
    const prefix = action.split('.')[0];
    const tagTypes: Record<string, 'blue' | 'teal' | 'purple' | 'cyan' | 'magenta' | 'warm-gray'> = {
        user: 'blue',
        alert: 'magenta',
        ticket: 'teal',
        config: 'purple',
        report: 'cyan',
        session: 'warm-gray',
    };
    const tagType = tagTypes[prefix] || 'warm-gray';
    return <Tag type={tagType} size="sm">{getActionLabel(action)}</Tag>;
}

function formatTimestamp(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    } catch {
        return isoString;
    }
}

function formatDetails(details: Record<string, unknown> | null): string {
    if (!details || Object.keys(details).length === 0) return '--';
    return Object.entries(details)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(', ');
}

// ==========================================
// Filter Options
// ==========================================

const RESULT_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Results' },
    { id: 'success', text: 'Success' },
    { id: 'failure', text: 'Failure' },
];

const RESOURCE_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Resources' },
    { id: 'user', text: 'User' },
    { id: 'alert', text: 'Alert' },
    { id: 'ticket', text: 'Ticket' },
    { id: 'config', text: 'Configuration' },
    { id: 'session', text: 'Session' },
    { id: 'report', text: 'Report' },
    { id: 'device', text: 'Device' },
];

// ==========================================
// Component
// ==========================================

/** Build a navigation path for a resource type + resource ID */
function getResourceLink(resource: string, resourceId: string): string | null {
    if (!resourceId) return null;
    switch (resource) {
        case 'alert': return `/alerts/${resourceId}`;
        case 'ticket': return `/tickets/${resourceId}`;
        case 'device': return `/devices/${resourceId}`;
        case 'user': return null; // no user profile page yet
        case 'config': return '/configuration';
        default: return null;
    }
}

export function AuditLogPage() {
    const navigate = useNavigate();

    // Data state
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [stats, setStats] = useState<AuditLogStats>({
        total_actions_24h: 0,
        failed_actions_24h: 0,
        active_users_24h: 0,
        most_active_user: 'N/A',
        most_active_user_actions: 0,
    });
    const [availableActions, setAvailableActions] = useState<FilterOption[]>([
        { id: 'all', text: 'All Actions' },
    ]);
    const [isLoading, setIsLoading] = useState(true);
    // Error state for retry banner
    const [loadError, setLoadError] = useState<string | null>(null);

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

    // Debounce search to avoid firing API call on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset pagination to page 1 when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedAction, selectedResource, selectedResult, startDate, endDate]);

    // Fetch available actions on mount
    useEffect(() => {
        let isMounted = true;
        const fetchActions = async () => {
            const actions = await auditLogService.getActions();
            if (isMounted && actions.length > 0) {
                const actionOptions: FilterOption[] = [
                    { id: 'all', text: 'All Actions' },
                    ...actions.map((a) => ({ id: a, text: getActionLabel(a) })),
                ];
                setAvailableActions(actionOptions);
            }
        };
        fetchActions();
        return () => { isMounted = false; };
    }, []);

    // Fetch audit logs when filters or pagination change
    const fetchAuditLogs = useCallback(async () => {
        setIsLoading(true);
        try {
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
            setAuditLogs(response.audit_logs || []);
            setTotalLogs(response.total || 0);
            if (response.stats) {
                setStats(response.stats);
            }
            setLoadError(null);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            setLoadError(error instanceof Error ? error.message : 'Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedAction, selectedResource, selectedResult, startDate, endDate, currentPage, pageSize]);

    useEffect(() => {
        let isMounted = true;
        const doFetch = async () => {
            if (!isMounted) return;
            await fetchAuditLogs();
        };
        doFetch();
        return () => { isMounted = false; };
    }, [fetchAuditLogs]);

    // KPI data
    const kpiData = useMemo((): KPICardProps[] => [
        {
            id: 'total-actions',
            label: 'Total Actions (24h)',
            value: stats.total_actions_24h,
            icon: Activity,
            iconColor: '#0f62fe',
            severity: 'info' as const,
            subtitle: 'Last 24 hours',
        },
        {
            id: 'failed-actions',
            label: 'Failed Actions',
            value: stats.failed_actions_24h,
            icon: ErrorFilled,
            iconColor: '#da1e28',
            severity: stats.failed_actions_24h > 0 ? 'critical' as const : 'success' as const,
            subtitle: 'Last 24 hours',
        },
        {
            id: 'active-users',
            label: 'Active Users',
            value: stats.active_users_24h,
            icon: UserMultiple,
            iconColor: '#198038',
            severity: 'success' as const,
            subtitle: 'Last 24 hours',
        },
        {
            id: 'most-active',
            label: 'Most Active User',
            value: stats.most_active_user,
            icon: UserAvatar,
            iconColor: '#8a3ffc',
            severity: 'neutral' as const,
            subtitle: `${stats.most_active_user_actions} actions`,
        },
    ], [stats]);

    // Table headers
    const headers = [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'username', header: 'User' },
        { key: 'action', header: 'Action' },
        { key: 'resource', header: 'Resource' },
        { key: 'details', header: 'Details' },
        { key: 'ip_address', header: 'IP Address' },
        { key: 'result', header: 'Result' },
    ];

    // Transform audit logs to DataTable-compatible rows (primitive values)
    const tableRows = useMemo(() =>
        auditLogs.map((log) => ({
            id: String(log.id),
            timestamp: formatTimestamp(log.created_at),
            username: log.username,
            action: log.action,
            resource: `${getResourceLabel(log.resource)}${log.resource_id ? ` #${log.resource_id}` : ''}`,
            details: formatDetails(log.details),
            ip_address: log.ip_address || '--',
            result: log.result,
        })),
        [auditLogs]
    );

    // Clear all filters
    const clearAllFilters = () => {
        setSearchInput('');
        setSearchQuery('');
        setSelectedAction({ id: 'all', text: 'All Actions' });
        setSelectedResource(RESOURCE_FILTER_OPTIONS[0]);
        setSelectedResult(RESULT_FILTER_OPTIONS[0]);
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery ||
        selectedAction.id !== 'all' ||
        selectedResource.id !== 'all' ||
        selectedResult.id !== 'all' ||
        startDate ||
        endDate;

    const activeFilterCount = [
        searchQuery ? 1 : 0,
        selectedAction.id !== 'all' ? 1 : 0,
        selectedResource.id !== 'all' ? 1 : 0,
        selectedResult.id !== 'all' ? 1 : 0,
        startDate ? 1 : 0,
        endDate ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

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
    const handleStartDateChange = (dates: Date[]) => {
        if (dates && dates.length > 0 && dates[0]) {
            setStartDate(dates[0].toISOString().slice(0, 10));
            setCurrentPage(1);
        } else {
            setStartDate('');
        }
    };

    const handleEndDateChange = (dates: Date[]) => {
        if (dates && dates.length > 0 && dates[0]) {
            setEndDate(dates[0].toISOString().slice(0, 10));
            setCurrentPage(1);
        } else {
            setEndDate('');
        }
    };

    // Loading skeleton
    if (isLoading && auditLogs.length === 0) {
        return (
            <div className="audit-log-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Admin', href: '/dashboard' },
                        { label: 'Audit Log', active: true },
                    ]}
                    title="Audit Log"
                    subtitle="System-wide activity trail for compliance and security monitoring"
                    showBorder
                    actions={[
                        {
                            label: 'Export CSV',
                            onClick: () => {},
                            variant: 'primary',
                            icon: Download,
                            disabled: true,
                        },
                    ]}
                />

                <div className="audit-log-page__content">
                    {/* Skeleton KPI Row */}
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                                <SkeletonText width="80%" />
                            </Tile>
                        ))}
                    </div>

                    {/* Skeleton Table */}
                    <DataTableWrapper
                        title="Activity Log"
                        showFilter={false}
                        showRefresh={false}
                    >
                        <DataTableSkeleton
                            columnCount={headers.length}
                            rowCount={10}
                            showHeader={false}
                            showToolbar={false}
                        />
                    </DataTableWrapper>
                </div>
            </div>
        );
    }

    return (
        <div className="audit-log-page">
            {/* Page Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Admin', href: '/dashboard' },
                    { label: 'Audit Log', active: true },
                ]}
                title="Audit Log"
                subtitle="System-wide activity trail for compliance and security monitoring"
                showBorder
                actions={[
                    {
                        label: 'Refresh',
                        onClick: fetchAuditLogs,
                        variant: 'secondary',
                        icon: Renew,
                    },
                    {
                        label: 'Export CSV',
                        onClick: handleExportCSV,
                        variant: 'primary',
                        icon: Download,
                        disabled: auditLogs.length === 0,
                    },
                ]}
            />

            {/* Error state with retry */}
            {loadError && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--cds-text-error)', marginBottom: '1rem' }}>
                        Failed to load audit logs: {loadError}
                    </p>
                    <Button kind="tertiary" size="sm" onClick={fetchAuditLogs}>Retry</Button>
                </div>
            )}

            <div className="audit-log-page__content">
                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Filters Row */}
                <div className="audit-log-page__filters">
                    <Search
                        size="lg"
                        placeholder="Search by user, action, or resource..."
                        labelText="Search audit logs"
                        value={searchInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchInput(e.target.value);
                        }}
                        onClear={() => {
                            setSearchInput('');
                            setSearchQuery('');
                        }}
                        className="audit-log-page__search"
                    />

                    <Dropdown
                        id="action-filter"
                        label="Action"
                        titleText=""
                        items={availableActions}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedAction}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedAction(selectedItem || { id: 'all', text: 'All Actions' });
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />

                    <Dropdown
                        id="resource-filter"
                        label="Resource"
                        titleText=""
                        items={RESOURCE_FILTER_OPTIONS}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedResource}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedResource(selectedItem || RESOURCE_FILTER_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />

                    <Dropdown
                        id="result-filter"
                        label="Result"
                        titleText=""
                        items={RESULT_FILTER_OPTIONS}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedResult}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedResult(selectedItem || RESULT_FILTER_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />
                </div>

                {/* Date Range Row */}
                <div className="audit-log-page__date-filters">
                    <DatePicker
                        datePickerType="single"
                        onChange={handleStartDateChange}
                        value={startDate}
                    >
                        <DatePickerInput
                            id="start-date"
                            placeholder="mm/dd/yyyy"
                            labelText="From"
                            size="lg"
                        />
                    </DatePicker>

                    <DatePicker
                        datePickerType="single"
                        onChange={handleEndDateChange}
                        value={endDate}
                    >
                        <DatePickerInput
                            id="end-date"
                            placeholder="mm/dd/yyyy"
                            labelText="To"
                            size="lg"
                        />
                    </DatePicker>

                    {hasActiveFilters && (
                        <Button
                            kind="ghost"
                            size="lg"
                            renderIcon={Close}
                            onClick={clearAllFilters}
                            className="audit-log-page__clear-filters"
                        >
                            Clear filters ({activeFilterCount})
                        </Button>
                    )}
                </div>

                {/* Filter Results Summary */}
                {hasActiveFilters && (
                    <div className="audit-log-page__filter-summary">
                        Showing {auditLogs.length} of {totalLogs} audit log entries
                    </div>
                )}

                {/* Audit Log Table */}
                <DataTableWrapper
                    title="Activity Log"
                    showFilter={false}
                    showRefresh={false}
                >
                    <DataTable rows={tableRows} headers={headers}>
                        {({ rows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                            <TableContainer>
                                <Table {...getTableProps()}>
                                    <TableHead>
                                        <TableRow>
                                            {tableHeaders.map((header) => (
                                                <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                    {header.header}
                                                </TableHeader>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={headers.length}>
                                                    <div style={{
                                                        textAlign: 'center',
                                                        padding: '2rem',
                                                        color: 'var(--cds-text-secondary, #c6c6c6)',
                                                    }}>
                                                        {hasActiveFilters
                                                            ? 'No audit log entries match the current filters.'
                                                            : 'No audit log entries found.'}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map((row) => {
                                                const log = auditLogs.find((l) => String(l.id) === row.id);
                                                if (!log) return null;

                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell>
                                                            <div className="audit-log-page__timestamp">
                                                                {formatTimestamp(log.created_at)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="audit-log-page__user">
                                                                <span className="audit-log-page__username">
                                                                    {log.username}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getActionTag(log.action)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="audit-log-page__resource">
                                                                <span className="audit-log-page__resource-type">
                                                                    {getResourceLabel(log.resource)}
                                                                </span>
                                                                {log.resource_id && (() => {
                                                                    const link = getResourceLink(log.resource, log.resource_id);
                                                                    return link ? (
                                                                        <span
                                                                            className="audit-log-page__resource-id"
                                                                            role="link"
                                                                            tabIndex={0}
                                                                            style={{ cursor: 'pointer', color: 'var(--cds-link-primary)', textDecoration: 'underline' }}
                                                                            onClick={() => navigate(link)}
                                                                            onKeyDown={(e) => { if (e.key === 'Enter') navigate(link); }}
                                                                        >
                                                                            #{log.resource_id}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="audit-log-page__resource-id">
                                                                            #{log.resource_id}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div
                                                                className="audit-log-page__details"
                                                                title={formatDetails(log.details)}
                                                            >
                                                                {formatDetails(log.details)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <code className="audit-log-page__ip">
                                                                {log.ip_address || '--'}
                                                            </code>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getResultTag(log.result)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DataTable>

                    <Pagination
                        totalItems={totalLogs}
                        pageSize={pageSize}
                        pageSizes={[10, 25, 50, 100]}
                        page={currentPage}
                        onChange={({ page, pageSize: newPageSize }: { page: number; pageSize: number }) => {
                            setCurrentPage(page);
                            setPageSize(newPageSize);
                        }}
                    />
                </DataTableWrapper>
            </div>
        </div>
    );
}

export default AuditLogPage;
