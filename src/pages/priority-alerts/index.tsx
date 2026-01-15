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
    Checkbox,
    ProgressBar,
    DataTableSkeleton,
    SkeletonText,
    Tile,
} from '@carbon/react';
import {
    Export,
    Checkmark,
    View,
    Close,
} from '@carbon/icons-react';
import '@/styles/PriorityAlertsPage.scss';
import '@/styles/KPICard.scss';

// All from consolidated constants
import {
    SEVERITY_CONFIG,
    getSeverityTag,
    getStatusTag,
    getDeviceIcon,
    type Severity,
    type PriorityAlert,
} from '@/constants';

// Data Service
import { alertDataService } from '@/services';

// Reusable components
import { KPICard } from '@/components';
import type { KPICardData, KPIColor } from '@/components';

// KPI data derived from alerts
const generateKPIData = (alerts: PriorityAlert[]): KPICardData[] => {
    const counts: Record<Severity, number> = {
        critical: 0,
        major: 0,
        minor: 0,
        info: 0,
    };

    alerts.forEach((alert) => {
        if (counts[alert.severity] !== undefined) {
            counts[alert.severity]++;
        }
    });

    const colorMap: Record<string, KPIColor> = {
        critical: 'red',
        major: 'orange',
        minor: 'yellow',
        info: 'green',
    };

    return [
        {
            id: 'critical',
            label: 'Critical Alerts',
            value: counts.critical,
            footnote: `Priority ${SEVERITY_CONFIG.critical.priority}`,
            IconComponent: SEVERITY_CONFIG.critical.icon,
            color: colorMap.critical,
            borderColor: colorMap.critical,
        },
        {
            id: 'major',
            label: 'Major Alerts',
            value: counts.major,
            footnote: `Priority ${SEVERITY_CONFIG.major.priority}`,
            IconComponent: SEVERITY_CONFIG.major.icon,
            color: colorMap.major,
            borderColor: colorMap.major,
        },
        {
            id: 'minor',
            label: 'Minor Alerts',
            value: counts.minor,
            footnote: `Priority ${SEVERITY_CONFIG.minor.priority}`,
            IconComponent: SEVERITY_CONFIG.minor.icon,
            color: colorMap.minor,
            borderColor: colorMap.minor,
        },
        {
            id: 'info',
            label: 'Info Alerts',
            value: counts.info,
            footnote: `Priority ${SEVERITY_CONFIG.info.priority}`,
            IconComponent: SEVERITY_CONFIG.info.icon,
            color: colorMap.info,
            borderColor: colorMap.info,
        },
    ];
};

const SEVERITY_OPTIONS = [
    { id: 'all', text: 'All Severities' },
    { id: 'critical', text: 'Critical' },
    { id: 'major', text: 'Major' },
    { id: 'minor', text: 'Minor' },
    { id: 'info', text: 'Info' },
];

const STATUS_OPTIONS = [
    { id: 'all', text: 'All Status' },
    { id: 'new', text: 'New' },
    { id: 'acknowledged', text: 'Acknowledged' },
    { id: 'in-progress', text: 'In Progress' },
    { id: 'resolved', text: 'Resolved' },
];

const TIME_OPTIONS = [
    { id: '24h', text: 'Last 24 Hours' },
    { id: '7d', text: 'Last 7 Days' },
    { id: '30d', text: 'Last 30 Days' },
];

const QUICK_FILTERS = ['Critical Only', 'Unacknowledged', 'My Devices', 'Repeated Alerts'];

