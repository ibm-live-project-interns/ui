/**
 * Network Admin Dashboard View
 *
 * Device-focused dashboard for network administrators.
 * Shows device inventory, health status, configuration changes, and capacity planning.
 *
 * Uses a proper Carbon DataTable with pagination, sorting, and filtering.
 *
 * Services:
 * - Device data from deviceService.getDevices() and getDeviceStats()
 */

import { useState, useEffect, useMemo } from 'react';
import { useThemeDetection } from '@/shared/hooks';
import { useNavigate } from 'react-router-dom';
import {
    Tile, Tag, ProgressBar, SkeletonText, SkeletonPlaceholder, InlineNotification,
    DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
    Pagination,
} from '@carbon/react';
import { DonutChart } from '@carbon/charts-react';
import { KPICard, type KPICardProps, PageHeader, DataTableWrapper } from '@/components/ui';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { CheckmarkFilled, Misuse, Warning, Router } from '@carbon/icons-react';
import { deviceService } from '@/features/devices/services/deviceService';
import type { Device, DeviceStats } from '@/features/devices/services/deviceService';
import { createDonutChartOptions } from '@/shared/constants/charts';
import { uiLogger } from '@/shared/utils/logger';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';
import '@carbon/charts-react/styles.css';
import type { RoleConfig } from '@/features/roles/types/role.types';

interface NetworkAdminViewProps {
    config: RoleConfig;
}

const DEVICE_HEADERS = [
    { key: 'name', header: 'Device' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'healthScore', header: 'Health Score' },
    { key: 'alerts', header: 'Alerts' },
    { key: 'lastSeen', header: 'Last Seen' },
];

