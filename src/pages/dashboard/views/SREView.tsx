/**
 * SRE Dashboard View
 *
 * Reliability-focused dashboard for Site Reliability Engineers.
 * Shows MTTR, incident trends, service health, and performance metrics.
 *
 * Uses existing services - NO mock data.
 * Shows empty states when data is unavailable.
 *
 * Services:
 * - MTTR from alertDataService.getTrendsKPI()
 * - Availability from deviceService.getDevices()
 * - Incidents from alertDataService.getAlertsSummary()
 * - Service health from deviceService.getDevices()
 */

import { useState, useEffect, useMemo } from 'react';
import { Tile, ProgressBar, SkeletonText, SkeletonPlaceholder, InlineNotification } from '@carbon/react';
import { ArrowDown, ArrowUp, Time, Activity, ChartLineSmooth, WarningAlt } from '@carbon/icons-react';
import { LineChart, StackedBarChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import { KPICard, type KPICardProps, PageHeader } from '@/components/ui';
import type { RoleConfig } from '@/features/roles/types/role.types';
import { alertDataService, deviceService } from '@/shared/services';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';

interface SREViewProps {
    config: RoleConfig;
}

interface SREMetrics {
    mttr: number | null;
    mttrChange: number | null;
    availability: number | null;
    incidentCount: number | null;
    incidentChange: number | null;
    errorBudgetUsed: number | null;
}

interface ServiceHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
}