export function PriorityAlertsPage() {
    const [searchParams] = useSearchParams();
    const deviceFilter = searchParams.get('device');
    
    const [searchQuery, setSearchQuery] = useState(deviceFilter || '');
    const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState(STATUS_OPTIONS[0]);
    const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
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
            // Refresh alerts after acknowledging
            const updatedAlerts = await alertDataService.getAlerts();
            setAlerts(updatedAlerts);
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

            // Refresh alerts
            const updatedAlerts = await alertDataService.getAlerts();
            setAlerts(updatedAlerts);
            setSelectedRows(new Set());
        } catch (error) {
            console.error('Failed to acknowledge alerts:', error);
        }
    };

    const handleExport = async () => {
        try {
            await alertDataService.exportReport('csv');
            console.log('Export completed successfully');
        } catch (error) {
            console.error('Failed to export report:', error);
        }
    };

    // Fetch Alerts - Re-fetch when time period changes
    useEffect(() => {
        const fetchAlerts = async () => {
            setIsLoading(true);
            try {
                // TODO: When API supports time filtering, pass selectedTime.id to getAlerts()
                // For now, we fetch all and filter client-side
                const data = await alertDataService.getAlerts();
                setAlerts(data);
            } catch (error) {
                console.error("Failed to fetch priority alerts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Polling
        return () => clearInterval(interval);
    }, [selectedTime]); // Re-fetch when time period changes

    const kpiData = useMemo(() => generateKPIData(alerts), [alerts]);

    // Filter alerts
    const filteredAlerts = useMemo(() => {
        let result = [...alerts];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (alert) =>
                    alert.device.name.toLowerCase().includes(query) ||
                    alert.device.ip.toLowerCase().includes(query) ||
                    alert.aiSummary.toLowerCase().includes(query) ||
                    alert.aiTitle.toLowerCase().includes(query) ||
                    alert.id.toLowerCase().includes(query)
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
            result = result.filter((alert) => alert.status === 'new');
        }

        if (activeQuickFilters.includes('My Devices')) {
            // TODO: Replace with actual user's assigned devices from backend/user profile
            const myDevices = ['Core-SW-01', 'FW-DMZ-03', 'RTR-EDGE-05'];
            result = result.filter((alert) => myDevices.includes(alert.device.name));
        }

        if (activeQuickFilters.includes('Repeated Alerts')) {
            // Find alerts that appear more than once (by title)
            const alertCounts = new Map<string, number>();
            alerts.forEach(a => alertCounts.set(a.aiTitle, (alertCounts.get(a.aiTitle) || 0) + 1));
            result = result.filter((alert) => (alertCounts.get(alert.aiTitle) || 0) > 1);
        }

        return result;
    }, [searchQuery, selectedSeverity, selectedStatus, activeQuickFilters, alerts]);

    // Paginate
    const paginatedAlerts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAlerts.slice(start, start + pageSize);
    }, [filteredAlerts, currentPage, pageSize]);

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
        setSelectedSeverity(SEVERITY_OPTIONS[0]);
        setSelectedStatus(STATUS_OPTIONS[0]);
        setSelectedTime(TIME_OPTIONS[0]);
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

    const toggleRowSelection = (id: string) => {
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

    const headers = [
        { key: 'select', header: '' },
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
                        <Button kind="tertiary" renderIcon={Export} disabled>
                            Export
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
                <DataTableSkeleton
                    columnCount={headers.length}
                    rowCount={5}
                    showHeader
                    showToolbar
                />
            </div>
        );
    }

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
                    <Button kind="tertiary" renderIcon={Export} onClick={handleExport}>
                        Export
                    </Button>
                    <Button kind="primary" renderIcon={Checkmark} onClick={handleAcknowledgeAll}>
                        Acknowledge All
                    </Button>
                </div>
            </div>

            {/* KPI Tiles - Using unified KPICard component */}
            <div className="kpi-row">
                {kpiData.map((kpi) => (
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
                    items={SEVERITY_OPTIONS}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={selectedSeverity}
                    onChange={({ selectedItem }) => {
                        setSelectedSeverity(selectedItem || SEVERITY_OPTIONS[0]);
                        setCurrentPage(1);
                    }}
                    size="lg"
                />
                <Dropdown
                    id="status-filter"
                    label="Status"
                    titleText=""
                    items={STATUS_OPTIONS}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={selectedStatus}
                    onChange={({ selectedItem }) => {
                        setSelectedStatus(selectedItem || STATUS_OPTIONS[0]);
                        setCurrentPage(1);
                    }}
                    size="lg"
                />
                <Dropdown
                    id="time-filter"
                    label="Time Period"
                    titleText=""
                    items={TIME_OPTIONS}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={selectedTime}
                    onChange={({ selectedItem }) => {
                        setSelectedTime(selectedItem || TIME_OPTIONS[0]);
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

            {/* Alerts Table */}
            <div className="alerts-table-container">
                <DataTable rows={paginatedAlerts} headers={headers}>
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
                                            <TableRow {...getRowProps({ row })} key={row.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        id={`select-${row.id}`}
                                                        labelText=""
                                                        checked={selectedRows.has(row.id)}
                                                        onChange={() => toggleRowSelection(row.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {getSeverityTag(alert.severity)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="timestamp-cell">
                                                        <div className="timestamp-relative">{alert.timestamp.relative}</div>
                                                        <div className="timestamp-absolute">{alert.timestamp.absolute}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="device-cell">
                                                        {getDeviceIcon(alert.device.icon)}
                                                        <div className="device-info">
                                                            <div className="device-name">{alert.device.name}</div>
                                                            <div className="device-ip">{alert.device.ip}</div>
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
                                                <TableCell>
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
            </div>

            {/* Pagination */}
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
        </div>
    );
}

export default PriorityAlertsPage;
