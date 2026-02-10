import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    DataTable,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    Button,
    Search,
    Dropdown,
    Tag,
    Pagination,
    ProgressBar,
    DataTableSkeleton,
    SkeletonText,
    Tile,
} from '@carbon/react';
import {
    Download,
    Checkmark,
    View,
    Close,
} from '@carbon/icons-react';
import '@/styles/pages/_priority-alerts.scss';
import '@/styles/components/_kpi-card.scss';


// All from consolidated constants
import { SEVERITY_CONFIG, getSeverityTag, SEVERITY_FILTER_OPTIONS, TIME_PERIOD_OPTIONS } from '@/shared/constants/severity';
import { getStatusTag, STATUS_FILTER_OPTIONS } from '@/shared/constants/status';
import { getDeviceIcon } from '@/shared/constants/devices';
import type { Severity } from '@/shared/types/common.types';
import type { PriorityAlert } from '@/features/alerts/types/alert.types';

// Data Service
import { alertDataService } from '@/shared/services';
import { normalizeAlert } from '@/shared/utils/normalizeAlert';
import { API_BASE_URL } from '@/shared/config/api.config';

// Reusable components
import { KPICard, PageHeader, DataTableWrapper } from '@/components';
import type { KPICardProps, KPISeverity } from '@/components/ui/KPICard';

// KPI data derived from alerts - uses centralized SEVERITY_CONFIG for icons and colors
const generateKPIData = (alerts: PriorityAlert[]): KPICardProps[] => {
    const counts: Record<Severity, number> = {
        critical: 0,
        high: 0,
        major: 0,
        medium: 0,
        minor: 0,
        low: 0,
        info: 0,
    };

    alerts.forEach((alert) => {
        if (counts[alert.severity] !== undefined) {
            counts[alert.severity]++;
        }
    });

    return [
        {
            id: 'critical',
            label: 'Critical Alerts',
            value: counts.critical,
            subtitle: `Priority ${SEVERITY_CONFIG.critical.priority}`,
            icon: SEVERITY_CONFIG.critical.icon,
            iconColor: SEVERITY_CONFIG.critical.color,
            severity: 'critical' as KPISeverity,
        },
        {
            id: 'major',
            label: 'Major Alerts',
            value: counts.major,
            subtitle: `Priority ${SEVERITY_CONFIG.major.priority}`,
            icon: SEVERITY_CONFIG.major.icon,
            iconColor: SEVERITY_CONFIG.major.color,
            severity: 'major' as KPISeverity,
        },
        {
            id: 'minor',
            label: 'Minor Alerts',
            value: counts.minor,
            subtitle: `Priority ${SEVERITY_CONFIG.minor.priority}`,
            icon: SEVERITY_CONFIG.minor.icon,
            iconColor: SEVERITY_CONFIG.minor.color,
            severity: 'minor' as KPISeverity,
        },
        {
            id: 'info',
            label: 'Info Alerts',
            value: counts.info,
            subtitle: `Priority ${SEVERITY_CONFIG.info.priority}`,
            icon: SEVERITY_CONFIG.info.icon,
            iconColor: SEVERITY_CONFIG.info.color,
            severity: 'info' as KPISeverity,
        },
    ];
};

const QUICK_FILTERS = ['Critical Only', 'Unacknowledged', 'My Devices', 'Repeated Alerts'];

