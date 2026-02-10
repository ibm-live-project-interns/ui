/**
 * Copyright IBM Corp. 2026
 *
 * Trends & Insights Page
 * Historical analysis and pattern detection powered by AI
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button, Dropdown, Tag, Popover, PopoverContent, SkeletonText, SkeletonPlaceholder } from '@carbon/react';
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
  WarningAlt,
} from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';
import { StackedBarChart, DonutChart, LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import '@carbon/charts-react/styles.css';

// Reusable components
import { KPICard, NoisyDevicesCard, PageHeader, type NoisyDeviceItem } from '@/components/ui';
import type { KPICardProps } from '@/components/ui';

// Services
import { alertDataService } from '@/shared/services';
import type {
  TrendKPI,
  RecurringAlert,
  AlertDistribution,
  AIInsight
} from '@/features/alerts/services/alertService';

// Constants and helpers
import { SEVERITY_CONFIG, getSeverityIcon, SEVERITY_FILTER_OPTIONS, TIME_PERIOD_OPTIONS } from '@/shared/constants/severity';
import type { Severity } from '@/shared/types/common.types';
import type { ChartDataPoint } from '@/shared/types/api.types';
import type { AIMetric } from '@/features/alerts/types';

// Chart Wrapper
import ChartWrapper from '@/components/ui/ChartWrapper';

// Toast
import { useToast } from '@/contexts';

// Styles
import '@/styles/pages/_trends.scss';

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
  trend: {
    label: 'Trend Analysis',
    icon: ChartLineSmooth,
    iconColor: 'var(--cds-link-primary)',
  },
  anomaly: {
    label: 'Anomaly Detected',
    icon: WarningAlt,
    iconColor: 'var(--cds-support-error)',
  },
};

const DEFAULT_INSIGHT_CONFIG: InsightConfig = {
  label: 'Insight',
  icon: Light,
  iconColor: 'var(--cds-text-secondary)',
};

// KPI Icon mapping
const KPI_ICON_MAP: Record<string, CarbonIconType> = {
  'alert-volume': ArrowDown,
  'mttr': Time,
  'recurring-alerts': Repeat,
  'escalation-rate': ArrowUp,
};

// KPI Severity mapping
const KPI_SEVERITY_MAP: Record<string, 'critical' | 'major' | 'minor' | 'info' | 'success' | 'neutral'> = {
  'alert-volume': 'info',
  'mttr': 'success',
  'recurring-alerts': 'info',
  'escalation-rate': 'info',
};

export function TrendsPage() {
  const navigate = useNavigate();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIOD_OPTIONS[2]);
  const [currentTheme, setCurrentTheme] = useState('g100');
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  // Recurring alerts filter state
  const [recurringAlertsSeverityFilter, setRecurringAlertsSeverityFilter] = useState(SEVERITY_FILTER_OPTIONS[0]);
  const [isRecurringFilterOpen, setIsRecurringFilterOpen] = useState(false);

  // Handle AI insight actions
  const handleInsightAction = (insight: AIInsight) => {
    switch (insight.type) {
      case 'pattern':
        navigate('/priority-alerts');
        addToast('info', 'Pattern Analysis', 'Navigating to alerts matching this pattern');
        break;
      case 'optimization':
        navigate('/settings');
        addToast('success', 'Optimization Applied', insight.description);
        break;
      case 'recommendation':
        addToast('success', 'Recommendation Noted', `Action: ${insight.action}`);
        break;
      default:
        addToast('info', 'Action Triggered', insight.action || 'Action triggered');
    }
  };

  // Data State
  const [trendsKPI, setTrendsKPI] = useState<TrendKPI[]>([]);
  const [alertsOverTime, setAlertsOverTime] = useState<ChartDataPoint[]>([]);
  const [recurringAlerts, setRecurringAlerts] = useState<RecurringAlert[]>([]);
  const [detailsDistribution, setDetailsDistribution] = useState<AlertDistribution[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIMetric[]>([]);
  const [noisyDevices, setNoisyDevices] = useState<NoisyDeviceItem[]>([]);
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

        // Transform noisy devices to NoisyDeviceItem format - handle multiple API formats
        const transformedDevices: NoisyDeviceItem[] = (devices || []).map((d: any) => {
          // Handle both nested device object and flat structure
          const deviceName = typeof d.name === 'string' ? d.name
            : d.device?.name || d.device_name || 'Unknown Device';
          const deviceIp = typeof d.ip === 'string' ? d.ip
            : d.device?.ip || '';
          const deviceIcon = (typeof d.icon === 'string' ? d.icon
            : d.device?.icon || 'server') as 'switch' | 'firewall' | 'router' | 'server' | 'wireless';
          const deviceModel = typeof d.model === 'string' ? d.model
            : d.device?.model || '';

          return {
            device: {
              name: deviceName,
              ip: deviceIp,
              icon: deviceIcon,
              model: deviceModel,
            },
            alertCount: d.alertCount || d.alert_count || 0,
            severity: (d.severity || 'minor') as Severity
          };
        });
        setNoisyDevices(transformedDevices);

        setAiInsights(insights || []);
        setAiImpactOverTime(aiOverTime || []);

      } catch (error) {
        console.error("Failed to fetch trends data:", error);
        // Set defaults on error
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

  // Chart options
  const stackedBarOptions = useMemo(
    () => ({
      axes: {
        left: { mapsTo: 'value', stacked: true },
        bottom: { mapsTo: 'hour', scaleType: ScaleTypes.LABELS },
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

  // Transform API data to KPICardProps format
  const kpiCards: KPICardProps[] = useMemo(() => {
    if (!trendsKPI || trendsKPI.length === 0) return [];
    return trendsKPI.map((kpi) => {
      const trendObj = kpi.trend ? {
        direction: (kpi.trend === 'stable' ? 'stable' : kpi.trend) as 'up' | 'down' | 'stable',
        value: kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '—',
        isPositive: kpi.trend === 'down', // For alerts, down is usually good
      } : undefined;

      return {
        id: kpi.id,
        label: kpi.label,
        value: kpi.value,
        subtitle: kpi.subtitle || 'Compared to last period',
        icon: KPI_ICON_MAP[kpi.id] || KPI_ICON_MAP['alert-volume'],
        iconColor: '#0f62fe',
        severity: KPI_SEVERITY_MAP[kpi.id] || 'info',
        trend: trendObj,
      };
    });
  }, [trendsKPI]);

  // Process chart data
  const processedAlertsOverTime = useMemo(() => {
    if (!alertsOverTime) return [];
    return alertsOverTime.map(d => ({
      ...d,
      hour: d.date ? new Date(d.date).getHours() + ':00' : '00:00'
    }));
  }, [alertsOverTime]);

  // Filter recurring alerts by severity
  const filteredRecurringAlerts = useMemo(() => {
    if (!recurringAlerts || recurringAlerts.length === 0) return [];
    if (recurringAlertsSeverityFilter.id === 'all') return recurringAlerts;
    return recurringAlerts.filter(alert => alert.severity === recurringAlertsSeverityFilter.id);
  }, [recurringAlerts, recurringAlertsSeverityFilter]);

  // Compute peak and quietest hours from real alert data
  const { peakHour, quietestHour } = useMemo(() => {
    const fallback = { peakHour: '', quietestHour: '' };

    // Strategy 1: Use alertsOverTime data (has actual timestamps with hour granularity)
    if (alertsOverTime && alertsOverTime.length > 0) {
      const hourCounts = new Map<number, number>();
      for (const point of alertsOverTime) {
        const d = point.date instanceof Date ? point.date : new Date(point.date);
        if (isNaN(d.getTime())) continue;
        const hour = d.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + (point.value || 0));
      }

      if (hourCounts.size > 0) {
        let maxHour = 0, maxCount = -1;
        let minHour = 0, minCount = Infinity;
        for (const [hour, count] of hourCounts) {
          if (count > maxCount) { maxCount = count; maxHour = hour; }
          if (count < minCount) { minCount = count; minHour = hour; }
        }
        const fmt = (h: number) => `${String(h).padStart(2, '0')}:00 - ${String((h + 1) % 24).padStart(2, '0')}:00`;
        return { peakHour: fmt(maxHour), quietestHour: fmt(minHour) };
      }
    }

    // Strategy 2: Fall back to detailsDistribution (time-of-day buckets)
    if (detailsDistribution && detailsDistribution.length > 0) {
      let peakGroup = detailsDistribution[0];
      let quietGroup = detailsDistribution[0];
      for (const item of detailsDistribution) {
        if (item.value > peakGroup.value) peakGroup = item;
        if (item.value < quietGroup.value) quietGroup = item;
      }
      return { peakHour: peakGroup.group, quietestHour: quietGroup.group };
    }

    return fallback;
  }, [alertsOverTime, detailsDistribution]);

  // Skeleton loading state
  if (isLoading && trendsKPI.length === 0) {
    return (
      <div className="trends-insights-page">
        <PageHeader
          title="Trends & Insights"
          subtitle="Loading..."
          badges={[{ text: 'System Operational', color: '#24a148' }]}
        />
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i} className="kpi-card-skeleton">
              <SkeletonText width="60%" />
              <SkeletonText heading width="40%" />
              <SkeletonText width="80%" />
            </Tile>
          ))}
        </div>
        <Tile className="alerts-chart-tile">
          <SkeletonPlaceholder style={{ width: '100%', height: '400px' }} />
        </Tile>
      </div>
    );
  }

  // Empty state
  const isEmptyPage = trendsKPI.length === 0 && alertsOverTime.length === 0 && recurringAlerts.length === 0;

  if (!isLoading && isEmptyPage) {
    return (
      <div className="trends-insights-page">
        <PageHeader
          title="Trends & Insights"
          subtitle="Historical analysis and pattern detection powered by AI"
          badges={[{ text: 'System Operational', color: '#24a148' }]}
        />
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
          <h3>No trends data available</h3>
          <p>Unable to retrieve insights at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trends-insights-page">
      {/* Dashboard Header */}
      <PageHeader
        title="Trends & Insights"
        subtitle="Historical analysis and pattern detection powered by AI"
        badges={[{ text: 'System Operational', color: '#24a148' }]}
        rightContent={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              size="md"
            />
            <Button kind="primary" size="md" renderIcon={Download} onClick={() => alertDataService.exportReport('pdf')}>
              Export Report
            </Button>
          </div>
        }
      />

      {/* KPI Stats Row */}
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
              filteredRecurringAlerts.map((alert) => {
                const severity = (alert.severity || 'info') as Severity;
                return (
                  <div key={alert.id} className="recurring-alert-row">
                    <div className={`alert-severity-icon ${severity}`}>
                      {getSeverityIcon(severity, 20)}
                    </div>
                    <div className="alert-info">
                      <div className="alert-name-row">
                        <span
                          className="alert-name"
                          style={{ cursor: 'pointer', color: 'var(--cds-link-primary)' }}
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(`/alerts?search=${encodeURIComponent(alert.name)}`)}
                          onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/alerts?search=${encodeURIComponent(alert.name)}`); }}
                        >
                          {alert.name}
                        </span>
                        <span className="alert-count">{alert.count} occurrences</span>
                      </div>
                      <div className="alert-resolution">
                        Avg resolution: <span className="resolution-time">{alert.avgResolution}</span>
                      </div>
                    </div>
                    <div className="alert-progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${alert.percentage}%`,
                          backgroundColor: SEVERITY_CONFIG[severity]?.color || '#0f62fe',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              }))
            }
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
          {(peakHour || quietestHour) && (
            <div className="time-highlights">
              {peakHour && (
                <div className="time-card">
                  <span className="time-label">Peak Hour</span>
                  <span className="time-value">{peakHour}</span>
                </div>
              )}
              {quietestHour && (
                <div className="time-card">
                  <span className="time-label">Quietest Hour</span>
                  <span className="time-value">{quietestHour}</span>
                </div>
              )}
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
              <div key={metric.label} className="metric-card positive">
                <span className="metric-label">{metric.label}</span>
                <span className="metric-value">
                  {metric.id === 'ai-accuracy'
                    ? `${metric.value}%`
                    : metric.value}
                </span>
                {metric.description && (
                  <span className="metric-description" style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                    {metric.description}
                  </span>
                )}
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
          onViewAll={() => navigate('/devices')}
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

        <div className="ai-insights-grid">
          {(!aiInsights || aiInsights.length === 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--cds-text-secondary)' }}>
              No new AI insights available at this time.
            </div>
          ) : (
            aiInsights.map((insight) => {
              const config = INSIGHT_CONFIG[insight.type] || DEFAULT_INSIGHT_CONFIG;
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

export default TrendsPage;
