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
    const [currentTheme, setCurrentTheme] = useState('g100');

    // Data states
    const [devices, setDevices] = useState<Device[]>([]);
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [alertPatterns, setAlertPatterns] = useState<any[]>([]);
    const [severityDist, setSeverityDist] = useState<any[]>([]);
    const [noisyDevices, setNoisyDevices] = useState<NoisyDeviceItem[]>([]);
    const [trendsKPI, setTrendsKPI] = useState<any[]>([]);

    // Detect theme
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
            } catch { /* ignore */ }
        };
        detectTheme();
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
        return () => observer.disconnect();
    }, []);

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
                console.error('Failed to fetch Senior Engineer data:', err);
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
                iconColor: overallInfraScore !== null && overallInfraScore >= 85 ? '#24a148' : '#ff832b',
                severity: overallInfraScore !== null && overallInfraScore >= 85 ? 'success' as const : 'major' as const,
                subtitle: overallInfraScore !== null ? `Across ${devices.length} devices` : 'Data unavailable',
            },
            {
                id: 'device-coverage',
                label: 'Device Coverage',
                value: devices.length > 0 ? `${devices.filter(d => d.status === 'online').length}/${devices.length}` : 'N/A',
                icon: DataStructured,
                iconColor: '#0f62fe',
                severity: 'info' as const,
                subtitle: devices.length > 0 ? 'Online / Total monitored' : 'Data unavailable',
            },
            {
                id: 'alert-volume',
                label: 'Alert Volume Trend',
                value: alertVolumeKpi?.value ?? 'N/A',
                icon: ChartLineSmooth,
                iconColor: '#8a3ffc',
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
                iconColor: mttrKpi ? '#24a148' : '#8d8d8d',
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

    const getStatusColor = (status: 'healthy' | 'warning' | 'degraded') => {
        switch (status) {
            case 'healthy': return 'var(--cds-support-success)';
            case 'warning': return 'var(--cds-support-warning)';
            case 'degraded': return 'var(--cds-support-error)';
        }
    };

    const getStatusIcon = (status: 'healthy' | 'warning' | 'degraded') => {
        switch (status) {
            case 'healthy': return <CheckmarkFilled size={16} style={{ color: 'var(--cds-support-success)' }} />;
            case 'warning': return <WarningAlt size={16} style={{ color: 'var(--cds-support-warning)' }} />;
            case 'degraded': return <ArrowDown size={16} style={{ color: 'var(--cds-support-error)' }} />;
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
                    <Tile className="chart-tile section-tile">
                        <SkeletonText heading width="200px" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <SkeletonPlaceholder key={i} style={{ height: '100px' }} />
                            ))}
                        </div>
                    </Tile>
                    <div className="charts-row">
                        <Tile className="chart-tile">
                            <SkeletonText heading width="150px" />
                            <SkeletonPlaceholder style={{ width: '100%', height: '300px', marginTop: '1rem' }} />
                        </Tile>
                        <Tile className="chart-tile">
                            <SkeletonText heading width="150px" />
                            <SkeletonPlaceholder style={{ width: '100%', height: '300px', marginTop: '1rem' }} />
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
                        ? { text: 'System Operational', color: '#24a148' }
                        : { text: 'System Degraded', color: '#ee5396' }
                    ]}
                />

                {/* Error notification */}
                {error && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={error}
                        style={{ marginBottom: 'var(--cds-spacing-05)' }}
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
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                    style={{
                                        padding: 'var(--cds-spacing-05)',
                                        background: 'var(--cds-layer-02)',
                                        borderLeft: `3px solid ${getStatusColor(infra.status)}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--cds-spacing-03)',
                                        cursor: 'pointer',
                                    }}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => navigate(`/devices?type=${encodeURIComponent(infra.type.toLowerCase())}`)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/devices?type=${encodeURIComponent(infra.type.toLowerCase())}`); }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--cds-text-primary)', fontSize: '0.875rem' }}>
                                            {infra.type}s
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-02)' }}>
                                            {getStatusIcon(infra.status)}
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: getStatusColor(infra.status),
                                                textTransform: 'uppercase',
                                            }}>
                                                {infra.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)' }}>
                                        <ProgressBar
                                            label=""
                                            value={infra.avgHealth}
                                            max={100}
                                            size="small"
                                            status={infra.avgHealth >= 85 ? 'finished' : infra.avgHealth >= 70 ? 'active' : 'error'}
                                            hideLabel
                                        />
                                        <span style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', minWidth: '65px' }}>
                                            {infra.avgHealth}% avg
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', fontSize: '12px', color: 'var(--cds-text-secondary)' }}>
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
                        <div style={{
                            padding: 'var(--cds-spacing-06)',
                            textAlign: 'center',
                            color: 'var(--cds-text-secondary)',
                        }}>
                            No device data available. Infrastructure health will appear when device data is loaded.
                        </div>
                    )}
                </Tile>

                {/* Section 2: Performance Trends and Severity Breakdown */}
                <div className="charts-row">
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                <div style={{
                                    height: '300px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--cds-text-secondary)',
                                }}>
                                    No alert trend data available
                                </div>
                            )}
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                <div style={{
                                    height: '300px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--cds-text-secondary)',
                                }}>
                                    No pattern data available
                                </div>
                            )}
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} />
                                Capacity Utilization by Type
                            </h3>
                        </div>
                        <div className="chart-container">
                            {capacityByType.length > 0 ? (
                                <div style={{ padding: 'var(--cds-spacing-05)' }}>
                                    {capacityByType.map((item) => (
                                        <div key={item.group} style={{ marginBottom: 'var(--cds-spacing-05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.group}</span>
                                                <span style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: item.value > 80 ? 'var(--cds-support-error)' : item.value > 60 ? 'var(--cds-support-warning)' : 'var(--cds-support-success)',
                                                }}>
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
                                    ))}
                                    <div style={{
                                        marginTop: 'var(--cds-spacing-05)',
                                        padding: 'var(--cds-spacing-03)',
                                        fontSize: '12px',
                                        color: 'var(--cds-text-secondary)',
                                        borderTop: '1px solid var(--cds-border-subtle-01)',
                                    }}>
                                        Utilization derived from device health scores. Higher values indicate greater resource consumption.
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    height: '300px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--cds-text-secondary)',
                                }}>
                                    No capacity data available
                                </div>
                            )}
                        </div>
                    </Tile>
                </div>

                {/* Section 4: AI-Powered Insights */}
                <Tile className="chart-tile section-tile">
                    <div className="chart-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IbmWatsonxCodeAssistant size={20} />
                            AI Pattern Analysis & Recommendations
                        </h3>
                        <Tag type="purple" size="sm">watsonx</Tag>
                    </div>
                    {insights.length > 0 ? (
                        <div className="auto-fill-grid">
                            {insights.map((insight) => (
                                <div
                                    key={insight.id}
                                    style={{
                                        padding: 'var(--cds-spacing-05)',
                                        background: 'var(--cds-layer-02)',
                                        borderLeft: `3px solid var(--cds-support-${getInsightColor(insight.type) === 'green' ? 'success' : getInsightColor(insight.type) === 'red' ? 'error' : 'info'})`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--cds-spacing-03)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cds-icon-primary)' }}>
                                            {getInsightIcon(insight.type)}
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--cds-text-secondary)' }}>
                                                {insight.type}
                                            </span>
                                        </div>
                                        <Tag type={getInsightColor(insight.type)} size="sm">
                                            {insight.confidence ? `${insight.confidence}%` : insight.type}
                                        </Tag>
                                    </div>
                                    <p style={{ margin: '0 0 var(--cds-spacing-03) 0', fontSize: '13px', color: 'var(--cds-text-secondary)', lineHeight: 1.5 }}>
                                        {insight.description}
                                    </p>
                                    {insight.action && (
                                        <div
                                            style={{ fontSize: '12px', color: 'var(--cds-link-primary)', cursor: 'pointer' }}
                                            role="link"
                                            tabIndex={0}
                                            onClick={() => navigate('/alerts')}
                                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/alerts'); }}
                                        >
                                            Recommended: <strong>{insight.action}</strong>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: 'var(--cds-spacing-06)',
                            textAlign: 'center',
                            color: 'var(--cds-text-secondary)',
                        }}>
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
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <WarningAlt size={20} />
                                    Problem Devices
                                </h3>
                            </div>
                            <div style={{
                                padding: 'var(--cds-spacing-06)',
                                textAlign: 'center',
                                color: 'var(--cds-text-secondary)',
                            }}>
                                No noisy devices detected. All devices are operating within normal parameters.
                            </div>
                        </Tile>
                    )}

                    {/* Engineering Trend Summary */}
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Analytics size={20} />
                                Trend Summary
                            </h3>
                        </div>
                        {trendsKPI.length > 0 ? (
                            <div style={{ padding: 'var(--cds-spacing-05)' }}>
                                {trendsKPI.map((kpi: any, idx: number) => (
                                    <div
                                        key={kpi.id || idx}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--cds-spacing-04) 0',
                                            borderBottom: idx < trendsKPI.length - 1 ? '1px solid var(--cds-border-subtle-01)' : 'none',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{kpi.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                                {kpi.subtitle || ''}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{kpi.value}</span>
                                            {kpi.trend === 'up' && <ArrowUp size={16} style={{ color: 'var(--cds-support-error)' }} />}
                                            {kpi.trend === 'down' && <ArrowDown size={16} style={{ color: 'var(--cds-support-success)' }} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                padding: 'var(--cds-spacing-06)',
                                textAlign: 'center',
                                color: 'var(--cds-text-secondary)',
                            }}>
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
