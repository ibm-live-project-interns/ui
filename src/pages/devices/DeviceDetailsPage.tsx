/**
 * Copyright IBM Corp. 2026
 *
 * Device Details Page
 * Displays detailed information about a specific network device
 *
 * Connects to real API via deviceService and alertDataService.
 * No mock data - shows empty states when data is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Tile,
    Button,
    Tag,
    SkeletonText,
    SkeletonPlaceholder,
    DataTable,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableContainer,
    InlineNotification,
    ContentSwitcher,
    Switch,
} from '@carbon/react';
import {
    ArrowLeft,
    Renew,
    Settings,
    Activity,
    CheckmarkFilled,
    WarningAlt,
    WarningAltFilled,
    Power,
} from '@carbon/icons-react';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import { PageHeader, KPICard } from '@/components/ui';
import { getDeviceIcon } from '@/shared/constants/devices';
import { deviceService, alertDataService } from '@/shared/services';
import { env } from '@/shared/config';
import type { DeviceDetails } from '@/shared/services';

import '@/styles/pages/_device-details.scss';

// Types
interface MetricDataPoint {
    group: string;
    date: Date;
    value: number;
}

type MetricsPeriod = '1h' | '6h' | '24h' | '7d';

const PERIOD_OPTIONS: { key: MetricsPeriod; label: string }[] = [
    { key: '1h', label: '1 Hour' },
    { key: '6h', label: '6 Hours' },
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
];

interface MetricsAPIResponse {
    metrics: Array<{
        timestamp: string;
        cpu_usage: number;
        memory_usage: number;
        bandwidth_in: number;
        bandwidth_out: number;
        error_rate: number;
    }>;
    device_id: string;
    period: string;
}

interface Incident {
    id: string;
    time: string;
    severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
    description: string;
    category: string;
    ticketId?: string;
}

const INCIDENT_HEADERS = [
    { header: 'TIME', key: 'time' },
    { header: 'SEVERITY', key: 'severity' },
    { header: 'DESCRIPTION', key: 'description' },
    { header: 'CATEGORY', key: 'category' },
    { header: 'TICKET', key: 'ticketId' },
];

export function DeviceDetailsPage() {
    const { deviceId } = useParams<{ deviceId: string }>();
    const navigate = useNavigate();
    const [device, setDevice] = useState<DeviceDetails | null>(null);
    const [metricHistory, setMetricHistory] = useState<MetricDataPoint[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>('24h');
    const [error, setError] = useState<string | null>(null);

    // Build metrics API URL from the same env config the services use
    const metricsApiUrl = useCallback((id: string, period: MetricsPeriod) => {
        const base = env.apiBaseUrl.replace(/\/$/, '');
        return `${base}/api/${env.apiVersion}/devices/${id}/metrics?period=${period}`;
    }, []);

    // Fetch metrics from the backend endpoint
    const fetchMetrics = useCallback(async (id: string, period: MetricsPeriod) => {
        setMetricsLoading(true);
        try {
            const token = localStorage.getItem('noc_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(metricsApiUrl(id, period), { headers });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data: MetricsAPIResponse = await response.json();
            if (!data.metrics || data.metrics.length === 0) {
                setMetricHistory([]);
                return;
            }

            // Transform API response into chart-compatible MetricDataPoint array.
            // Each API row produces 2 chart points (CPU + Memory).
            const points: MetricDataPoint[] = [];
            for (const m of data.metrics) {
                const date = new Date(m.timestamp);
                points.push(
                    { group: 'CPU', date, value: m.cpu_usage },
                    { group: 'Memory', date, value: m.memory_usage },
                );
            }
            setMetricHistory(points);
        } catch (err) {
            console.warn('[DeviceDetails] Failed to fetch metrics, chart will show empty state:', err);
            setMetricHistory([]);
        } finally {
            setMetricsLoading(false);
        }
    }, [metricsApiUrl]);

    const fetchDevice = useCallback(async () => {
        if (!deviceId) return;
        setIsLoading(true);
        setError(null);

        try {
            // Fetch device details from API
            const deviceData = await deviceService.getDeviceById(deviceId);
            setDevice(deviceData);

            // Fetch alerts and filter for this device
            const alerts = await alertDataService.getAlerts();
            const deviceAlerts = alerts.filter(alert =>
                alert.device?.name === deviceData.name ||
                alert.device?.ip === deviceData.ip
            );

            // Transform alerts to incidents format
            const incidentData: Incident[] = deviceAlerts.slice(0, 10).map(alert => {
                // Cast to any to access properties added by the service transformer
                const alertAny = alert as any;
                return {
                    id: alert.id,
                    time: alert.timestamp?.relative || alert.timestamp?.absolute || 'Unknown',
                    severity: alert.severity as Incident['severity'],
                    description: alert.aiSummary || alert.aiTitle || 'Alert detected',
                    category: alertAny.extendedDevice?.type || alert.device?.name || 'General',
                    ticketId: undefined, // Would need ticket service integration
                };
            });
            setIncidents(incidentData);

            // Fetch metrics from backend
            await fetchMetrics(deviceId, metricsPeriod);
        } catch (err) {
            console.error('Failed to fetch device:', err);
            setError('Failed to load device details. The device may not exist or the API is unavailable.');
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, fetchMetrics, metricsPeriod]);

    // When the user changes the period selector, re-fetch only metrics
    const handlePeriodChange = useCallback((period: MetricsPeriod) => {
        setMetricsPeriod(period);
        if (deviceId) {
            fetchMetrics(deviceId, period);
        }
    }, [deviceId, fetchMetrics]);

    useEffect(() => {
        fetchDevice();
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDevice, 30000);
        return () => clearInterval(interval);
    }, [fetchDevice]);

    const getStatusConfig = (status: DeviceDetails['status']) => {
        const configs = {
            online: { color: 'green' as const, icon: CheckmarkFilled, text: 'Online' },
            warning: { color: 'magenta' as const, icon: WarningAlt, text: 'Warning' },
            critical: { color: 'red' as const, icon: WarningAltFilled, text: 'Critical' },
            offline: { color: 'gray' as const, icon: Power, text: 'Offline' },
        };
        return configs[status] || configs.offline;
    };

    const getHealthColor = (score: number): string => {
        if (score >= 80) return '#24a148';
        if (score >= 50) return '#ff832b';
        return '#da1e28';
    };

    const getSeverityTag = (severity: string) => {
        switch (severity) {
            case 'critical': return <Tag type="red" size="sm">CRITICAL</Tag>;
            case 'major': return <Tag type="purple" size="sm">MAJOR</Tag>;
            case 'minor': return <Tag type="blue" size="sm">MINOR</Tag>;
            case 'warning': return <Tag type="warm-gray" size="sm">WARNING</Tag>;
            case 'info': return <Tag type="cyan" size="sm">INFO</Tag>;
            default: return <Tag type="gray" size="sm">{severity.toUpperCase()}</Tag>;
        }
    };

    if (isLoading) {
        return (
            <div className="device-details-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Devices', href: '/devices' },
                        { label: 'Loading...', active: true },
                    ]}
                    title="Loading Device..."
                    showBorder
                />
                <div className="device-details-page__content">
                    {/* KPI Skeletons */}
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <KPICard key={i} label="Loading" value="--" loading />
                        ))}
                    </div>

                    {/* Details Grid Skeletons */}
                    <div className="details-grid">
                        <Tile className="info-tile tile--bordered">
                            <SkeletonText heading width="50%" />
                            <div className="info-rows">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="info-row" style={{ margin: '1rem 0' }}>
                                        <SkeletonText width="30%" />
                                        <SkeletonText width="40%" />
                                    </div>
                                ))}
                            </div>
                        </Tile>
                        <Tile className="chart-tile tile--bordered">
                            <SkeletonText heading width="40%" />
                            <SkeletonPlaceholder style={{ height: '300px', width: '100%', marginTop: '1rem' }} />
                        </Tile>
                    </div>

                    <Tile className="incidents-tile tile--bordered">
                        <SkeletonText heading width="20%" className="mb-4" />
                        <SkeletonPlaceholder style={{ height: '200px', width: '100%' }} />
                    </Tile>
                </div>
            </div>
        );
    }

    if (error || !device) {
        return (
            <div className="device-details-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Devices', href: '/devices' },
                        { label: 'Not Found', active: true },
                    ]}
                    title="Device Not Found"
                    subtitle={`Could not find device with ID: ${deviceId}`}
                    showBorder
                />
                <div className="device-details-page__content">
                    {error && (
                        <InlineNotification
                            kind="error"
                            title="Error"
                            subtitle={error}
                            style={{ marginBottom: '1rem' }}
                        />
                    )}
                    <Button kind="secondary" renderIcon={ArrowLeft} onClick={() => navigate('/devices')}>
                        Back to Device Explorer
                    </Button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(device.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="device-details-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Devices', href: '/devices' },
                    { label: device.name, active: true },
                ]}
                title={device.name}
                subtitle={`${device.ip} • ${device.vendor || 'Unknown Vendor'} ${device.model || ''}`}
                badges={[
                    { text: statusConfig.text, color: statusConfig.color === 'green' ? '#24a148' : statusConfig.color === 'red' ? '#da1e28' : '#ff832b' }
                ]}
                actions={[
                    { label: 'Refresh', icon: Renew, variant: 'ghost', onClick: fetchDevice },
                    { label: 'Configure', icon: Settings, variant: 'secondary', onClick: () => navigate('/settings') },
                ]}
                showBorder
            />

            <div className="device-details-page__content">
                {/* KPI Row */}
                <div className="kpi-row">
                    <KPICard
                        label="Health Score"
                        value={`${device.healthScore}%`}
                        icon={Activity}
                        iconColor={getHealthColor(device.healthScore)}
                        severity={device.healthScore >= 80 ? 'success' : device.healthScore >= 50 ? 'major' : 'critical'}
                    />
                    <KPICard
                        label="CPU Usage"
                        value={device.cpuUsage !== undefined ? `${device.cpuUsage}%` : 'N/A'}
                        icon={Activity}
                        iconColor="#0f62fe"
                        severity="info"
                    />
                    <KPICard
                        label="Memory Usage"
                        value={device.memoryUsage !== undefined ? `${device.memoryUsage}%` : 'N/A'}
                        icon={Activity}
                        iconColor="#8a3ffc"
                        severity="info"
                    />
                    <KPICard
                        label="Recent Alerts"
                        value={device.recentAlerts}
                        icon={WarningAlt}
                        iconColor={device.recentAlerts > 5 ? '#da1e28' : '#ff832b'}
                        severity={device.recentAlerts > 5 ? 'critical' : 'major'}
                    />
                </div>

                {/* Details Grid */}
                <div className="details-grid">
                    {/* Device Info */}
                    <Tile className="info-tile tile--bordered tile--blue">
                        <h3>Device Information</h3>
                        <div className="info-rows">
                            <div className="info-row">
                                <span className="info-label">Device Type</span>
                                <span className="info-value">
                                    {getDeviceIcon(device.type)}
                                    {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Status</span>
                                <Tag type={statusConfig.color} size="sm">
                                    <StatusIcon size={12} style={{ marginRight: 4 }} />
                                    {statusConfig.text}
                                </Tag>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Location</span>
                                <span className="info-value">{device.location || 'Not specified'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Uptime</span>
                                <span className="info-value">{device.uptime || 'Unknown'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Last Seen</span>
                                <span className="info-value">{device.lastSeen || 'Unknown'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Firmware</span>
                                <span className="info-value">{device.firmware || 'Not available'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Serial Number</span>
                                <span className="info-value">{device.serialNumber || 'Not available'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">MAC Address</span>
                                <span className="info-value">{device.macAddress || 'Not available'}</span>
                            </div>
                        </div>
                    </Tile>

                    {/* Performance Chart */}
                    <Tile className="chart-tile tile--bordered tile--purple">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Performance</h3>
                            <ContentSwitcher
                                size="sm"
                                selectedIndex={PERIOD_OPTIONS.findIndex(p => p.key === metricsPeriod)}
                                onChange={(e: { index?: number }) => {
                                    if (e.index != null) {
                                        const selected = PERIOD_OPTIONS[e.index];
                                        if (selected) handlePeriodChange(selected.key);
                                    }
                                }}
                            >
                                {PERIOD_OPTIONS.map(opt => (
                                    <Switch key={opt.key} name={opt.key} text={opt.label} />
                                ))}
                            </ContentSwitcher>
                        </div>
                        <div className="chart-container">
                            {metricsLoading ? (
                                <SkeletonPlaceholder style={{ height: '300px', width: '100%' }} />
                            ) : metricHistory.length > 0 ? (
                                <LineChart
                                    data={metricHistory}
                                    options={{
                                        title: '',
                                        axes: {
                                            bottom: { mapsTo: 'date', scaleType: ScaleTypes.TIME },
                                            left: { mapsTo: 'value', title: 'Usage %' },
                                        },
                                        curve: 'curveMonotoneX',
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
                                    No performance data available
                                </div>
                            )}
                        </div>
                    </Tile>
                </div>

                {/* Recent Incidents */}
                <Tile className="incidents-tile tile--bordered tile--critical">
                    <div className="incidents-header">
                        <h3>
                            <Activity size={20} style={{ marginRight: '0.5rem' }} />
                            Recent Incidents
                        </h3>
                        <Button kind="ghost" size="sm" onClick={() => navigate(`/priority-alerts?device=${encodeURIComponent(device.name)}`)}>View All Alerts</Button>
                    </div>
                    <div className="incidents-table-container">
                        {incidents.length > 0 ? (
                            <DataTable rows={incidents} headers={INCIDENT_HEADERS}>
                                {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                                    <TableContainer>
                                        <Table {...getTableProps()}>
                                            <TableHead>
                                                <TableRow>
                                                    {headers.map((header) => (
                                                        <TableHeader {...getHeaderProps({ header })}>
                                                            {header.header}
                                                        </TableHeader>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {rows.map((row) => {
                                                    const incident = incidents.find(i => i.id === row.id);
                                                    if (!incident) return null;
                                                    return (
                                                        <TableRow
                                                            {...getRowProps({ row })}
                                                            onClick={() => navigate(`/alerts/${incident.id}`)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <TableCell>{incident.time}</TableCell>
                                                            <TableCell>{getSeverityTag(incident.severity)}</TableCell>
                                                            <TableCell>{incident.description}</TableCell>
                                                            <TableCell>{incident.category}</TableCell>
                                                            <TableCell>
                                                                {incident.ticketId ? (
                                                                    <span
                                                                        className="ticket-link"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/tickets/${incident.ticketId}`);
                                                                        }}
                                                                        style={{ cursor: 'pointer', color: 'var(--cds-link-primary)' }}
                                                                    >
                                                                        {incident.ticketId}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-secondary">--</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </DataTable>
                        ) : (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: 'var(--cds-text-secondary)'
                            }}>
                                No recent incidents for this device
                            </div>
                        )}
                    </div>
                </Tile>
            </div>
        </div>
    );
}

export default DeviceDetailsPage;
