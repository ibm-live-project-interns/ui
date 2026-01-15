import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Tile, DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
    TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
    Button, ProgressBar, SkeletonText, SkeletonPlaceholder, DataTableSkeleton
} from '@carbon/react';
import {
    Notification, CheckmarkFilled, Export, View, Checkmark, IbmWatsonxCodeAssistant
} from '@carbon/icons-react';
import { ChartWrapper } from '@/components/shared/ChartWrapper';
import { StackedAreaChart, DonutChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import '@/styles/DashboardPage.scss';
import '@/styles/KPICard.scss';

import {
    SEVERITY_CONFIG, getSeverityTag, getStatusTag, getDeviceIcon,
    createAreaChartOptions, createDonutChartOptions
} from '@/constants';
import { alertDataService } from '@/services';
import type { SummaryAlert, NoisyDevice, AIMetric } from '@/constants';
import { NoisyDevicesCard, KPICard } from '@/components';
import type { KPICardData } from '@/components';

export function DashboardPage() {
    const navigate = useNavigate();
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<'24h' | '7d' | '30d'>('24h');
    const [currentTheme, setCurrentTheme] = useState('g100');
    const [isLoading, setIsLoading] = useState(true);
    const [currentTickerIndex, setCurrentTickerIndex] = useState(0);

    const handleViewAlert = useCallback((alertId: string) => {
        navigate(`/alerts/${alertId}`);
    }, [navigate]);

    const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
        try {
            await alertDataService.acknowledgeAlert(alertId);
            const updatedAlerts = await alertDataService.getNocAlerts();
            setRecentAlerts(updatedAlerts);
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    }, []);

    const handleExport = useCallback(async () => {
        try {
            await alertDataService.exportReport('csv');
            console.log('Export completed successfully');
        } catch (error) {
            console.error('Failed to export report:', error);
        }
    }, []);

    const [kpiData, setKpiData] = useState<KPICardData[]>([]);
    const [alertsOverTimeData, setAlertsOverTimeData] = useState<any[]>([]);
    const [severityDist, setSeverityDist] = useState<any[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<SummaryAlert[]>([]);
    const [noisyDevices, setNoisyDevices] = useState<NoisyDevice[]>([]);
    const [aiMetrics, setAiMetrics] = useState<AIMetric[]>([]);

    useEffect(() => {
        const detectTheme = () => {
            try {
                const themeSetting = document.documentElement.getAttribute('data-theme-setting');
                if (themeSetting === 'light') setCurrentTheme('white');
                else if (themeSetting === 'dark') setCurrentTheme('g100');
                else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    setCurrentTheme(prefersDark ? 'g100' : 'white');
                }
            } catch {}
        };
        detectTheme();
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
        return () => observer.disconnect();
    }, []);

    // Data fetching with proper cleanup
    useEffect(() => {
        let cancelled = false;
        let interval: ReturnType<typeof setInterval>;

        const fetchData = async () => {
            if (cancelled) return;
            try {
                setIsLoading(true);
                const [
                    summary = { activeCount: 0, criticalCount: 0, majorCount: 0 },
                    overTime = [],
                    severity = [],
                    alerts = [],
                    devices = [],
                    metrics = []
                ] = await Promise.allSettled([
                    alertDataService.getAlertsSummary(),
                    alertDataService.getAlertsOverTime(selectedTimePeriod),
                    alertDataService.getSeverityDistribution(),
                    alertDataService.getNocAlerts(),
                    alertDataService.getNoisyDevices(),
                    alertDataService.getAIMetrics()
                ]).then(results =>
                    results.map((result: any) =>
                        result.status === 'fulfilled' ? result.value : null
                    )
                );

                if (cancelled) return;

                const kpis: KPICardData[] = [
                    {
                        id: 'total-alerts', label: 'Last 24h', value: (summary?.activeCount || 0).toString(),
                        subtitle: 'Total Alerts', footnote: 'Active alerts currently in system',
                        IconComponent: Notification, color: 'blue', borderColor: 'blue',
                        trend: { sentiment: 'neutral', direction: 'flat', value: 'Stable' }
                    },
                    {
                        id: 'critical-alerts', label: 'Critical', value: summary?.criticalCount || 0,
                        subtitle: 'Critical Alerts', footnote: 'Requires immediate attention',
                        IconComponent: SEVERITY_CONFIG.critical?.icon || Notification,
                        color: 'red', borderColor: 'red',
                        trend: { sentiment: 'negative', direction: 'up', value: 'High' }
                    },
                    {
                        id: 'major-alerts', label: 'Major', value: summary?.majorCount || 0,
                        subtitle: 'Major Alerts', footnote: 'Service impacting',
                        IconComponent: SEVERITY_CONFIG.major?.icon || Notification,
                        color: 'orange', borderColor: 'orange',
                        trend: { sentiment: 'neutral', direction: 'flat', value: 'Stable' }
                    },
                    {
                        id: 'ai-insights', label: 'AI Insights', value: '98%',
                        subtitle: 'Accuracy', footnote: 'Based on recent correlations',
                        IconComponent: IbmWatsonxCodeAssistant, color: 'purple', borderColor: 'purple',
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
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchData();
        interval = setInterval(fetchData, 30000);
        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
        };
    }, [selectedTimePeriod]);

    const tickerAlerts = useMemo(() =>
        recentAlerts.filter(a => a.severity === 'critical').slice(0, 5),
        [recentAlerts]
    );

    useEffect(() => {
        if (tickerAlerts.length <= 1) {
            setCurrentTickerIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setCurrentTickerIndex((prev) => (prev + 1) % tickerAlerts.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tickerAlerts.length]);

    const areaChartOptions = useMemo(() =>
        createAreaChartOptions({ title: 'Alerts Over Time', height: '320px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    const donutChartOptions = useMemo(() =>
        createDonutChartOptions({ title: 'Severity Distribution', height: '300px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    const headers = [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'device', header: 'Device' },
        { key: 'severity', header: 'Severity' },
        { key: 'aiSummary', header: 'AI Summary' },
        { key: 'status', header: 'Status' },
        { key: 'actions', header: 'Actions' },
    ];

    const CriticalIcon = SEVERITY_CONFIG.critical?.icon || Notification;

    if (isLoading && kpiData.length === 0) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-header">
                    <div className="header-left">
                        <SkeletonText heading width="300px" />
                        <SkeletonText width="400px" />
                    </div>
                    <div className="header-right">
                        <SkeletonPlaceholder style={{ width: '150px', height: '32px' }} />
                    </div>
                </div>
                <div className="kpi-row">
                    {[1, 2, 3, 4].map((i) => (
                        <Tile key={i} className="kpi-card-skeleton">
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                            <SkeletonText width="80%" />
                        </Tile>
                    ))}
                </div>
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
                <DataTableSkeleton columnCount={headers.length} rowCount={5} showHeader showToolbar />
            </div>
        );
    }

    const currentAlert = tickerAlerts[currentTickerIndex];

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">Network Operations Center</h1>
                    <p className="dashboard-subtitle">Real-time monitoring and AI-powered alert analysis</p>
             li   </div>
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
                        <span className="ticker-title">Critical Alert</span>
                        <span className="ticker-subtitle">Live updates • Click to view</span>
                    </div>
                </div>
                <div className="ticker-alerts">
                    {tickerAlerts.length > 0 && currentAlert ? (
                        <div
                            key={currentTickerIndex}
                            className="alert-item-animated"
                            onClick={() => navigate(`/alerts/${currentAlert.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navigate(`/alerts/${currentAlert.id}`);
                                }
                            }}
                            title="Click to view alert details"
                        >
                            <div className="alert-content">
                                <CriticalIcon size={16} className="critical-icon" />
                                <div className="alert-text">
                                    <span className="alert-device">{currentAlert.device?.name || 'Unknown'}</span>
                                    <span className="alert-separator">:</span>
                                    <span className="alert-message">
                                        {currentAlert.aiSummary || 'Critical Issue Detected'}
                                    </span>
                                </div>
                            </div>
                            {tickerAlerts.length > 1 && (
                                <div className="ticker-indicator">
                                    {tickerAlerts.map((_, index) => (
                                        <span
                                            key={index}
                                            className={`indicator-dot ${index === currentTickerIndex ? 'active' : ''}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="alert-item-no-alerts">
                            <CheckmarkFilled size={16} className="check-icon" />
                            No active critical alerts
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-row">
                {kpiData.map((kpi) => <KPICard key={kpi.id} {...kpi} />)}
            </div>

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

            <Tile className="table-tile">
                <DataTable rows={recentAlerts} headers={headers}>
                    {({ rows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                        <TableContainer title="Priority Alerts">
                            <TableToolbar>
                                <TableToolbarContent>
                                    <TableToolbarSearch
                                        onChange={(e) => onInputChange(e as any)}
                                        placeholder="Search alerts..."
                                    />
                                    <Button kind="tertiary" size="sm" renderIcon={Export} onClick={handleExport}>
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
                                                <TableCell>{typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.absolute || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="device-cell">
                                                        {getDeviceIcon(alert.device?.icon || 'server')}
                                                        <span>{alert.device?.name || 'Unknown'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getSeverityTag(alert.severity)}</TableCell>
                                                <TableCell>{alert.aiSummary || 'No summary'}</TableCell>
                                                <TableCell>{getStatusTag(alert.status)}</TableCell>
                                                <TableCell>
                                                    <div className="action-btns">
                                                        <Button
                                                            kind="ghost" size="sm" renderIcon={View}
                                                            hasIconOnly iconDescription="View"
                                                            onClick={() => handleViewAlert(alert.id)}
                                                        />
                                                        <Button
                                                            kind="ghost" size="sm" renderIcon={Checkmark}
                                                            hasIconOnly iconDescription="Acknowledge"
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

            <div className="bottom-row">
                <NoisyDevicesCard title="Top Noisy Devices" devices={noisyDevices} variant="simple" />
                <Tile className="bottom-tile">
                    <h3>AI Impact Metrics</h3>
                    <div className="metrics-list">
                        {aiMetrics.map((metric, idx) => (
                            <div key={idx} className="metric-row">
                                <div className="metric-left">
                                    <div className="metric-name">{metric.name}</div>
                                    <ProgressBar
                                        label={metric.name}
                                        value={metric.value || 0}
                                        max={100}
                                        hideLabel
                                        size="small"
                                        status={metric.trend === 'positive' ? 'active' : 'error'}
                                    />
                                </div>
                                <div className={`metric-change ${metric.trend}`}>
                                    {metric.change || '0%'}
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
