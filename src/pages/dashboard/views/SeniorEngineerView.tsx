/**
 * Senior Engineer Dashboard View
 *
 * Strategic, analytics-focused dashboard for Senior Network Engineers.
 * Provides a high-level architecture health view, performance trend analysis,
 * configuration change impact tracking, and AI-driven alert pattern analysis.
 *
 * Distinct from NOC (operational/real-time) and SRE (reliability/SLO) views
 * by focusing on engineering decision-making: capacity planning, root cause
 * patterns, infrastructure health, and configuration drift.
 *
 * Services:
 * - Device health from deviceService.getDevices() and getDeviceStats()
 * - Alert patterns from alertDataService.getAlertsOverTime()
 * - AI insights from alertDataService.getAIInsights()
 * - Alert trends from alertDataService.getTrendsKPI()
 * - Severity distribution from alertDataService.getSeverityDistribution()
 * - Noisy devices from alertDataService.getNoisyDevices()
 */

import { useState, useEffect, useMemo } from 'react';
import { useThemeDetection } from '@/shared/hooks';
import { useNavigate } from 'react-router-dom';
import {
    Tile, Tag, ProgressBar, SkeletonText, SkeletonPlaceholder, InlineNotification,
} from '@carbon/react';
import {
    IbmWatsonxCodeAssistant, ChartLineSmooth, Analytics, MachineLearning,
    NetworkEnterprise, DataStructured, Settings, WarningAlt,
    CheckmarkFilled, ArrowUp, ArrowDown,
} from '@carbon/icons-react';
import { LineChart, StackedBarChart, DonutChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { KPICard, type KPICardProps, PageHeader, NoisyDevicesCard, type NoisyDeviceItem } from '@/components/ui';
import { createDonutChartOptions } from '@/shared/constants/charts';
import type { RoleConfig } from '@/features/roles/types/role.types';
import { alertDataService, deviceService } from '@/shared/services';
import { uiLogger } from '@/shared/utils/logger';
import type { AIInsight, Device } from '@/shared/types';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';
import '@carbon/charts-react/styles.css';

interface SeniorEngineerViewProps {
    config: RoleConfig;
}

export function SeniorEngineerView({ config: _config }: SeniorEngineerViewProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currentTheme = useThemeDetection();

    // Data states
    const [devices, setDevices] = useState<Device[]>([]);
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [alertPatterns, setAlertPatterns] = useState<any[]>([]);
    const [severityDist, setSeverityDist] = useState<any[]>([]);
    const [noisyDevices, setNoisyDevices] = useState<NoisyDeviceItem[]>([]);
    const [trendsKPI, setTrendsKPI] = useState<any[]>([]);

    // Fetch data from services
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setError(null);

            try {
                const [
                    deviceList,
                    aiInsights,
                    alertsOverTime,
                    severity,
                    noisyDevicesData,
                    trends,
                ] = await Promise.all([
                    deviceService.getDevices().catch(() => []),
                    alertDataService.getAIInsights().catch(() => []),
                    alertDataService.getAlertsOverTime('30d').catch(() => []),
                    alertDataService.getSeverityDistribution().catch(() => []),
                    alertDataService.getNoisyDevices().catch(() => []),
                    alertDataService.getTrendsKPI().catch(() => []),
                ]);

                if (!isMounted) return;

                setDevices(deviceList || []);
                setInsights(aiInsights || []);
                setTrendsKPI(trends || []);
                setSeverityDist(severity || []);

                // Transform alerts over time for pattern chart
                if (alertsOverTime && alertsOverTime.length > 0) {
                    const patternData = alertsOverTime.map((point: any) => ({
                        group: point.group || 'Alerts',
                        date: point.date instanceof Date
                            ? point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: point.value || 0,
                    }));
                    setAlertPatterns(patternData);
                } else {
                    setAlertPatterns([]);
                }

                // Transform noisy devices
                if (noisyDevicesData && noisyDevicesData.length > 0) {
                    const deviceItems: NoisyDeviceItem[] = noisyDevicesData.slice(0, 5).map(device => ({
                        device: {
                            name: device.name || 'Unknown',
                            ip: device.id || '',
                            icon: 'router' as const,
                        },
                        alertCount: device.alertCount || 0,
                        severity: (device.alertCount || 0) > 100 ? 'critical' : (device.alertCount || 0) > 50 ? 'major' : 'minor',
                    }));
                    setNoisyDevices(deviceItems);
                } else {
                    setNoisyDevices([]);
                }

            } catch (err) {
                uiLogger.error('Failed to fetch Senior Engineer data', err);
                setError('Failed to load analytics data. Please check your connection and try again.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // Computed: Infrastructure health breakdown by device type
    const infrastructureHealth = useMemo(() => {
        if (devices.length === 0) return [];

        const typeGroups: Record<string, { total: number; healthSum: number; critical: number; warning: number; offline: number }> = {};

        devices.forEach(device => {
            const type = device.type?.charAt(0).toUpperCase() + device.type?.slice(1) || 'Other';
            if (!typeGroups[type]) {
                typeGroups[type] = { total: 0, healthSum: 0, critical: 0, warning: 0, offline: 0 };
            }
            typeGroups[type].total++;
            typeGroups[type].healthSum += device.healthScore || 0;
            if (device.status === 'critical') typeGroups[type].critical++;
            if (device.status === 'warning') typeGroups[type].warning++;
            if (device.status === 'offline') typeGroups[type].offline++;
        });

        return Object.entries(typeGroups).map(([type, data]) => ({
            type,
            total: data.total,
            avgHealth: Math.round(data.healthSum / data.total),
            critical: data.critical,
            warning: data.warning,
            offline: data.offline,
            status: data.critical > 0 || data.offline > 0 ? 'degraded' as const : data.warning > 0 ? 'warning' as const : 'healthy' as const,
        }));
    }, [devices]);

    // Computed: Overall infrastructure score
    const overallInfraScore = useMemo(() => {
        if (devices.length === 0) return null;
        const totalHealth = devices.reduce((sum, d) => sum + (d.healthScore || 0), 0);
        return Math.round(totalHealth / devices.length);
    }, [devices]);

    // Computed: Capacity utilization by device type (simulated from health scores)
    const capacityByType = useMemo(() => {
        if (devices.length === 0) return [];
        const typeGroups: Record<string, number[]> = {};
        devices.forEach(d => {
            const type = d.type?.charAt(0).toUpperCase() + d.type?.slice(1) || 'Other';
            if (!typeGroups[type]) typeGroups[type] = [];
            // Use health score as a proxy for capacity (inverse: low health = high utilization)
            typeGroups[type].push(100 - (d.healthScore || 0));
        });
        return Object.entries(typeGroups).map(([group, values]) => ({
            group,
            value: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        }));
    }, [devices]);

    // Computed: Alert pattern analysis - group by severity for stacked view
    const alertPatternsByCategory = useMemo(() => {
        if (alertPatterns.length === 0) return [];

        // Get unique dates and groups
        const dates = [...new Set(alertPatterns.map(p => p.date))].slice(-7);
        const groups = [...new Set(alertPatterns.map(p => p.group))];

        return groups.flatMap(group =>
            dates.map(date => {
                const point = alertPatterns.find(p => p.group === group && p.date === date);
                return {
                    group,
                    date,
                    value: point?.value || 0,
                };
            })
        );
    }, [alertPatterns]);

    // KPI data derived from real data
    const kpiData: KPICardProps[] = useMemo(() => {
        const mttrKpi = trendsKPI.find((k: any) => k.id === 'mttr' || (k.label || '').toLowerCase().includes('mttr'));
        const alertVolumeKpi = trendsKPI.find((k: any) => k.id === 'alert-volume' || (k.label || '').toLowerCase().includes('volume'));

        return [
            {
                id: 'infra-health',
                label: 'Infrastructure Health',
                value: overallInfraScore !== null ? `${overallInfraScore}%` : 'N/A',
                icon: NetworkEnterprise,
                iconColor: overallInfraScore !== null && overallInfraScore >= 85 ? 'var(--cds-support-success)' : 'var(--cds-support-warning)',
                severity: overallInfraScore !== null && overallInfraScore >= 85 ? 'success' as const : 'major' as const,
                subtitle: overallInfraScore !== null ? `Across ${devices.length} devices` : 'Data unavailable',
            },
            {
                id: 'device-coverage',
                label: 'Device Coverage',
                value: devices.length > 0 ? `${devices.filter(d => d.status === 'online').length}/${devices.length}` : 'N/A',
                icon: DataStructured,
                iconColor: 'var(--cds-interactive)',
                severity: 'info' as const,
                subtitle: devices.length > 0 ? 'Online / Total monitored' : 'Data unavailable',
            },
            {
                id: 'alert-volume',
                label: 'Alert Volume Trend',
                value: alertVolumeKpi?.value ?? 'N/A',
                icon: ChartLineSmooth,
                iconColor: 'var(--cds-support-info)',
                severity: 'info' as const,
                trend: alertVolumeKpi?.trend === 'down'
                    ? { direction: 'down' as const, value: alertVolumeKpi.subtitle || '', isPositive: true }
                    : alertVolumeKpi?.trend === 'up'
                        ? { direction: 'up' as const, value: alertVolumeKpi.subtitle || '', isPositive: false }
                        : undefined,
                subtitle: alertVolumeKpi ? 'Current period' : 'Data unavailable',
            },
            {
                id: 'resolution-time',
                label: 'Avg Resolution Time',
                value: mttrKpi?.value ?? 'N/A',
                icon: MachineLearning,
                iconColor: mttrKpi ? 'var(--cds-support-success)' : 'var(--cds-text-secondary)',
                severity: mttrKpi ? 'success' as const : 'info' as const,
                subtitle: mttrKpi?.subtitle || 'Data unavailable',
            },
        ];
    }, [overallInfraScore, devices, trendsKPI]);

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'optimization': return <Settings size={20} />;
            case 'pattern': return <ChartLineSmooth size={20} />;
            case 'trend': return <ChartLineSmooth size={20} />;
            case 'anomaly': return <Analytics size={20} />;
            case 'recommendation': return <IbmWatsonxCodeAssistant size={20} />;
            case 'prediction': return <ArrowUp size={20} />;
            default: return <IbmWatsonxCodeAssistant size={20} />;
        }
    };

    const getInsightColor = (type: string): 'green' | 'blue' | 'red' | 'purple' | 'gray' => {
        switch (type) {
            case 'optimization': return 'green';
            case 'pattern': return 'blue';
            case 'trend': return 'blue';
            case 'anomaly': return 'red';
            case 'recommendation': return 'purple';
            case 'prediction': return 'purple';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: 'healthy' | 'warning' | 'degraded') => {
        switch (status) {
            case 'healthy': return <CheckmarkFilled size={16} className="u-icon--success" />;
            case 'warning': return <WarningAlt size={16} className="u-icon--warning" />;
            case 'degraded': return <ArrowDown size={16} className="u-icon--error" />;
        }
    };

    // Donut chart options for severity distribution with theme
    const severityDonutOptions = useMemo(() =>
        createDonutChartOptions({ title: 'Severity Breakdown', height: '280px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-page__content">
                    <PageHeader
                        title="Engineering Analytics"
                        subtitle="Infrastructure health, performance trends, and AI pattern analysis"
                        badges={[{ text: 'System Operational', color: 'var(--cds-support-success)' }]}
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
                    <Tile className="chart-tile section-tile">
                        <SkeletonText heading width="200px" />
                        <div className="auto-fill-grid">
                            {[1, 2, 3].map(i => (
                                <SkeletonPlaceholder key={i} className="u-skeleton-placeholder u-skeleton-placeholder--100" />
                            ))}
                        </div>
                    </Tile>
                    <div className="charts-row">
                        <Tile className="chart-tile">
                            <SkeletonText heading width="150px" />
                            <SkeletonPlaceholder className="dashboard-skeleton--chart-top" />
                        </Tile>
                        <Tile className="chart-tile">
                            <SkeletonText heading width="150px" />
                            <SkeletonPlaceholder className="dashboard-skeleton--chart-top" />
                        </Tile>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-page__content">
                {/* Dashboard Header */}
                <PageHeader
                    title="Engineering Analytics"
                    subtitle="Infrastructure health, performance trends, and AI pattern analysis"
                    badges={[overallInfraScore !== null && overallInfraScore >= 80
                        ? { text: 'System Operational', color: 'var(--cds-support-success)' }
                        : { text: 'System Degraded', color: 'var(--cds-support-error)' }
                    ]}
                />

                {/* Error notification */}
                {error && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={error}
                        className="u-notification-gap"
                    />
                )}

                {/* KPI Section */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Section 1: System Architecture Health */}
                <Tile className="chart-tile section-tile">
                    <div className="chart-header">
                        <h3 className="senior-eng-view__heading-row">
                            <NetworkEnterprise size={20} />
                            System Architecture Health
                        </h3>
                        {overallInfraScore !== null && (
                            <Tag type={overallInfraScore >= 85 ? 'green' : overallInfraScore >= 70 ? 'gray' : 'red'} size="sm">
                                Overall: {overallInfraScore}%
                            </Tag>
                        )}
                    </div>
                    {infrastructureHealth.length > 0 ? (
                        <div className="auto-fill-grid">
                            {infrastructureHealth.map((infra) => (
                                <div
                                    key={infra.type}
                                    className={`senior-eng-view__infra-card senior-eng-view__infra-card--${infra.status}`}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => navigate(`/devices?type=${encodeURIComponent(infra.type.toLowerCase())}`)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/devices?type=${encodeURIComponent(infra.type.toLowerCase())}`); }}
                                >
                                    <div className="senior-eng-view__infra-card-header">
                                        <span className="senior-eng-view__infra-card-title">
                                            {infra.type}s
                                        </span>
                                        <div className="senior-eng-view__infra-status">
                                            {getStatusIcon(infra.status)}
                                            <span className={`senior-eng-view__infra-status-label senior-eng-view__infra-status-label--${infra.status}`}>
                                                {infra.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="senior-eng-view__infra-meter">
                                        <ProgressBar
                                            label=""
                                            value={infra.avgHealth}
                                            max={100}
                                            size="small"
                                            status={infra.avgHealth >= 85 ? 'finished' : infra.avgHealth >= 70 ? 'active' : 'error'}
                                            hideLabel
                                        />
                                        <span className="senior-eng-view__infra-meter-label">
                                            {infra.avgHealth}% avg
                                        </span>
                                    </div>

                                    <div className="senior-eng-view__infra-meta">
                                        <span>{infra.total} device{infra.total !== 1 ? 's' : ''}</span>
                                        {infra.critical > 0 && (
                                            <Tag type="red" size="sm">{infra.critical} critical</Tag>
                                        )}
                                        {infra.warning > 0 && (
                                            <Tag type="gray" size="sm">{infra.warning} warn</Tag>
                                        )}
                                        {infra.offline > 0 && (
                                            <Tag type="magenta" size="sm">{infra.offline} offline</Tag>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="senior-eng-view__empty-block">
                            No device data available. Infrastructure health will appear when device data is loaded.
                        </div>
                    )}
                </Tile>

                {/* Section 2: Performance Trends and Severity Breakdown */}
                <div className="charts-row">
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 className="senior-eng-view__heading-row">
                                <ChartLineSmooth size={20} />
                                Alert Trend (30 Days)
                            </h3>
                        </div>
                        <div className="chart-container">
                            {alertPatterns.length > 0 ? (
                                <LineChart
                                    data={alertPatterns}
                                    options={{
                                        title: '',
                                        axes: {
                                            bottom: { title: 'Date', mapsTo: 'date', scaleType: ScaleTypes.LABELS },
                                            left: { title: 'Alert Count', mapsTo: 'value' },
                                        },
                                        curve: 'curveMonotoneX',
                                        height: '300px',
                                        theme: currentTheme as any,
                                    }}
                                />
                            ) : (
                                <div className="senior-eng-view__chart-empty">
                                    No alert trend data available
                                </div>
                            )}
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 className="senior-eng-view__heading-row">
                                <Analytics size={20} />
                                Severity Breakdown
                            </h3>
                        </div>
                        <div className="chart-container">
                            <ChartWrapper
                                ChartComponent={DonutChart}
                                data={severityDist}
                                options={severityDonutOptions}
                                height="300px"
                                emptyMessage="No severity distribution data"
                            />
                        </div>
                    </Tile>
                </div>

                {/* Section 3: Alert Pattern Analysis by Category (stacked bar) and Capacity */}
                <div className="charts-row">
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 className="senior-eng-view__heading-row">
                                <DataStructured size={20} />
                                Alert Patterns by Category
                            </h3>
                        </div>
                        <div className="chart-container">
                            {alertPatternsByCategory.length > 0 ? (
                                <StackedBarChart
                                    data={alertPatternsByCategory}
                                    options={{
                                        title: '',
                                        axes: {
                                            bottom: { title: 'Date', mapsTo: 'date', scaleType: ScaleTypes.LABELS },
                                            left: { title: 'Count', mapsTo: 'value', stacked: true },
                                        },
                                        height: '300px',
                                        theme: currentTheme as any,
                                    }}
                                />
                            ) : (
                                <div className="senior-eng-view__chart-empty">
                                    No pattern data available
                                </div>
                            )}
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 className="senior-eng-view__heading-row">
                                <Settings size={20} />
                                Capacity Utilization by Type
                            </h3>
                        </div>
                        <div className="chart-container">
                            {capacityByType.length > 0 ? (
                                <div className="senior-eng-view__capacity-body">
                                    {capacityByType.map((item) => {
                                        const valClass = item.value > 80 ? 'error' : item.value > 60 ? 'warning' : 'good';
                                        return (
                                            <div key={item.group} className="senior-eng-view__capacity-row">
                                                <div className="senior-eng-view__capacity-row-header">
                                                    <span className="senior-eng-view__capacity-label">{item.group}</span>
                                                    <span className={`senior-eng-view__capacity-value senior-eng-view__capacity-value--${valClass}`}>
                                                        {item.value}%
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    label={`${item.group} utilization`}
                                                    value={item.value}
                                                    max={100}
                                                    size="small"
                                                    status={item.value > 80 ? 'error' : item.value > 60 ? 'active' : 'finished'}
                                                    hideLabel
                                                />
                                            </div>
                                        );
                                    })}
                                    <div className="senior-eng-view__capacity-footer">
                                        Utilization derived from device health scores. Higher values indicate greater resource consumption.
                                    </div>
                                </div>
                            ) : (
                                <div className="senior-eng-view__chart-empty">
                                    No capacity data available
                                </div>
                            )}
                        </div>
                    </Tile>
                </div>

                {/* Section 4: AI-Powered Insights */}
                <Tile className="chart-tile section-tile">
                    <div className="chart-header">
                        <h3 className="senior-eng-view__heading-row">
                            <IbmWatsonxCodeAssistant size={20} />
                            AI Pattern Analysis & Recommendations
                        </h3>
                        <Tag type="purple" size="sm">watsonx</Tag>
                    </div>
                    {insights.length > 0 ? (
                        <div className="auto-fill-grid">
                            {insights.map((insight) => {
                                const color = getInsightColor(insight.type);
                                const variant = color === 'green' ? 'success' : color === 'red' ? 'error' : 'info';
                                return (
                                    <div
                                        key={insight.id}
                                        className={`senior-eng-view__insight-card senior-eng-view__insight-card--${variant}`}
                                    >
                                        <div className="senior-eng-view__insight-header">
                                            <div className="senior-eng-view__insight-type">
                                                {getInsightIcon(insight.type)}
                                                <span className="senior-eng-view__insight-type-label">
                                                    {insight.type}
                                                </span>
                                            </div>
                                            <Tag type={color} size="sm">
                                                {insight.confidence ? `${insight.confidence}%` : insight.type}
                                            </Tag>
                                        </div>
                                        <p className="senior-eng-view__insight-description">
                                            {insight.description}
                                        </p>
                                        {insight.action && (
                                            <div
                                                className="senior-eng-view__insight-action"
                                                role="link"
                                                tabIndex={0}
                                                onClick={() => navigate('/alerts')}
                                                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/alerts'); }}
                                            >
                                                Recommended: <strong>{insight.action}</strong>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="senior-eng-view__empty-block">
                            No AI insights available. Pattern analysis will appear when the AI service processes sufficient alert data.
                        </div>
                    )}
                </Tile>

                {/* Section 5: Noisy Devices (problem areas for engineering review) */}
                <div className="bottom-row">
                    {noisyDevices.length > 0 ? (
                        <NoisyDevicesCard title="Problem Devices" devices={noisyDevices} variant="gradient" showViewAll onViewAll={() => navigate('/devices')} />
                    ) : (
                        <Tile className="chart-tile">
                            <div className="chart-header">
                                <h3 className="senior-eng-view__heading-row">
                                    <WarningAlt size={20} />
                                    Problem Devices
                                </h3>
                            </div>
                            <div className="senior-eng-view__empty-block">
                                No noisy devices detected. All devices are operating within normal parameters.
                            </div>
                        </Tile>
                    )}

                    {/* Engineering Trend Summary */}
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 className="senior-eng-view__heading-row">
                                <Analytics size={20} />
                                Trend Summary
                            </h3>
                        </div>
                        {trendsKPI.length > 0 ? (
                            <div className="senior-eng-view__trend-body">
                                {trendsKPI.map((kpi: any, idx: number) => (
                                    <div
                                        key={kpi.id || idx}
                                        className="senior-eng-view__trend-row"
                                    >
                                        <div>
                                            <div className="senior-eng-view__trend-label">{kpi.label}</div>
                                            <div className="senior-eng-view__trend-subtitle">
                                                {kpi.subtitle || ''}
                                            </div>
                                        </div>
                                        <div className="senior-eng-view__trend-value-row">
                                            <span className="senior-eng-view__trend-value">{kpi.value}</span>
                                            {kpi.trend === 'up' && <ArrowUp size={16} className="u-icon--error" />}
                                            {kpi.trend === 'down' && <ArrowDown size={16} className="u-icon--success" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="senior-eng-view__empty-block">
                                No trend data available
                            </div>
                        )}
                    </Tile>
                </div>
            </div>
        </div>
    );
}

export default SeniorEngineerView;
