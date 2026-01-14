import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button, Dropdown, Tag, ToastNotification, Popover, PopoverContent, SkeletonText, SkeletonPlaceholder } from '@carbon/react';
import {
    Download,
    Filter,
    IbmWatsonxCodeAssistant,
    ArrowRight,
    ChartLineSmooth,
    Light,
    Checkmark,
    ArrowDown,
    Time,
    Repeat,
    ArrowUp,
} from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';
import { StackedBarChart, DonutChart, LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import '@carbon/charts-react/styles.css';
import '@/styles/TrendsAndInsightsPage.scss';

// Reusable components
import { KPICard, NoisyDevicesCard } from '@/components';
import type { KPICardData } from '@/components';

// Services
import { alertDataService } from '@/services';
import type {
    TrendKPI,
    RecurringAlert,
    AlertDistribution,
    AIInsight
} from '@/services/AlertDataService';

// Constants and helpers
import {
    SEVERITY_CONFIG,
    getSeverityIcon,
    type Severity,
    type ChartDataPoint,
    type NoisyDevice,
    type AIMetric
} from '@/constants';

// Chart Wrapper
import { ChartWrapper } from '@/components/shared/ChartWrapper';

const TIME_PERIOD_OPTIONS = [
    { id: '24h', text: 'Last 24 Hours' },
    { id: '7d', text: 'Last 7 Days' },
    { id: '30d', text: 'Last 30 Days' },
    { id: '90d', text: 'Last 90 Days' },
];

// Severity filter options for recurring alerts
const SEVERITY_FILTER_OPTIONS = [
    { id: 'all', text: 'All Severities' },
    { id: 'critical', text: 'Critical' },
    { id: 'major', text: 'Major' },
    { id: 'minor', text: 'Minor' },
    { id: 'info', text: 'Info' },
];

// AI Insights Configuration
interface InsightConfig {
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    iconColor: string;
}

const INSIGHT_CONFIG: Record<string, InsightConfig> = {
    pattern: {
        label: 'Pattern Detected',
        icon: ChartLineSmooth,
        iconColor: 'var(--cds-link-primary)',
    },
    optimization: {
        label: 'Optimization',
        icon: Checkmark,
        iconColor: 'var(--cds-support-success)',
    },
    recommendation: {
        label: 'Recommendation',
        icon: Light,
        iconColor: 'var(--cds-support-warning)',
    },
};

// KPI Icon mapping
const KPI_ICON_MAP: Record<string, CarbonIconType> = {
    'alert-volume': ArrowDown,
    'mttr': Time,
    'recurring-alerts': Repeat,
    'escalation-rate': ArrowUp,
};

// KPI Color mapping
const KPI_COLOR_MAP: Record<string, 'blue' | 'green' | 'purple' | 'teal'> = {
    'alert-volume': 'blue',
    'mttr': 'green',
    'recurring-alerts': 'purple',
    'escalation-rate': 'teal',
};

export function TrendsAndInsightsPage() {
    const navigate = useNavigate();
    const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIOD_OPTIONS[2]);
    const [currentTheme, setCurrentTheme] = useState('g100');
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<{ id: string; kind: 'success' | 'info'; title: string; subtitle: string }[]>([]);
    
    // Recurring alerts filter state
    const [recurringAlertsSeverityFilter, setRecurringAlertsSeverityFilter] = useState(SEVERITY_FILTER_OPTIONS[0]);
    const [isRecurringFilterOpen, setIsRecurringFilterOpen] = useState(false);

    // Toast helper
    const addToast = (kind: 'success' | 'info', title: string, subtitle: string) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, kind, title, subtitle }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    // Handle AI insight actions
    const handleInsightAction = (insight: AIInsight) => {
        switch (insight.type) {
            case 'pattern':
                // Navigate to priority alerts filtered by the pattern
                navigate('/priority-alerts');
                addToast('info', 'Pattern Analysis', 'Navigating to alerts matching this pattern');
                break;
            case 'optimization':
                // Navigate to settings or show optimization details
                navigate('/settings');
                addToast('success', 'Optimization Applied', insight.description);
                break;
            case 'recommendation':
                // Show recommendation details and mark as acknowledged
                addToast('success', 'Recommendation Noted', `Action: ${insight.action}`);
                break;
            default:
                addToast('info', 'Action Triggered', insight.action);
        }
    };

    // Data State
    const [trendsKPI, setTrendsKPI] = useState<TrendKPI[]>([]);
    const [alertsOverTime, setAlertsOverTime] = useState<ChartDataPoint[]>([]);
    const [recurringAlerts, setRecurringAlerts] = useState<RecurringAlert[]>([]);
    const [detailsDistribution, setDetailsDistribution] = useState<AlertDistribution[]>([]);
    const [aiMetrics, setAiMetrics] = useState<AIMetric[]>([]); // Initialize as empty array
    const [noisyDevices, setNoisyDevices] = useState<NoisyDevice[]>([]);
    const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
    const [aiImpactOverTime, setAiImpactOverTime] = useState<ChartDataPoint[]>([]);

    // Detect theme
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
            attributeFilter: ['data-theme-setting'],
        });

        return () => observer.disconnect();
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const timePeriod = selectedTimePeriod.id as '24h' | '7d' | '30d' | '90d';
                const [
                    kpis,
                    overTime,
                    recurring,
                    distribution,
                    metrics,
                    devices,
                    insights,
                    aiOverTime
                ] = await Promise.all([
                    alertDataService.getTrendsKPI(),
                    alertDataService.getAlertsOverTime(timePeriod),
                    alertDataService.getRecurringAlerts(),
                    alertDataService.getAlertDistributionTime(),
                    alertDataService.getAIMetrics(),
                    alertDataService.getNoisyDevices(),
                    alertDataService.getAIInsights(),
                    alertDataService.getAIImpactOverTime()
                ]);

                setTrendsKPI(kpis || []);
                setAlertsOverTime(overTime || []);
                setRecurringAlerts(recurring || []);
                setDetailsDistribution(distribution || []);
                setAiMetrics(metrics || []);
                setNoisyDevices(devices || []);
                setAiInsights(insights || []);
                setAiImpactOverTime(aiOverTime || []);

            } catch (error) {
                console.error("Failed to fetch trends data:", error);
                // Set defaults on error to avoid undefined
                setTrendsKPI([]);
                setAlertsOverTime([]);
                setRecurringAlerts([]);
                setDetailsDistribution([]);
                setAiMetrics([]);
                setNoisyDevices([]);
                setAiInsights([]);
                setAiImpactOverTime([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [selectedTimePeriod]);

    // Chart options (titles removed for ChartWrapper usage)
    const stackedBarOptions = useMemo(
        () => ({
            axes: {
                left: { mapsTo: 'value', stacked: true },
                bottom: { mapsTo: 'hour', scaleType: ScaleTypes.LABELS }, // Ensure 'hour' exists in data or map 'date' to 'hour'
            },
            height: '100%',
            color: {
                scale: {
                    Critical: SEVERITY_CONFIG.critical.color,
                    Major: SEVERITY_CONFIG.major.color,
                    Minor: SEVERITY_CONFIG.minor.color,
                    Info: SEVERITY_CONFIG.info.color,
                },
            },
            theme: currentTheme,
            toolbar: { enabled: false },
            legend: { alignment: 'center' as const, position: 'top' as const },
        }),
        [currentTheme]
    );

    const donutOptions = useMemo(
        () => ({
            resizable: true,
            donut: { center: { label: 'Total' }, alignment: 'center' as const },
            legend: { alignment: 'center' as const, position: 'bottom' as const },
            theme: currentTheme,
            toolbar: { enabled: false },
        }),
        [currentTheme]
    );

    const lineChartOptions = useMemo(
        () => ({
            axes: {
                left: { title: 'Value', mapsTo: 'value', includeZero: false },
                bottom: { title: 'Time', mapsTo: 'date', scaleType: ScaleTypes.TIME },
            },
            height: '100%',
            curve: 'curveMonotoneX' as const,
            theme: currentTheme,
            toolbar: { enabled: false },
            legend: { alignment: 'center' as const },
            points: { enabled: true, radius: 2 },
        }),
        [currentTheme]
    );

    // Transform API data to KPICardData format with all info from reference
    const kpiCards: KPICardData[] = useMemo(() => {
        if (!trendsKPI || trendsKPI.length === 0) return [];
        return trendsKPI.map((kpi) => {
            // Determine subtitle based on KPI ID
            let subtitle = kpi.subtitle || '';
            if (kpi.id === 'alert-volume' && !subtitle) {
                subtitle = 'Compared to last period';
            }

            // Transform string trend to object format expected by KPICard
            const trendObj = kpi.trend ? {
                sentiment: (kpi.trend === 'up' ? 'positive' : kpi.trend === 'down' ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
                direction: (kpi.trend === 'stable' ? 'flat' : kpi.trend) as 'up' | 'down' | 'flat',
                value: kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '—',
            } : undefined;

            return {
                id: kpi.id,
                label: kpi.label,
                value: kpi.value,
                subtitle: subtitle,
                footnote: kpi.subtitle || kpi.label,
                trend: trendObj,
                IconComponent: KPI_ICON_MAP[kpi.id] || KPI_ICON_MAP['alert-volume'],
                color: (KPI_COLOR_MAP[kpi.id] || 'blue') as 'blue' | 'green' | 'purple' | 'teal',
                badge: kpi.tag ? {
                    text: kpi.tag.text,
                    type: kpi.tag.type as 'red' | 'magenta' | 'purple' | 'blue' | 'green' | 'gray',
                } : undefined,
                borderedSeverity: KPI_COLOR_MAP[kpi.id] as 'blue' | 'green' | 'purple' | 'teal',
            };
        });
    }, [trendsKPI]);

    // Process chart data to ensure keys match options
    const processedAlertsOverTime = useMemo(() => {
        if (!alertsOverTime) return [];
        return alertsOverTime.map(d => ({
            ...d,
            hour: d.date ? new Date(d.date).getHours() + ':00' : '00:00' // Ensure 'hour' property for axis
        }));
    }, [alertsOverTime]);

    // Filter recurring alerts by severity
    const filteredRecurringAlerts = useMemo(() => {
        if (!recurringAlerts || recurringAlerts.length === 0) return [];
        if (recurringAlertsSeverityFilter.id === 'all') return recurringAlerts;
        return recurringAlerts.filter(alert => alert.severity === recurringAlertsSeverityFilter.id);
    }, [recurringAlerts, recurringAlertsSeverityFilter]);

    // Skeleton loading state using Carbon skeleton components
    if (isLoading && trendsKPI.length === 0) {
        return (
            <div className="trends-insights-page">
                {/* Header Skeleton */}
                <div className="page-header">
                    <div className="page-header-left">
                        <SkeletonText heading width="200px" />
                        <SkeletonText width="350px" />
                    </div>
                    <div className="page-header-actions">
                        <SkeletonPlaceholder style={{ width: '150px', height: '40px' }} />
                        <SkeletonPlaceholder style={{ width: '130px', height: '40px' }} />
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

                {/* Chart Skeleton */}
                <Tile className="alerts-chart-tile">
                    <div className="chart-header">
                        <div className="chart-title-group">
                            <SkeletonText heading width="250px" />
                            <SkeletonText width="350px" />
                        </div>
                    </div>
                    <SkeletonPlaceholder style={{ width: '100%', height: '400px' }} />
                </Tile>

                {/* Middle Row Skeleton */}
                <div className="middle-row">
                    <Tile className="recurring-alerts-tile">
                        <div className="tile-header">
                            <div>
                                <SkeletonText heading width="200px" />
                                <SkeletonText width="280px" />
                            </div>
                        </div>
                        <div className="recurring-alerts-list">
                            {[1, 2, 3].map((i) => (
                                <div key={i} style={{ marginBottom: '1rem' }}>
                                    <SkeletonText width="100%" />
                                    <SkeletonPlaceholder style={{ width: '100%', height: '8px', marginTop: '0.5rem' }} />
                                </div>
                            ))}
                        </div>
                    </Tile>
                    <Tile className="distribution-tile">
                        <div className="tile-header">
                            <div>
                                <SkeletonText heading width="250px" />
                                <SkeletonText width="200px" />
                            </div>
                        </div>
                        <SkeletonPlaceholder style={{ width: '100%', height: '300px' }} />
                    </Tile>
                </div>

                {/* Bottom Row Skeleton */}
                <div className="bottom-row">
                    <Tile className="ai-impact-tile">
                        <div className="tile-header">
                            <div>
                                <SkeletonText heading width="180px" />
                                <SkeletonText width="250px" />
                            </div>
                        </div>
                        <SkeletonPlaceholder style={{ width: '100%', height: '350px' }} />
                    </Tile>
                    <Tile>
                        <div className="tile-header">
                            <div>
                                <SkeletonText heading width="180px" />
                                <SkeletonText width="220px" />
                            </div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ marginBottom: '1rem' }}>
                                <SkeletonText width="100%" />
                            </div>
                        ))}
                    </Tile>
                </div>
            </div>
        );
    }

    // Generic empty check for page - normally we might want to show partial data
    // but if everything failed, let's show an error/empty state
    const isEmptyPage = trendsKPI.length === 0 && alertsOverTime.length === 0 && recurringAlerts.length === 0;

    if (!isLoading && isEmptyPage) {
        return (
            <div className="trends-insights-page">
                <div className="page-header">
                    <h1 className="page-title">Trends & Insights</h1>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
                    <h3>No trends data available</h3>
                    <p>Unable to retrieve insights at this time.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="trends-insights-page">
            {/* Toast Notifications */}
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}>
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        kind={toast.kind}
                        title={toast.title}
                        subtitle={toast.subtitle}
                        timeout={5000}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Trends & Insights</h1>
                    <p className="page-description">
                        Historical analysis and pattern detection powered by AI
                    </p>
                </div>
                <div className="page-header-actions">
                    <Dropdown
                        id="time-period-dropdown"
                        titleText=""
                        label="Select Time Period"
                        items={TIME_PERIOD_OPTIONS}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={selectedTimePeriod}
                        onChange={({ selectedItem }) =>
                            setSelectedTimePeriod(selectedItem || TIME_PERIOD_OPTIONS[2])
                        }
                        size="lg"
                    />
                    <Button kind="primary" renderIcon={Download} onClick={() => alertDataService.exportReport('pdf')}>
                        Export Report
                    </Button>
                </div>
            </div>

            {/* KPI Stats Row - Using unified KPICard component */}
            <div className="kpi-row">
                {kpiCards.length > 0 ? (
                    kpiCards.map((card) => (
                        <KPICard key={card.id} {...card} />
                    ))
                ) : (
                    <div style={{ padding: '1rem', width: '100%', textAlign: 'center' }}>No KPI Data</div>
                )}
            </div>

            {/* Alerts Per Hour Chart */}
            <Tile className="alerts-chart-tile">
                <div className="chart-header">
                    <div className="chart-title-group">
                        <h3>Alerts Per Hour (Last 24 Hours)</h3>
                        <p className="chart-subtitle">Real-time alert volume tracking with severity breakdown</p>
                    </div>
                </div>
                <div className="chart-container">
                    <ChartWrapper
                        ChartComponent={StackedBarChart}
                        data={processedAlertsOverTime}
                        options={stackedBarOptions}
                        height="400px"
                    />
                </div>
            </Tile>

            {/* Middle Row: Recurring Alerts & Distribution */}
            <div className="middle-row">
                {/* Top Recurring Alert Types */}
                <Tile className="recurring-alerts-tile">
                    <div className="tile-header">
                        <div>
                            <h3>Top Recurring Alert Types</h3>
                            <p className="tile-subtitle">Most frequent network events detected</p>
                        </div>
                        <Popover
                            open={isRecurringFilterOpen}
                            align="bottom-right"
                            caret={false}
                            dropShadow
                            onRequestClose={() => setIsRecurringFilterOpen(false)}
                        >
                            <Button 
                                kind={recurringAlertsSeverityFilter.id !== 'all' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                renderIcon={Filter}
                                onClick={() => setIsRecurringFilterOpen(!isRecurringFilterOpen)}
                            >
                                {recurringAlertsSeverityFilter.id !== 'all' ? recurringAlertsSeverityFilter.text : 'Filter'}
                            </Button>
                            <PopoverContent>
                                <div className="filter-popover-simple">
                                    <div className="filter-popover-simple__header">
                                        <span>Filter by Severity</span>
                                        {recurringAlertsSeverityFilter.id !== 'all' && (
                                            <Button
                                                kind="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setRecurringAlertsSeverityFilter(SEVERITY_FILTER_OPTIONS[0]);
                                                    setIsRecurringFilterOpen(false);
                                                }}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                    <div className="filter-popover-simple__options">
                                        {SEVERITY_FILTER_OPTIONS.map((option) => (
                                            <button
                                                key={option.id}
                                                className={`filter-option ${recurringAlertsSeverityFilter.id === option.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setRecurringAlertsSeverityFilter(option);
                                                    setIsRecurringFilterOpen(false);
                                                }}
                                            >
                                                {option.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="recurring-alerts-list">
                        {(!filteredRecurringAlerts || filteredRecurringAlerts.length === 0) ? (
                            <div style={{ padding: '2rem', color: 'var(--cds-text-secondary)', textAlign: 'center' }}>
                                {recurringAlertsSeverityFilter.id !== 'all' 
                                    ? `No ${recurringAlertsSeverityFilter.text.toLowerCase()} recurring alerts detected.`
                                    : 'No recurring alerts detected in this period.'}
                            </div>
                        ) : (
                            filteredRecurringAlerts.map((alert) => (
                                <div key={alert.id} className="recurring-alert-row">
                                    {/* Severity Icon */}
                                    <div className={`alert-severity-icon ${alert.severity}`}>
                                        {getSeverityIcon(alert.severity as Severity, 20)}
                                    </div>

                                    {/* Alert Info */}
                                    <div className="alert-info">
                                        <div className="alert-name-row">
                                            <span className="alert-name">{alert.name}</span>
                                            <span className="alert-count">{alert.count} occurrences</span>
                                        </div>
                                        <div className="alert-resolution">
                                            Avg resolution: <span className="resolution-time">{alert.avgResolution}</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="alert-progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${alert.percentage}%`,
                                                backgroundColor: SEVERITY_CONFIG[alert.severity as Severity].color,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Tile>

                {/* Alert Distribution by Time of Day */}
                <Tile className="distribution-tile">
                    <div className="tile-header">
                        <div>
                            <h3>Alert Distribution by Time of Day</h3>
                            <p className="tile-subtitle">Peak hours and patterns analysis</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ChartWrapper
                            ChartComponent={DonutChart}
                            data={detailsDistribution}
                            options={donutOptions}
                            height="400px"
                        />
                    </div>
                    {detailsDistribution && detailsDistribution.length > 0 && (
                        <div className="time-highlights">
                            <div className="time-card">
                                <span className="time-label">Peak Hour</span>
                                <span className="time-value">14:00 - 15:00</span>
                            </div>
                            <div className="time-card">
                                <span className="time-label">Quietest Hour</span>
                                <span className="time-value">03:00 - 04:00</span>
                            </div>
                        </div>
                    )}
                </Tile>
            </div>

            {/* AI Impact & Top Noisy Devices */}
            <div className="bottom-row">
                {/* AI Impact Over Time */}
                <Tile className="ai-impact-tile">
                    <div className="tile-header">
                        <div>
                            <h3>AI Impact Over Time</h3>
                            <p className="tile-subtitle">Measuring LLM decoder effectiveness</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ChartWrapper
                            ChartComponent={LineChart}
                            data={aiImpactOverTime}
                            options={lineChartOptions}
                            height="350px"
                        />
                    </div>
                    <div className="impact-metrics">
                        {aiMetrics && aiMetrics.length > 0 ? aiMetrics.map((metric) => (
                            <div key={metric.name} className="metric-card positive">
                                <span className="metric-label">{metric.name}</span>
                                <span className="metric-value">{metric.change}</span>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', width: '100%', color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                                No metrics available
                            </div>
                        )}
                    </div>
                </Tile>

                {/* Top Noisy Devices */}
                <NoisyDevicesCard
                    title="Top Noisy Devices"
                    subtitle="Devices generating most alerts"
                    devices={noisyDevices}
                    variant="gradient"
                    showViewAll
                    onViewAll={() => console.log('View all devices')}
                />
            </div>

            {/* AI-Generated Insights */}
            <Tile className="ai-insights-section">
                <div className="ai-insights-header">
                    <div className="ai-insights-title-group">
                        <div className="ai-insights-icon">
                            <IbmWatsonxCodeAssistant size={24} />
                        </div>
                        <div className="ai-insights-title-content">
                            <h3>AI-Generated Insights</h3>
                            <p className="ai-insights-subtitle">Automated pattern detection and recommendations</p>
                        </div>
                    </div>
                    <Tag type="blue" size="md">Updated 5m ago</Tag>
                </div>

                {/* Cards in 3-column grid */}
                <div className="ai-insights-grid">
                    {(!aiInsights || aiInsights.length === 0) ? (
                        <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--cds-text-secondary)' }}>
                            No new AI insights available at this time.
                        </div>
                    ) : (
                        aiInsights.map((insight) => {
                            const config = INSIGHT_CONFIG[insight.type];
                            const IconComponent = config.icon;
                            return (
                                <div key={insight.id} className="ai-insight-card">
                                    <div className="ai-insight-card-header">
                                        <span style={{ color: config.iconColor, display: 'flex', alignItems: 'center' }}>
                                            <IconComponent size={20} />
                                        </span>
                                        <span className="ai-insight-card-label">{config.label}</span>
                                    </div>
                                    <p className="ai-insight-card-description">{insight.description}</p>
                                    <Button 
                                        kind="ghost" 
                                        size="sm" 
                                        renderIcon={ArrowRight} 
                                        className="ai-insight-card-action"
                                        onClick={() => handleInsightAction(insight)}
                                    >
                                        {insight.action}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </Tile>
        </div>
    );
}

export default TrendsAndInsightsPage;