export function SREView({ config: _config }: SREViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<SREMetrics>({
        mttr: null,
        mttrChange: null,
        availability: null,
        incidentCount: null,
        incidentChange: null,
        errorBudgetUsed: null,
    });
    const [mttrTrend, setMttrTrend] = useState<any[]>([]);
    const [incidentsByService, setIncidentsByService] = useState<any[]>([]);
    const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);

    // Fetch data from services
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setError(null);

            try {
                // Fetch from existing services in parallel
                const [trendsKpi, alertsOverTime, alertsSummary, devices] = await Promise.all([
                    alertDataService.getTrendsKPI().catch(() => []),
                    alertDataService.getAlertsOverTime('7d').catch(() => []),
                    alertDataService.getAlertsSummary().catch(() => ({ activeCount: 0, criticalCount: 0, majorCount: 0, minorCount: 0, totalToday: 0 })),
                    deviceService.getDevices().catch(() => []),
                ]);

                if (!isMounted) return;

                // Calculate MTTR from trends KPI
                const mttrKpi = trendsKpi.find(k => k.id === 'mttr' || (k.label || '').toLowerCase().includes('mttr'));
                const mttrValue = mttrKpi ? parseInt(String(mttrKpi.value).replace(/[^0-9]/g, '')) : null;

                // Calculate availability from device health scores
                let availability: number | null = null;
                let errorBudgetUsed: number | null = null;
                if (devices.length > 0) {
                    const totalHealth = devices.reduce((sum, d) => sum + (d.healthScore || 0), 0);
                    const avgHealth = totalHealth / devices.length;
                    availability = Math.round(Math.min(99.99, Math.max(0, avgHealth)) * 100) / 100;

                    // Calculate error budget (target 99.9% availability)
                    const target = 99.9;
                    const allowedDowntime = 100 - target; // 0.1%
                    const actualDowntime = 100 - availability;
                    errorBudgetUsed = Math.min(100, Math.round((actualDowntime / allowedDowntime) * 100));
                }

                // Set metrics
                setMetrics({
                    mttr: mttrValue,
                    mttrChange: null, // Would need historical data to calculate
                    availability,
                    incidentCount: alertsSummary.activeCount || null,
                    incidentChange: null, // Would need historical data
                    errorBudgetUsed,
                });

                // Transform alerts over time for MTTR trend chart
                if (alertsOverTime.length > 0) {
                    const mttrData = alertsOverTime.map(point => ({
                        group: 'Alerts',
                        date: point.date instanceof Date
                            ? point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: point.value || 0,
                    }));
                    setMttrTrend(mttrData);
                } else {
                    setMttrTrend([]);
                }

                // Transform alerts by severity for incidents chart
                if (alertsOverTime.length > 0) {
                    // Group by date and severity from real data
                    const severityGroups = [...new Set(alertsOverTime.map(p => p.group || 'Alerts'))];
                    const dates = [...new Set(alertsOverTime.map(p =>
                        p.date instanceof Date
                            ? p.date.toLocaleDateString('en-US', { weekday: 'short' })
                            : new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })
                    ))].slice(0, 7);

                    const incidentsData = severityGroups.flatMap(group =>
                        dates.map(date => {
                            const point = alertsOverTime.find(p =>
                                (p.group === group || (!p.group && group === 'Alerts')) &&
                                (p.date instanceof Date
                                    ? p.date.toLocaleDateString('en-US', { weekday: 'short' }) === date
                                    : new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' }) === date)
                            );
                            return {
                                group,
                                date,
                                value: point?.value || 0,
                            };
                        })
                    );
                    setIncidentsByService(incidentsData);
                } else {
                    setIncidentsByService([]);
                }

                // Transform devices to service health
                if (devices.length > 0) {
                    const healthData: ServiceHealth[] = devices.slice(0, 6).map(device => ({
                        name: device.name,
                        status: device.healthScore >= 90 ? 'healthy' : device.healthScore >= 70 ? 'degraded' : 'down',
                        uptime: device.healthScore || 0,
                    }));
                    setServiceHealth(healthData);
                } else {
                    setServiceHealth([]);
                }

            } catch (err) {
                console.error('Failed to fetch SRE data:', err);
                setError('Failed to load SRE metrics. Please check your connection and try again.');
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

    // KPI data derived from metrics
    const kpiData: KPICardProps[] = useMemo(() => [
        {
            id: 'mttr',
            label: 'Mean Time to Resolve',
            value: metrics.mttr !== null ? `${metrics.mttr}m` : 'N/A',
            icon: Time,
            iconColor: metrics.mttr !== null && metrics.mttr < 30 ? '#24a148' : '#ff832b',
            severity: metrics.mttr !== null && metrics.mttr < 30 ? 'success' as const : 'major' as const,
            trend: metrics.mttrChange !== null
                ? { direction: 'down' as const, value: `${Math.abs(metrics.mttrChange)}%`, isPositive: true }
                : undefined,
            subtitle: metrics.mttr !== null ? 'vs last week' : 'Data unavailable',
        },
        {
            id: 'availability',
            label: 'System Availability',
            value: metrics.availability !== null ? `${metrics.availability}%` : 'N/A',
            icon: Activity,
            iconColor: metrics.availability !== null && metrics.availability >= 99.9 ? '#24a148' : '#ff832b',
            severity: metrics.availability !== null && metrics.availability >= 99.9 ? 'success' as const : 'major' as const,
            subtitle: metrics.availability !== null ? 'Based on device health' : 'Data unavailable',
        },
        {
            id: 'incidents',
            label: 'Active Incidents',
            value: metrics.incidentCount !== null ? metrics.incidentCount : 'N/A',
            icon: WarningAlt,
            iconColor: metrics.incidentCount !== null && metrics.incidentCount > 10 ? '#da1e28' : '#ff832b',
            severity: metrics.incidentCount !== null && metrics.incidentCount > 10 ? 'critical' as const : 'major' as const,
            trend: metrics.incidentChange !== null
                ? { direction: 'down' as const, value: `${Math.abs(metrics.incidentChange)}%`, isPositive: true }
                : undefined,
            subtitle: metrics.incidentCount !== null ? 'Requires attention' : 'Data unavailable',
        },
        {
            id: 'error-budget',
            label: 'Error Budget Used',
            value: metrics.errorBudgetUsed !== null ? `${metrics.errorBudgetUsed}%` : 'N/A',
            icon: ChartLineSmooth,
            iconColor: metrics.errorBudgetUsed !== null
                ? (metrics.errorBudgetUsed > 80 ? '#da1e28' : metrics.errorBudgetUsed > 50 ? '#ff832b' : '#0f62fe')
                : '#0f62fe',
            severity: metrics.errorBudgetUsed !== null
                ? (metrics.errorBudgetUsed > 80 ? 'critical' as const : metrics.errorBudgetUsed > 50 ? 'major' as const : 'info' as const)
                : 'info' as const,
            subtitle: metrics.errorBudgetUsed !== null ? 'of monthly budget' : 'Data unavailable',
        },
    ], [metrics]);

    const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
        switch (status) {
            case 'healthy': return 'var(--cds-support-success)';
            case 'degraded': return 'var(--cds-support-warning)';
            case 'down': return 'var(--cds-support-error)';
        }
    };

    const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
        switch (status) {
            case 'healthy': return <ArrowUp size={16} style={{ color: 'var(--cds-support-success)' }} />;
            case 'degraded': return <Time size={16} style={{ color: 'var(--cds-support-warning)' }} />;
            case 'down': return <ArrowDown size={16} style={{ color: 'var(--cds-support-error)' }} />;
        }
    };

    // Loading state with Carbon skeletons
    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-page__content">
                    <PageHeader
                        title="Site Reliability Engineering"
                        subtitle="System reliability metrics, incident tracking, and service health monitoring"
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
                    <Tile className="chart-tile">
                        <SkeletonText heading width="200px" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <SkeletonPlaceholder key={i} style={{ height: '80px' }} />
                            ))}
                        </div>
                    </Tile>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-page__content">
                {/* Dashboard Header */}
                <PageHeader
                    title="Site Reliability Engineering"
                    subtitle="System reliability metrics, incident tracking, and service health monitoring"
                    badges={[{ text: 'System Operational', color: '#24a148' }]}
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

                {/* Charts Section */}
                <div className="charts-row">
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3>Alert Trend</h3>
                        </div>
                        <div className="chart-container">
                            {mttrTrend.length > 0 ? (
                                <LineChart
                                    data={mttrTrend}
                                    options={{
                                        title: '',
                                        axes: {
                                            bottom: { title: 'Date', mapsTo: 'date', scaleType: ScaleTypes.LABELS },
                                            left: { title: 'Count', mapsTo: 'value' },
                                        },
                                        height: '300px',
                                        theme: 'g100',
                                        curve: 'curveMonotoneX',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    height: '300px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--cds-text-secondary)'
                                }}>
                                    No trend data available
                                </div>
                            )}
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3>Incidents by Category</h3>
                        </div>
                        <div className="chart-container">
                            {incidentsByService.length > 0 ? (
                                <StackedBarChart
                                    data={incidentsByService}
                                    options={{
                                        title: '',
                                        axes: {
                                            bottom: { title: 'Day', mapsTo: 'date', scaleType: ScaleTypes.LABELS },
                                            left: { title: 'Incidents', mapsTo: 'value', stacked: true },
                                        },
                                        height: '300px',
                                        theme: 'g100',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    height: '300px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--cds-text-secondary)'
                                }}>
                                    No incident data available
                                </div>
                            )}
                        </div>
                    </Tile>
                </div>

                {/* Service Health Grid */}
                <Tile className="chart-tile">
                    <div className="chart-header">
                        <h3>Service Health Status</h3>
                    </div>
                    {serviceHealth.length > 0 ? (
                        <div className="service-health-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 'var(--cds-spacing-05)'
                        }}>
                            {serviceHealth.map((service, index) => (
                                <div
                                    key={index}
                                    className="service-item"
                                    style={{
                                        padding: 'var(--cds-spacing-05)',
                                        background: 'var(--cds-layer-02)',
                                        borderLeft: `3px solid ${getStatusColor(service.status)}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--cds-spacing-03)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--cds-text-primary)' }}>{service.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-02)' }}>
                                            {getStatusIcon(service.status)}
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: getStatusColor(service.status),
                                                textTransform: 'uppercase'
                                            }}>
                                                {service.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)' }}>
                                        <ProgressBar
                                            label=""
                                            value={service.uptime}
                                            max={100}
                                            size="small"
                                            status={service.uptime >= 90 ? 'finished' : service.uptime >= 70 ? 'active' : 'error'}
                                            hideLabel
                                        />
                                        <span style={{ fontSize: '12px', color: 'var(--cds-text-secondary)', minWidth: '60px' }}>
                                            {service.uptime}% health
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: 'var(--cds-spacing-06)',
                            textAlign: 'center',
                            color: 'var(--cds-text-secondary)'
                        }}>
                            No device health data available
                        </div>
                    )}
                </Tile>
            </div>
        </div>
    );
}

export default SREView;
