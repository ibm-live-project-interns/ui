import { useState, useEffect, useMemo } from 'react';
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
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
    Button,
    ProgressBar,
    SkeletonText,
    SkeletonPlaceholder,
    DataTableSkeleton,
} from '@carbon/react';
import {
    Notification,
    CheckmarkFilled,
    Export,
    View,
    Checkmark,
    IbmWatsonxCodeAssistant,
} from '@carbon/icons-react';
import { ChartWrapper } from '@/components/shared/ChartWrapper';
import { StackedAreaChart, DonutChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import '@/styles/DashboardPage.scss';
import '@/styles/KPICard.scss';

// Consolidated constants and services
import {
    SEVERITY_CONFIG,
    getSeverityTag,
    getStatusTag,
    getDeviceIcon,
    createAreaChartOptions,
    createDonutChartOptions,
} from '@/constants';
import { alertDataService } from '@/services';
import type { SummaryAlert, NoisyDevice, AIMetric } from '@/constants';

// Reusable components
import { NoisyDevicesCard, KPICard } from '@/components';
import type { KPICardData } from '@/components';

export function DashboardPage() {
    const navigate = useNavigate();
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<'24h' | '7d' | '30d'>('24h');
    const [currentTheme, setCurrentTheme] = useState('g100');
    const [isLoading, setIsLoading] = useState(true);

    // Data State
    const [kpiData, setKpiData] = useState<KPICardData[]>([]);
    const [alertsOverTimeData, setAlertsOverTimeData] = useState<any[]>([]);
    const [severityDist, setSeverityDist] = useState<any[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<SummaryAlert[]>([]);
    const [noisyDevices, setNoisyDevices] = useState<NoisyDevice[]>([]);
    const [aiMetrics, setAiMetrics] = useState<AIMetric[]>([]);

    // Action Handlers
    const handleViewAlert = (alertId: string) => {
        navigate(`/alerts/${alertId}`);
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            await alertDataService.acknowledgeAlert(alertId);
            // Refresh alerts after acknowledging
            const updatedAlerts = await alertDataService.getNocAlerts();
            setRecentAlerts(updatedAlerts);
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
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

    // Theme detection
    useEffect(() => {
        const detectTheme = () => {
            const themeSetting = document.documentElement.getAttribute('data-theme-setting');
            if (themeSetting === 'light') setCurrentTheme('white');
            else if (themeSetting === 'dark') setCurrentTheme('g100');
            else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setCurrentTheme(prefersDark ? 'g100' : 'white');
            }
        };
        detectTheme();
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
        return () => observer.disconnect();
    }, []);

    // Fetch All Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [summary, overTime, severity, alerts, devices, metrics] = await Promise.all([
                    alertDataService.getAlertsSummary(),
                    alertDataService.getAlertsOverTime(selectedTimePeriod),
                    alertDataService.getSeverityDistribution(),
                    alertDataService.getNocAlerts(), // This is the list for table
                    alertDataService.getNoisyDevices(),
                    alertDataService.getAIMetrics()
                ]);

                // Transform Summary to KPIs
                const kpis: KPICardData[] = [
                    {
                        id: 'total-alerts',
                        label: 'Last 24h',
                        value: summary.activeCount.toString(), // Approximating active as total for now
                        subtitle: 'Total Alerts',
                        footnote: 'Active alerts currently in system',
                        IconComponent: Notification,
                        color: 'blue',
                        borderColor: 'blue',
                        trend: { sentiment: 'neutral', direction: 'flat', value: 'Stable' }
                    },
                    {
                        id: 'critical-alerts',
                        label: 'Critical',
                        value: summary.criticalCount,
                        subtitle: 'Critical Alerts',
                        footnote: 'Requires immediate attention',
                        IconComponent: SEVERITY_CONFIG.critical.icon,
                        color: 'red',
                        borderColor: 'red',
                        trend: { sentiment: 'negative', direction: 'up', value: 'High' }
                    },
                    {
                        id: 'major-alerts',
                        label: 'Major',
                        value: summary.majorCount,
                        subtitle: 'Major Alerts',
                        footnote: 'Service impacting',
                        IconComponent: SEVERITY_CONFIG.major.icon,
                        color: 'orange',
                        borderColor: 'orange',
                        trend: { sentiment: 'neutral', direction: 'flat', value: 'Stable' }
                    },
                    {
                        id: 'ai-insights',
                        label: 'AI Insights',
                        value: '98%',
                        subtitle: 'Accuracy',
                        footnote: 'Based on recent correlations',
                        IconComponent: IbmWatsonxCodeAssistant,
                        color: 'purple',
                        borderColor: 'purple',
                        trend: { sentiment: 'positive', direction: 'up', value: '+2%' }
                    }
                ];

                setKpiData(kpis);
                setAlertsOverTimeData(overTime);
                setSeverityDist(severity);
                setRecentAlerts(alerts);
                setNoisyDevices(devices);
                setAiMetrics(metrics);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        // Poll every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [selectedTimePeriod]);


    // Chart options
    const areaChartOptions = useMemo(() => createAreaChartOptions({
        title: 'Alerts Over Time', height: '320px', theme: currentTheme, showTitle: false,
    }), [currentTheme]);

    const donutChartOptions = useMemo(() => createDonutChartOptions({
        title: 'Severity Distribution', height: '300px', theme: currentTheme, showTitle: false,
    }), [currentTheme]);

    // Table headers
    const headers = [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'device', header: 'Device' },
        { key: 'severity', header: 'Severity' },
        { key: 'aiSummary', header: 'AI Summary' },
        { key: 'status', header: 'Status' },
        { key: 'actions', header: 'Actions' },
    ];

    const CriticalIcon = SEVERITY_CONFIG.critical.icon;

    // Skeleton loading state using Carbon skeleton components
    if (isLoading && kpiData.length === 0) {
        return (
            <div className="dashboard-page">
                {/* Header Skeleton */}
                <div className="dashboard-header">
                    <div className="header-left">
                        <SkeletonText heading width="300px" />
                        <SkeletonText width="400px" />
                    </div>
                    <div className="header-right">
                        <SkeletonPlaceholder style={{ width: '150px', height: '32px' }} />
                    </div>
                </div>

                {/* KPI Row Skeleton */}
                <div className="kpi-row">
                    {[1, 2, 3, 4].map((i) => (
                        <Tile key={i} className="kpi-card-skeleton">
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                            <SkeletonText width="80%" />
                        </Tile>
                    ))}
                </div>

                {/* Charts Row Skeleton */}
                <div className="charts-row">
                    <Tile className="chart-tile">
                        <SkeletonText heading width="200px" />
                        <SkeletonPlaceholder style={{ width: '100%', height: '300px', marginTop: '1rem' }} />
                    </Tile>
                    <Tile className="chart-tile">
                        <SkeletonText heading width="200px" />
                        <SkeletonPlaceholder style={{ width: '100%', height: '300px', marginTop: '1rem' }} />
                    </Tile>
                </div>

                {/* Table Skeleton */}
                <DataTableSkeleton
                    columnCount={headers.length}
                    rowCount={5}
                    showHeader
                    showToolbar
                />
            </div>
        );
    }

    // Filter for Critical Ticker (Active Critical Alerts)
    const tickerAlerts = recentAlerts.filter(a => a.severity === 'critical').slice(0, 3);

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
                    {tickerAlerts.length > 0 ? (
                        tickerAlerts.map(alert => (
                            <span className="alert-item" key={alert.id}>
                                <CriticalIcon size={14} className="critical" />
                                {alert.device.name}: {alert.aiSummary || 'Critical Issue Detected'}
                            </span>
                        ))
                    ) : (
                        <span className="alert-item">No active critical alerts</span>
                    )}
                </div>
            </div>

            {/* KPI Stats Row */}
            <div className="kpi-row">
                {kpiData.map((kpi) => (
                    <KPICard key={kpi.id} {...kpi} />
                ))}
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
                        <ChartWrapper
                            ChartComponent={StackedAreaChart}
                            data={alertsOverTimeData}
                            options={areaChartOptions}
                            height="320px"
                        />
                    </div>
                </Tile>
                <Tile className="chart-tile chart-tile--donut">
                    <div className="chart-header">
                        <h3>Severity Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <ChartWrapper
                            ChartComponent={DonutChart}
                            data={severityDist}
                            options={donutChartOptions}
                            height="300px"
                        />
                    </div>
                </Tile>
            </div>

            {/* Priority Alerts Table */}
            <Tile className="table-tile">
                <DataTable rows={recentAlerts} headers={headers}>
                    {({ rows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                        <TableContainer title="Priority Alerts">
                            <TableToolbar>
                                <TableToolbarContent>
                                    <TableToolbarSearch
                                        onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)}
                                        placeholder="Search alerts..."
                                    />
                                    <Button
                                        kind="tertiary"
                                        size="sm"
                                        renderIcon={Export}
                                        onClick={handleExport}
                                    >
                                        Export
                                    </Button>
                                </TableToolbarContent>
                            </TableToolbar>
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
                                        const alert = recentAlerts.find((a) => a.id === row.id);
                                        if (!alert) return null;
                                        return (
                                            <TableRow {...getRowProps({ row })} key={row.id}>
                                                <TableCell>{typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp.absolute}</TableCell>
                                                <TableCell>
                                                    <div className="device-cell">
                                                        {getDeviceIcon(alert.device?.icon || 'server')}
                                                        <span>{alert.device?.name || 'Unknown'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="severity-cell">
                                                        {getSeverityTag(alert.severity)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{alert.aiSummary}</TableCell>
                                                <TableCell>{getStatusTag(alert.status)}</TableCell>
                                                <TableCell>
                                                    <div className="action-btns">
                                                        <Button
                                                            kind="ghost"
                                                            size="sm"
                                                            renderIcon={View}
                                                            hasIconOnly
                                                            iconDescription="View"
                                                            onClick={() => handleViewAlert(alert.id)}
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
            </Tile>

            {/* Bottom Row */}
            <div className="bottom-row">
                <NoisyDevicesCard
                    title="Top Noisy Devices"
                    devices={noisyDevices}
                    variant="simple"
                />

                <Tile className="bottom-tile">
                    <h3>AI Impact Metrics</h3>
                    <div className="metrics-list">
                        {aiMetrics.map((metric, idx) => (
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