export function PriorityAlertsPage() {
    const [searchParams] = useSearchParams();
    const deviceFilter = searchParams.get('device');

    const [searchQuery, setSearchQuery] = useState(deviceFilter || '');
    const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_FILTER_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState(STATUS_FILTER_OPTIONS[0]);
    const [selectedTime, setSelectedTime] = useState(TIME_PERIOD_OPTIONS[2]); // Default to 30d to show recent alerts
    const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Data State
    const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    // Update search when device filter changes from URL
    useEffect(() => {
        if (deviceFilter) {
            setSearchQuery(deviceFilter);
        }
    }, [deviceFilter]);

    // Action Handlers
    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            await alertDataService.acknowledgeAlert(alertId);
            // Refresh alerts after acknowledging, preserving current time filter
            const updatedAlerts = await alertDataService.getAlerts(selectedTime.id);
            setAlerts((updatedAlerts || []).map((a: any) => normalizeAlert(a)));
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const handleAcknowledgeAll = async () => {
        try {
            // Acknowledge all selected or all alerts if none selected
            const alertsToAck = selectedRows.size > 0
                ? Array.from(selectedRows)
                : alerts.map(a => a.id);

            await Promise.all(alertsToAck.map(id => alertDataService.acknowledgeAlert(id)));

            // Refresh alerts, preserving current time filter
            const updatedAlerts = await alertDataService.getAlerts(selectedTime.id);
            setAlerts((updatedAlerts || []).map((a: any) => normalizeAlert(a)));
            setSelectedRows(new Set());
        } catch (error) {
            console.error('Failed to acknowledge alerts:', error);
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem('auth_token');
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
        } catch (error) {
            console.error('Failed to export alerts CSV:', error);
        }
    };

    // Fetch Alerts - Re-fetch when time period changes
    // Fixed: Added mounted flag to prevent state updates after unmount
    useEffect(() => {
        let isMounted = true;

        const fetchAlerts = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            try {
                const data = await alertDataService.getAlerts(selectedTime.id);
                if (isMounted) {
                    const normalized = (data || []).map((a: any) => normalizeAlert(a));
                    setAlerts(normalized);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to fetch priority alerts:", error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Polling

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedTime]); // Re-fetch when time period changes

    // Filter alerts
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
            const myDevices = ['Core-SW-01', 'FW-DMZ-03', 'RTR-EDGE-05'];
            result = result.filter((alert) => myDevices.includes(alert.device?.name));
        }

        if (activeQuickFilters.includes('Repeated Alerts')) {
            const alertCounts = new Map<string, number>();
            alerts.forEach(a => alertCounts.set(a.aiTitle, (alertCounts.get(a.aiTitle) || 0) + 1));
            result = result.filter((alert) => (alertCounts.get(alert.aiTitle) || 0) > 1);
        }

        return result;
    }, [searchQuery, selectedSeverity, selectedStatus, activeQuickFilters, alerts]);

    // Generate KPI data from all alerts
    const kpiData = useMemo(() => generateKPIData(alerts), [alerts]);

    // Paginate
    const paginatedAlerts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAlerts.slice(start, start + pageSize);
    }, [filteredAlerts, currentPage, pageSize]);

    // Transform alerts to DataTable-compatible format (primitive values for each key)
    const renderTimestampValue = (ts: any) => {
        if (typeof ts === 'string') return ts;
        if (!ts) return 'N/A';
        const candidate = ts.relative ?? ts.absolute ?? ts;
        return (typeof candidate === 'object') ? JSON.stringify(candidate) : String(candidate);
    };

    const tableRows = useMemo(() =>
        paginatedAlerts.map(alert => ({
            id: alert.id,
            severity: alert.severity,
            timestamp: renderTimestampValue(alert.timestamp),
            device: alert.device?.name || 'Unknown',
            aiSummary: alert.aiSummary || 'No summary',
            status: alert.status,
            confidence: alert.confidence,
            actions: '', // Rendered custom
        })),
        [paginatedAlerts]
    );

    const toggleQuickFilter = (filter: string) => {
        setActiveQuickFilters((prev) =>
            prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter]
        );
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedSeverity(SEVERITY_FILTER_OPTIONS[0]);
        setSelectedStatus(STATUS_FILTER_OPTIONS[0]);
        setSelectedTime(TIME_PERIOD_OPTIONS[2]);
        setActiveQuickFilters([]);
        setCurrentPage(1);
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery ||
        selectedSeverity.id !== 'all' ||
        selectedStatus.id !== 'all' ||
        activeQuickFilters.length > 0;

    // Count active filters for indicator
    const activeFilterCount = [
        searchQuery ? 1 : 0,
        selectedSeverity.id !== 'all' ? 1 : 0,
        selectedStatus.id !== 'all' ? 1 : 0,
        activeQuickFilters.length,
    ].reduce((a, b) => a + b, 0);

    // Row selection toggle - for future checkbox implementation
    const _toggleRowSelection = (id: string) => {
        setSelectedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };
    // Prevent unused warning - remove when checkbox column is added
    void _toggleRowSelection;

    const headers = [
        { key: 'severity', header: 'Severity' },
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'device', header: 'Device' },
        { key: 'aiSummary', header: 'AI Summary' },
        { key: 'status', header: 'Status' },
        { key: 'confidence', header: 'Confidence' },
        { key: 'actions', header: 'Actions' },
    ];

    if (isLoading && alerts.length === 0) {
        return (
            <div className="priority-alerts-page">
                {/* Header */}
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Priority Alerts</h1>
                        <p className="page-description">
                            Critical and high-priority network alerts requiring immediate attention
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <Button kind="ghost" renderIcon={Download} disabled>
                            Export CSV
                        </Button>
                        <Button kind="primary" renderIcon={Checkmark} disabled>
                            Acknowledge All
                        </Button>
                    </div>
                </div>

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
                    title="Priority Alerts"
                    showFilter={false}
                    showRefresh={false}
                >
                    <DataTableSkeleton
                        columnCount={headers.length}
                        rowCount={5}
                        showHeader={false}
                        showToolbar={false}
                    />
                </DataTableWrapper>
            </div>
        );
    }

    return (
        <div className="priority-alerts-page">
            {/* Page Header - using configurable PageHeader component */}
            <PageHeader
                title="Priority Alerts"
                subtitle="Critical and high-priority network alerts requiring immediate attention"
                showBreadcrumbs={false}
                showBorder={true}
                actions={[
                    {
                        label: 'Export CSV',
                        onClick: handleExportCSV,
                        variant: 'ghost',
                        icon: Download,
                    },
                    {
                        label: 'Acknowledge All',
                        onClick: handleAcknowledgeAll,
                        variant: 'primary',
                        icon: Checkmark,
                    },
                ]}
            />

            <div className="priority-alerts-page__content">
                {/* KPI Tiles - Using unified KPICard component */}
                <div className="kpi-row">
                    {kpiData.map((kpi: KPICardProps) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Filters */}
                <div className="filters-row">
                    <Search
                        size="lg"
                        placeholder="Search by device, summary, or title..."
                        labelText="Search alerts"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                        }}
                        className="filters-search"
                    />
                    <Dropdown
                        id="severity-filter"
                        label="Severity"
                        titleText=""
                        items={SEVERITY_FILTER_OPTIONS}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={selectedSeverity}
                        onChange={({ selectedItem }) => {
                            setSelectedSeverity(selectedItem || SEVERITY_FILTER_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />
                    <Dropdown
                        id="status-filter"
                        label="Status"
                        titleText=""
                        items={STATUS_FILTER_OPTIONS}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={selectedStatus}
                        onChange={({ selectedItem }) => {
                            setSelectedStatus(selectedItem || STATUS_FILTER_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />
                    <Dropdown
                        id="time-filter"
                        label="Time Period"
                        titleText=""
                        items={TIME_PERIOD_OPTIONS}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={selectedTime}
                        onChange={({ selectedItem }) => {
                            setSelectedTime(selectedItem || TIME_PERIOD_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />
                    {hasActiveFilters && (
                        <Button
                            kind="ghost"
                            size="lg"
                            renderIcon={Close}
                            onClick={clearAllFilters}
                        >
                            Clear filters ({activeFilterCount})
                        </Button>
                    )}
                </div>

                {/* Quick Filters */}
                <div className="quick-filters">
                    <span className="quick-filters-label">Quick Filters:</span>
                    {QUICK_FILTERS.map((filter) => (
                        <Tag
                            key={filter}
                            type={activeQuickFilters.includes(filter) ? 'blue' : 'gray'}
                            onClick={() => toggleQuickFilter(filter)}
                            className="quick-filter-tag"
                        >
                            {filter}
                        </Tag>
                    ))}
                </div>

                {/* Filter Results Summary */}
                {hasActiveFilters && (
                    <div className="filter-results-summary">
                        Showing {filteredAlerts.length} of {alerts.length} alerts
                    </div>
                )}

                {/* Alerts Table using DataTableWrapper */}
                <DataTableWrapper
                    title="Priority Alerts"
                    showFilter={false}
                    showRefresh={false}
                >
                    <DataTable rows={tableRows} headers={headers}>
                        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                            <TableContainer>
                                <Table {...getTableProps()}>
                                    <TableHead>
                                        <TableRow>
                                            {headers.map((header) => (
                                                <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                    {header.header}
                                                </TableHeader>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map((row) => {
                                            const alert = paginatedAlerts.find((a) => a.id === row.id);
                                            if (!alert) return null;

                                            return (
                                                <TableRow {...getRowProps({ row })} key={row.id} onClick={() => navigate(`/alerts/${alert.id}`)} style={{ cursor: 'pointer' }}>
                                                    <TableCell>
                                                        {getSeverityTag(alert.severity)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="timestamp-cell">
                                                            <div className="timestamp-relative">
                                                                {(() => {
                                                                    const v = typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative ?? alert.timestamp?.absolute ?? 'N/A';
                                                                    return typeof v === 'object' ? JSON.stringify(v) : v;
                                                                })()}
                                                            </div>
                                                            <div className="timestamp-absolute">
                                                                {(() => {
                                                                    const v = typeof alert.timestamp === 'string' ? '' : alert.timestamp?.absolute || '';
                                                                    return typeof v === 'object' ? JSON.stringify(v) : v;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="device-cell">
                                                            {getDeviceIcon(alert.device?.icon || 'server')}
                                                            <div className="device-info">
                                                                <div className="device-name">{alert.device?.name || 'Unknown'}</div>
                                                                <div className="device-ip">{alert.device?.ip || ''}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="summary-cell">
                                                            <div className="summary-title">{alert.aiTitle}</div>
                                                            <div className="summary-text">{alert.aiSummary}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusTag(alert.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="confidence-cell">
                                                            <ProgressBar
                                                                label={`${alert.confidence}% confidence`}
                                                                value={alert.confidence}
                                                                max={100}
                                                                hideLabel
                                                                size="small"
                                                            />
                                                            <span className="confidence-value">{alert.confidence}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                        <div className="actions-cell">
                                                            <Button
                                                                kind="ghost"
                                                                size="sm"
                                                                renderIcon={View}
                                                                hasIconOnly
                                                                iconDescription="View Details"
                                                                onClick={() => navigate(`/alerts/${alert.id}`)}
                                                            />
                                                            <Button
                                                                kind="ghost"
                                                                size="sm"
                                                                renderIcon={Checkmark}
                                                                hasIconOnly
                                                                iconDescription="Acknowledge"
                                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DataTable>

                    <Pagination
                        totalItems={filteredAlerts.length}
                        pageSize={pageSize}
                        pageSizes={[10, 20, 50, 100]}
                        page={currentPage}
                        onChange={({ page, pageSize }) => {
                            setCurrentPage(page);
                            setPageSize(pageSize);
                        }}
                    />
                </DataTableWrapper>
            </div>
        </div>
    );
}

export default PriorityAlertsPage;