export function NetworkAdminView({ config: _config }: NetworkAdminViewProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [deviceStats, setDeviceStats] = useState<DeviceStats>({ online: 0, critical: 0, warning: 0, offline: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const currentTheme = useThemeDetection();

    // Search & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [firstRowIndex, setFirstRowIndex] = useState(0);
    const [currentPageSize, setCurrentPageSize] = useState(10);

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
                uiLogger.error('[NetworkAdminView] Failed to fetch device data', err);
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

    // Paginated devices
    const paginatedDevices = useMemo(() => {
        return filteredDevices.slice(firstRowIndex, firstRowIndex + currentPageSize);
    }, [filteredDevices, firstRowIndex, currentPageSize]);

    // Transform devices for Carbon DataTable (primitive values for each key)
    const tableRows = useMemo(() =>
        paginatedDevices.map(device => ({
            id: device.id,
            name: device.name,
            type: device.type,
            status: device.status,
            healthScore: device.healthScore,
            alerts: device.recentAlerts,
            lastSeen: device.lastSeen || 'N/A',
        })),
        [paginatedDevices]
    );

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
            iconColor: 'var(--cds-interactive)',
            severity: 'info' as const,
        },
        {
            label: 'Online',
            value: deviceStats.online.toLocaleString(),
            icon: CheckmarkFilled,
            iconColor: 'var(--cds-support-success)',
            severity: 'success' as const,
        },
        {
            label: 'Warnings',
            value: deviceStats.warning + deviceStats.critical,
            icon: Warning,
            iconColor: 'var(--cds-support-warning)',
            severity: 'major' as const,
        },
        {
            label: 'Offline',
            value: deviceStats.offline,
            icon: Misuse,
            iconColor: 'var(--cds-support-error)',
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

    // Chart options with theme support
    const typeDonutOptions = useMemo(() =>
        createDonutChartOptions({ title: 'Devices by Type', height: '300px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    const statusDonutOptions = useMemo(() => ({
        title: '',
        resizable: true,
        donut: { center: { label: 'Status' } },
        height: '300px',
        theme: currentTheme as any,
        color: {
            scale: {
                'Online': 'var(--cds-support-success)',
                'Warning': 'var(--cds-support-warning)',
                'Critical': 'var(--cds-support-error)',
                'Offline': 'var(--cds-text-secondary)',
            }
        }
    }), [currentTheme]);

    // Loading state
    if (isLoading && devices.length === 0) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-page__content">
                    <PageHeader
                        title="Network Administration"
                        subtitle="Loading device data..."
                        badges={[{ text: 'System Operational', color: 'var(--cds-support-success)' }]}
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
                            <SkeletonPlaceholder className="dashboard-skeleton--chart" />
                        </Tile>
                        <Tile className="chart-tile">
                            <SkeletonPlaceholder className="dashboard-skeleton--chart" />
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
                    title="Network Administration"
                    subtitle="Device inventory, health monitoring, and configuration management"
                    badges={[error
                        ? { text: 'System Degraded', color: 'var(--cds-support-error)' }
                        : { text: 'System Operational', color: 'var(--cds-support-success)' }
                    ]}
                />

                {/* Error state */}
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
                            <ChartWrapper
                                ChartComponent={DonutChart}
                                data={devicesByType.length > 0 ? devicesByType : [{ group: 'No Data', value: 1 }]}
                                options={typeDonutOptions}
                                height="300px"
                                emptyMessage="No device data available"
                            />
                        </div>
                    </Tile>

                    <Tile className="chart-tile">
                        <div className="chart-header">
                            <h3>Device Status Distribution</h3>
                        </div>
                        <div className="chart-container">
                            <ChartWrapper
                                ChartComponent={DonutChart}
                                data={[
                                    { group: 'Online', value: deviceStats.online || 0 },
                                    { group: 'Warning', value: deviceStats.warning || 0 },
                                    { group: 'Critical', value: deviceStats.critical || 0 },
                                    { group: 'Offline', value: deviceStats.offline || 0 },
                                ].filter(d => d.value > 0)}
                                options={statusDonutOptions}
                                height="300px"
                                emptyMessage="No status data available"
                            />
                        </div>
                    </Tile>
                </div>

                {/* Device Inventory Table - Proper Carbon DataTable */}
                <DataTableWrapper
                    title="Device Inventory"
                    onSearch={(value) => {
                        setSearchQuery(value);
                        setFirstRowIndex(0);
                    }}
                    searchPlaceholder="Search by name, IP, type, or location..."
                    searchValue={searchQuery}
                    showFilter={true}
                    showRefresh={true}
                >
                    <DataTable rows={tableRows} headers={DEVICE_HEADERS} isSortable>
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
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="network-admin-view__empty-state">
                                                    {searchQuery ? `No devices matching "${searchQuery}"` : 'No devices found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map((row) => {
                                                const device = paginatedDevices.find(d => d.id === row.id);
                                                if (!device) return null;

                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell>
                                                            <div className="network-admin-view__name-cell">
                                                                <span
                                                                    className="network-admin-view__name-link"
                                                                    role="link"
                                                                    tabIndex={0}
                                                                    onClick={() => navigate(`/devices/${device.id}`)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/devices/${device.id}`); }}
                                                                >
                                                                    {device.name}
                                                                </span>
                                                                <span className="network-admin-view__ip">{device.ip}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="network-admin-view__type-cell">{device.type}</TableCell>
                                                        <TableCell>{getStatusTag(device.status)}</TableCell>
                                                        <TableCell>
                                                            <div className="network-admin-view__health-cell">
                                                                <ProgressBar
                                                                    value={device.healthScore}
                                                                    max={100}
                                                                    size="small"
                                                                    status={device.healthScore < 50 ? 'error' : device.healthScore < 75 ? 'active' : 'finished'}
                                                                    hideLabel
                                                                    label="Health"
                                                                />
                                                                <span className="network-admin-view__health-value">{device.healthScore}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {device.recentAlerts > 0 ? (
                                                                <Tag
                                                                    type="red"
                                                                    size="sm"
                                                                    className="network-admin-view__alert-tag"
                                                                    onClick={() => navigate(`/alerts?device=${encodeURIComponent(device.name)}`)}
                                                                >
                                                                    {device.recentAlerts}
                                                                </Tag>
                                                            ) : (
                                                                <span className="network-admin-view__alert-zero">0</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="network-admin-view__muted-cell">
                                                            {device.lastSeen || 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DataTable>

                    <Pagination
                        totalItems={filteredDevices.length}
                        backwardText="Previous page"
                        forwardText="Next page"
                        pageSize={currentPageSize}
                        pageSizes={[5, 10, 20, 50]}
                        itemsPerPageText="Items per page"
                        onChange={({ page, pageSize }: { page: number; pageSize: number }) => {
                            if (pageSize !== currentPageSize) {
                                setCurrentPageSize(pageSize);
                            }
                            setFirstRowIndex((page - 1) * pageSize);
                        }}
                    />
                </DataTableWrapper>
            </div>
        </div>
    );
}

export default NetworkAdminView;
