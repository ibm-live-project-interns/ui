/**
 * Network Admin Dashboard View
 *
 * Device-focused dashboard for network administrators.
 * Shows device inventory, health status, configuration changes, and capacity planning.
 */

import { useState, useEffect, useMemo } from 'react';
import { Tile, Tag, ProgressBar, SkeletonText, SkeletonPlaceholder } from '@carbon/react';
import { DonutChart } from '@carbon/charts-react';
import { KPICard, type KPICardProps, DashboardHeader, DataTableWrapper } from '@/components/ui';
import { CheckmarkFilled, Misuse, Warning, Router } from '@carbon/icons-react';
import { deviceService } from '@/features/devices/services/deviceService';
import type { Device, DeviceStats } from '@/features/devices/services/deviceService';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';
import type { RoleConfig } from '@/features/roles/types/role.types';

interface NetworkAdminViewProps {
    config: RoleConfig;
}

export function NetworkAdminView({ config: _config }: NetworkAdminViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [deviceStats, setDeviceStats] = useState<DeviceStats>({ online: 0, critical: 0, warning: 0, offline: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch real device data from API/service
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [deviceList, stats] = await Promise.all([
                    deviceService.getDevices(),
                    deviceService.getDeviceStats()
                ]);

                if (!cancelled) {
                    setDevices(deviceList);
                    setDeviceStats(stats);
                    setError(null);
                }
            } catch (err) {
                console.error('[NetworkAdminView] Failed to fetch device data:', err);
                if (!cancelled) {
                    setError('Failed to load device data');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    // Filter devices by search query
    const filteredDevices = useMemo(() => {
        if (!searchQuery.trim()) return devices;
        const query = searchQuery.toLowerCase();
        return devices.filter(device =>
            device.name?.toLowerCase().includes(query) ||
            device.ip?.toLowerCase().includes(query) ||
            device.type?.toLowerCase().includes(query) ||
            device.location?.toLowerCase().includes(query) ||
            device.status?.toLowerCase().includes(query)
        );
    }, [devices, searchQuery]);

    // Calculate devices by type from real data
    const devicesByType = useMemo(() => {
        const typeCounts: Record<string, number> = {};
        devices.forEach(device => {
            const type = device.type?.charAt(0).toUpperCase() + device.type?.slice(1) || 'Other';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        return Object.entries(typeCounts).map(([group, value]) => ({ group, value }));
    }, [devices]);

    // KPI data from real stats
    const kpiData: KPICardProps[] = useMemo(() => [
        {
            label: 'Total Devices',
            value: deviceStats.total.toLocaleString(),
            icon: Router,
            iconColor: '#0f62fe',
            severity: 'info' as const,
        },
        {
            label: 'Online',
            value: deviceStats.online.toLocaleString(),
            icon: CheckmarkFilled,
            iconColor: '#24a148',
            severity: 'success' as const,
        },
        {
            label: 'Warnings',
            value: deviceStats.warning + deviceStats.critical,
            icon: Warning,
            iconColor: '#ff832b',
            severity: 'major' as const,
        },
        {
            label: 'Offline',
            value: deviceStats.offline,
            icon: Misuse,
            iconColor: '#da1e28',
            severity: 'critical' as const,
        },
    ], [deviceStats]);

    const getStatusTag = (status: string) => {
        const config: Record<string, { type: 'green' | 'red' | 'gray' | 'magenta'; label: string }> = {
            online: { type: 'green', label: 'ONLINE' },
            warning: { type: 'gray', label: 'WARNING' },
            critical: { type: 'magenta', label: 'CRITICAL' },
            offline: { type: 'red', label: 'OFFLINE' },
        };
        const { type, label } = config[status] || { type: 'gray', label: status?.toUpperCase() || 'UNKNOWN' };
        return <Tag type={type} size="sm">{label}</Tag>;
    };

    // Loading state
    if (isLoading && devices.length === 0) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-page__content">
                    <DashboardHeader
                        title="Network Administration"
                        subtitle="Loading device data..."
                        systemStatus="operational"
                    />
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                            </Tile>
                        ))}
                    </div>
                    <div className="charts-row">
                        <Tile className="chart-tile">
                            <SkeletonPlaceholder style={{ width: '100%', height: '300px' }} />
                        </Tile>
                        <Tile className="chart-tile">
                            <SkeletonPlaceholder style={{ width: '100%', height: '300px' }} />
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
                <DashboardHeader
                    title="Network Administration"
                    subtitle="Device inventory, health monitoring, and configuration management"
                    systemStatus={error ? 'degraded' : 'operational'}
                />

                {/* Error state */}
                {error && (
                    <div style={{ padding: '1rem', background: 'var(--cds-support-error-inverse)', borderRadius: '4px', marginBottom: '1rem', color: 'var(--cds-text-on-color)' }}>
                        {error}
                    </div>
                )}

                {/* KPI Section */}
                <div className="kpi-row">
                    {kpiData.map((kpi, index) => (
                        <KPICard key={index} {...kpi} />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="charts-row">
                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3>Devices by Type</h3>
                        </div>
                        <div className="chart-container">
                            <div className="cds--cc--donut">
                                <DonutChart
                                    data={devicesByType.length > 0 ? devicesByType : [{ group: 'No Data', value: 1 }]}
                                    options={{
                                        title: '',
                                        resizable: true,
                                        donut: { center: { label: 'Devices' } },
                                        height: '300px',
                                        theme: 'g100',
                                    }}
                                />
                            </div>
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3>Device Status Distribution</h3>
                        </div>
                        <div className="chart-container">
                            <div className="cds--cc--donut">
                                <DonutChart
                                    data={[
                                        { group: 'Online', value: deviceStats.online || 0 },
                                        { group: 'Warning', value: deviceStats.warning || 0 },
                                        { group: 'Critical', value: deviceStats.critical || 0 },
                                        { group: 'Offline', value: deviceStats.offline || 0 },
                                    ].filter(d => d.value > 0)}
                                    options={{
                                        title: '',
                                        resizable: true,
                                        donut: { center: { label: 'Status' } },
                                        height: '300px',
                                        theme: 'g100',
                                        color: {
                                            scale: {
                                                'Online': '#24a148',
                                                'Warning': '#ff832b',
                                                'Critical': '#da1e28',
                                                'Offline': '#6f6f6f',
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </Tile>
                </div>

                {/* Device Inventory Table */}
                <DataTableWrapper title="Device Inventory" onSearch={setSearchQuery}>
                    <table className="cds--data-table cds--data-table--md" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Device</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Health Score</th>
                                <th>Alerts</th>
                                <th>Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.slice(0, 10).map(device => (
                                <tr key={device.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{device.name}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{device.ip}</span>
                                        </div>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{device.type}</td>
                                    <td>{getStatusTag(device.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ProgressBar
                                                value={device.healthScore}
                                                max={100}
                                                size="small"
                                                status={device.healthScore < 50 ? 'error' : device.healthScore < 75 ? 'active' : 'finished'}
                                                hideLabel
                                                label="Health"
                                            />
                                            <span style={{ minWidth: '40px' }}>{device.healthScore}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        {device.recentAlerts > 0 ? (
                                            <Tag type="red" size="sm">{device.recentAlerts}</Tag>
                                        ) : (
                                            <span style={{ color: 'var(--cds-text-secondary)' }}>0</span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--cds-text-secondary)' }}>{device.lastSeen || 'N/A'}</td>
                                </tr>
                            ))}
                            {filteredDevices.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>
                                        {searchQuery ? `No devices matching "${searchQuery}"` : 'No devices found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </DataTableWrapper>
            </div>
        </div>
    );
}

export default NetworkAdminView;
