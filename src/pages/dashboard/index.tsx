import { useState, useEffect, useMemo } from 'react';
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
    ProgressBar,
} from '@carbon/react';
import {
    Notification,
    ArrowUp,
    ArrowDown,
    CheckmarkFilled,
    Filter,
    Export,
    View,
    Checkmark,
} from '@carbon/icons-react';
import { StackedAreaChart, DonutChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import '@/styles/DashboardPage.scss';

// All from consolidated constants
import {
    SEVERITY_CONFIG,
    getSeverityTag,
    getStatusTag,
    getDeviceIcon,
    getSeverityBackgroundClass,
    createAreaChartOptions,
    createDonutChartOptions,
} from '@/constants';

// Mock data
import {
    MOCK_NOC_ALERTS,
    MOCK_SEVERITY_DISTRIBUTION,
    MOCK_TOP_NOISY_DEVICES,
    MOCK_AI_IMPACT_METRICS,
    ALERTS_OVER_TIME,
} from '@/__mocks__/alerts.mock';

export function DashboardPage() {
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<'24h' | '7d' | '30d'>('24h');
    const [currentTheme, setCurrentTheme] = useState('g100');

    // Detect theme from document root
    useEffect(() => {
        const detectTheme = () => {
            const themeSetting = document.documentElement.getAttribute('data-theme-setting');
            if (themeSetting === 'light') {
                setCurrentTheme('white');
            } else if (themeSetting === 'dark') {
                setCurrentTheme('g100');
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setCurrentTheme(prefersDark ? 'g100' : 'white');
            }
        };

        detectTheme();
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme-setting']
        });
        return () => observer.disconnect();
    }, []);


    // Get alerts data based on selected time period
    const alertsOverTimeData = useMemo(
        () => ALERTS_OVER_TIME[selectedTimePeriod],
        [selectedTimePeriod]
    );

    // Chart options
    const areaChartOptions = useMemo(
        () => createAreaChartOptions({
            title: 'Alerts Over Time',
            height: '320px',
            theme: currentTheme,
            showTitle: false,
        }),
        [currentTheme]
    );

    const donutChartOptions = useMemo(
        () => createDonutChartOptions({
            title: 'Severity Distribution',
            height: '300px',
            theme: currentTheme,
            showTitle: false,
        }),
        [currentTheme]
    );

    // Table headers
    const headers = [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'device', header: 'Device' },
        { key: 'severity', header: 'Severity' },
        { key: 'aiSummary', header: 'AI Summary' },
        { key: 'status', header: 'Status' },
        { key: 'actions', header: 'Actions' },
    ];

    // Get icon components from config
    const CriticalIcon = SEVERITY_CONFIG.critical.icon;
    const MajorIcon = SEVERITY_CONFIG.major.icon;

    return (
        <div className="dashboard-page">
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">Network Operations Center</h1>
                    <p className="dashboard-subtitle">Real-time monitoring and AI-powered alert analysis</p>
                </div>
                <div className="header-right">
                    <span className="cds--tag cds--tag--green cds--tag--md">
                        <CheckmarkFilled size={16} className="cds--tag__custom-icon" />
                        System Operational
                    </span>
                </div>
            </div>

            {/* Critical Alert Ticker */}
            <div className="critical-alert-ticker">
                <div className="ticker-label">
                    <CriticalIcon size={16} />
                    <div className="ticker-text-group">
                        <span className="ticker-title">Critical Alert Ticker</span>
                        <span className="ticker-subtitle">Live updates from network devices</span>
                    </div>
                </div>
                <div className="ticker-alerts">
                    <span className="alert-item">
                        <CriticalIcon size={14} className="critical" />
                        Core-SW-01: Interface Down
                    </span>
                    <span className="alert-item">
                        <CriticalIcon size={14} className="critical" />
                        FW-DMZ-03: High CPU Usage
                    </span>
                </div>
            </div>

            {/* KPI Stats Row */}
            <div className="kpi-stats-row">
                <Tile className="kpi-stat-tile">
                    <div className="kpi-icon blue">
                        <Notification size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Last 24h</span>
                        <h2 className="kpi-value">1,247</h2>
                        <span className="kpi-title">Total Alerts</span>
                        <span className="kpi-trend positive">
                            <ArrowDown size={14} />
                            12% from yesterday
                        </span>
                    </div>
                </Tile>

                <Tile className="kpi-stat-tile">
                    <div className="kpi-icon red">
                        <CriticalIcon size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Critical</span>
                        <h2 className="kpi-value">12</h2>
                        <span className="kpi-title">Critical Alerts</span>
                        <span className="kpi-trend negative">
                            <ArrowUp size={14} />
                            3 new in last hour
                        </span>
                    </div>
                </Tile>

                <Tile className="kpi-stat-tile">
                    <div className="kpi-icon orange">
                        <MajorIcon size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Major</span>
                        <h2 className="kpi-value">47</h2>
                        <span className="kpi-title">Major Alerts</span>
                        <span className="kpi-trend neutral">— Stable</span>
                    </div>
                </Tile>

                <Tile className="kpi-stat-tile">
                    <div className="kpi-icon green">
                        <CheckmarkFilled size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">MTTR</span>
                        <h2 className="kpi-value">14m</h2>
                        <span className="kpi-title">Mean Time to Resolve</span>
                        <span className="kpi-trend positive">
                            <ArrowDown size={14} />
                            8% improvement
                        </span>
                    </div>
                </Tile>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <Tile className="chart-tile chart-tile--area">
                    <div className="chart-header">
                        <h3>Alerts Over Time</h3>
                        <div className="time-period-buttons">
                            {(['24h', '7d', '30d'] as const).map((period) => (
                                <Button
                                    key={period}
                                    kind={selectedTimePeriod === period ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSelectedTimePeriod(period)}
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="chart-container">
                        <StackedAreaChart
                            data={alertsOverTimeData}
                            options={areaChartOptions}
                        />
                    </div>
                </Tile>
                <Tile className="chart-tile chart-tile--donut">
                    <div className="chart-header">
                        <h3>Severity Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <DonutChart
                            data={MOCK_SEVERITY_DISTRIBUTION}
                            options={donutChartOptions}
                        />
                    </div>
                </Tile>
            </div>

            {/* Priority Alerts Table */}
            <Tile className="table-tile">
                <div className="table-header">
                    <h3>Priority Alerts</h3>
                    <div className="table-actions">
                        <Button kind="tertiary" size="sm" renderIcon={Filter}>
                            Filter
                        </Button>
                        <Button kind="tertiary" size="sm" renderIcon={Export}>
                            Export
                        </Button>
                    </div>
                </div>
                <DataTable rows={MOCK_NOC_ALERTS} headers={headers}>
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
                                        const alert = MOCK_NOC_ALERTS.find((a) => a.id === row.id);
                                        return (
                                            <TableRow {...getRowProps({ row })} key={row.id}>
                                                <TableCell>{alert?.timestamp.absolute}</TableCell>
                                                <TableCell>
                                                    <div className="device-cell">
                                                        {alert && getDeviceIcon(alert.device.icon)}
                                                        <span>{alert?.device.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="severity-cell">
                                                        {alert && getSeverityTag(alert.severity)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{alert?.aiSummary}</TableCell>
                                                <TableCell>{alert && getStatusTag(alert.status)}</TableCell>
                                                <TableCell>
                                                    <div className="action-btns">
                                                        <Button
                                                            kind="ghost"
                                                            size="sm"
                                                            renderIcon={View}
                                                            hasIconOnly
                                                            iconDescription="View"
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
            </Tile>

            {/* Bottom Row */}
            <div className="bottom-row">
                <Tile className="bottom-tile">
                    <h3>Top Noisy Devices</h3>
                    <div className="devices-list">
                        {MOCK_TOP_NOISY_DEVICES.map((item, idx) => (
                            <div key={idx} className="device-row">
                                <div className="device-left">
                                    <div className={getSeverityBackgroundClass(item.severity)}>
                                        {getDeviceIcon(item.device.icon)}
                                    </div>
                                    <div className="device-details">
                                        <div className="device-name">{item.device.name}</div>
                                        <div className="device-model">{item.model}</div>
                                    </div>
                                </div>
                                <div className="device-right">
                                    <div className="alerts-count">{item.alertCount}</div>
                                    <div className="alerts-label">alerts/day</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Tile>

                <Tile className="bottom-tile">
                    <h3>AI Impact Metrics</h3>
                    <div className="metrics-list">
                        {MOCK_AI_IMPACT_METRICS.map((metric, idx) => (
                            <div key={idx} className="metric-row">
                                <div className="metric-left">
                                    <div className="metric-name">{metric.name}</div>
                                    <ProgressBar
                                        label={metric.name}
                                        value={metric.value}
                                        max={100}
                                        hideLabel
                                        size="small"
                                        status={metric.trend === 'positive' ? 'active' : 'error'}
                                    />
                                </div>
                                <div className={`metric-change ${metric.trend}`}>
                                    {metric.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </Tile>
            </div>
        </div>
    );
}

export default DashboardPage;
