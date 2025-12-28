import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Tile,
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
} from '@carbon/react';
import {
    Export,
    Checkmark,
    View,
    Filter,
} from '@carbon/icons-react';
import '@/styles/PriorityAlertsPage.scss';

// All from consolidated constants
import {
    SEVERITY_CONFIG,
    getSeverityTag,
    getStatusTag,
    getDeviceIcon,
    type Severity,
} from '@/constants';

// Mock data
import { MOCK_PRIORITY_ALERTS } from '@/__mocks__/alerts.mock';

// KPI data derived from alerts
const getKPIData = () => {
    const counts: Record<Severity, number> = {
        critical: 0,
        major: 0,
        minor: 0,
        info: 0,
    };

    MOCK_PRIORITY_ALERTS.forEach((alert) => {
        counts[alert.severity]++;
    });

    return [
        {
            severity: 'critical' as Severity,
            count: counts.critical,
            label: 'Critical Alerts',
            subtitle: SEVERITY_CONFIG.critical.description,
            icon: SEVERITY_CONFIG.critical.icon,
            color: 'red'
        },
        {
            severity: 'major' as Severity,
            count: counts.major,
            label: 'Major Alerts',
            subtitle: SEVERITY_CONFIG.major.description,
            icon: SEVERITY_CONFIG.major.icon,
            color: 'orange'
        },
        {
            severity: 'minor' as Severity,
            count: counts.minor,
            label: 'Minor Alerts',
            subtitle: SEVERITY_CONFIG.minor.description,
            icon: SEVERITY_CONFIG.minor.icon,
            color: 'yellow'
        },
        {
            severity: 'info' as Severity,
            count: counts.info,
            label: 'Info Alerts',
            subtitle: SEVERITY_CONFIG.info.description,
            icon: SEVERITY_CONFIG.info.icon,
            color: 'green'
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState(STATUS_OPTIONS[0]);
    const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
    const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    const kpiData = useMemo(() => getKPIData(), []);
    const navigate = useNavigate();

    // Filter alerts
    const filteredAlerts = useMemo(() => {
        let result = [...MOCK_PRIORITY_ALERTS];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (alert) =>
                    alert.device.name.toLowerCase().includes(query) ||
                    alert.aiSummary.toLowerCase().includes(query)
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

        return result;
    }, [searchQuery, selectedSeverity, selectedStatus, activeQuickFilters]);

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
    };

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
                    <Button kind="tertiary" renderIcon={Export}>
                        Export
                    </Button>
                    <Button kind="primary" renderIcon={Checkmark}>
                        Acknowledge All
                    </Button>
                </div>
            </div>

            {/* KPI Tiles */}
            <div className="kpi-row">
                {kpiData.map((kpi) => (
                    <Tile key={kpi.severity} className={`kpi-tile kpi-tile--${kpi.color}`}>
                        <div className={`kpi-icon kpi-icon--${kpi.color}`}>
                            <kpi.icon size={24} />
                        </div>
                        <div className="kpi-value">{kpi.count}</div>
                        <div className="kpi-details">
                            <div className="kpi-label">{kpi.label}</div>
                            <div className="kpi-subtitle">{kpi.subtitle}</div>
                        </div>
                    </Tile>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-row">
                <Search
                    size="lg"
                    placeholder="Search alerts..."
                    labelText="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="filters-search"
                />
                <Dropdown
                    id="severity-filter"
                    label="Severity"
                    titleText=""
                    items={SEVERITY_OPTIONS}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={selectedSeverity}
                    onChange={({ selectedItem }) => setSelectedSeverity(selectedItem || SEVERITY_OPTIONS[0])}
                    size="lg"
                />
                <Dropdown
                    id="status-filter"
                    label="Status"
                    titleText=""
                    items={STATUS_OPTIONS}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={selectedStatus}
                    onChange={({ selectedItem }) => setSelectedStatus(selectedItem || STATUS_OPTIONS[0])}
                    size="lg"
                />
                <Dropdown
                    id="time-filter"
                    label="Time Period"
                    titleText=""
                    items={TIME_OPTIONS}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={selectedTime}
                    onChange={({ selectedItem }) => setSelectedTime(selectedItem || TIME_OPTIONS[0])}
                    size="lg"
                />
                <Button kind="ghost" renderIcon={Filter} hasIconOnly iconDescription="More Filters" />
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
