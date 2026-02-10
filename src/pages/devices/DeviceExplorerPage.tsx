/**
 * Copyright IBM Corp. 2026
 *
 * Device Explorer Page
 *
 * Displays a grid/table view of all network devices with filtering and search.
 * Uses centralized types from @/shared/types.
 * Uses centralized constants from @/shared/constants.
 * Uses deviceService for data fetching (supports mock/API mode).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
    Tile,
    Button,
    Dropdown,
    Tag,
    ProgressBar,
    Pagination,
    SkeletonText,
    SkeletonPlaceholder,
} from '@carbon/react';
import {
    View,
    Settings,
    Renew,
} from '@carbon/icons-react';
import { KPICard, PageHeader } from '@/components/ui';

// Centralized imports - no local type/constant definitions
import { deviceService } from '@/features/devices/services';
import type { Device, DeviceStats, DeviceType, DeviceStatus } from '@/shared/types';
import {
    getDeviceIcon,
    getHealthColor,
    getDeviceStatusConfig,
    getDeviceTypeLabel,
    DEVICE_TYPE_OPTIONS,
    DEVICE_STATUS_OPTIONS,
    DEVICE_LOCATION_OPTIONS,
    DEVICE_STATUS_CONFIG,
} from '@/shared/constants';
import { env } from '@/shared/config';

import '@/styles/pages/_device-explorer.scss';

// ==========================================
// Page Component
// ==========================================

export function DeviceExplorerPage() {
    const navigate = useNavigate();

    // State
    const [devices, setDevices] = useState<Device[]>([]);
    const [stats, setStats] = useState<DeviceStats>({ online: 0, critical: 0, warning: 0, offline: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(env.maxAlertsPerPage);

    // ==========================================
    // Data Fetching
    // ==========================================

    /**
     * Fetch devices and stats from service.
     * Service automatically handles mock vs API mode based on env config.
     */
    const fetchDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const [deviceData, statsData] = await Promise.all([
                deviceService.getDevices(),
                deviceService.getDeviceStats(),
            ]);
            setDevices(deviceData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // ==========================================
    // Filtering & Pagination
    // ==========================================

    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            // Search filter - match name or IP
            if (searchTerm &&
                !(device.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
                !(device.ip || '').includes(searchTerm)) {
                return false;
            }
            // Type filter
            if (typeFilter !== 'all' && device.type !== typeFilter) {
                return false;
            }
            // Status filter
            if (statusFilter !== 'all' && device.status !== statusFilter) {
                return false;
            }
            // Location filter (partial match)
            if (locationFilter !== 'all' && !(device.location || '').toLowerCase().includes(locationFilter)) {
                return false;
            }
            return true;
        });
    }, [devices, searchTerm, typeFilter, statusFilter, locationFilter]);

    const paginatedDevices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDevices.slice(start, start + pageSize);
    }, [filteredDevices, currentPage, pageSize]);

    // ==========================================
    // Handlers
    // ==========================================

    const handleViewDevice = useCallback((deviceId: string) => {
        navigate(`/devices/${deviceId}`);
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        fetchDevices();
    }, [fetchDevices]);

    // ==========================================
    // Render Helpers
    // ==========================================

    const getStatusTag = (status: DeviceStatus) => {
        const config = getDeviceStatusConfig(status);
        const Icon = config.icon;
        return (
            <Tag type={config.color} size="sm">
                <Icon size={12} style={{ marginRight: 4 }} />
                {config.label}
            </Tag>
        );
    };

    // Table headers configuration
    const headers = [
        { key: 'name', header: 'Device' },
        { key: 'type', header: 'Type' },
        { key: 'location', header: 'Location' },
        { key: 'healthScore', header: 'Health' },
        { key: 'status', header: 'Status' },
        { key: 'recentAlerts', header: 'Alerts' },
        { key: 'uptime', header: 'Uptime' },
        { key: 'actions', header: 'Actions' },
    ];

    // ==========================================
    // Loading State
    // ==========================================

    if (isLoading) {
        return (
            <div className="device-explorer-page">
                <PageHeader
                    title="Device Explorer"
                    subtitle="Loading devices..."
                />
                <div className="kpi-row">
                    {[1, 2, 3, 4].map(i => (
                        <Tile key={i}>
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                        </Tile>
                    ))}
                </div>
                <div className="device-table-container">
                    <Tile>
                        <SkeletonPlaceholder style={{ width: '100%', height: 400 }} />
                    </Tile>
                </div>
            </div>
        );
    }

    // ==========================================
    // Main Render
    // ==========================================

    return (
        <div className="device-explorer-page">
            <PageHeader
                title="Device Explorer"
                subtitle={`${stats.total} devices monitored`}
                actions={[
                    { label: 'Refresh', icon: Renew, variant: 'ghost', onClick: handleRefresh },
                    { label: 'Settings', icon: Settings, variant: 'secondary', onClick: () => navigate('/settings') },
                ]}
            />

            {/* KPI Cards - Uses centralized config for icons and colors */}
            <div className="kpi-row">
                <KPICard
                    label="Online"
                    value={stats.online}
                    icon={DEVICE_STATUS_CONFIG.online.icon}
                    iconColor={DEVICE_STATUS_CONFIG.online.iconColor}
                    severity="success"
                    subtitle={stats.total > 0 ? `${Math.round((stats.online / stats.total) * 100)}% of devices` : 'No devices'}
                />
                <KPICard
                    label="Critical Issues"
                    value={stats.critical}
                    icon={DEVICE_STATUS_CONFIG.critical.icon}
                    iconColor={DEVICE_STATUS_CONFIG.critical.iconColor}
                    severity="critical"
                    subtitle="Requires immediate attention"
                />
                <KPICard
                    label="Warnings"
                    value={stats.warning}
                    icon={DEVICE_STATUS_CONFIG.warning.icon}
                    iconColor={DEVICE_STATUS_CONFIG.warning.iconColor}
                    severity="major"
                    subtitle="Performance degradation"
                />
                <KPICard
                    label="Offline"
                    value={stats.offline}
                    icon={DEVICE_STATUS_CONFIG.offline.icon}
                    iconColor={DEVICE_STATUS_CONFIG.offline.iconColor}
                    severity="neutral"
                    subtitle="Not responding"
                />
            </div>

            {/* Filters - Uses centralized filter options */}
            <div className="filters-row">
                <div className="filter-group">
                    <Dropdown
                        id="type-filter"
                        titleText=""
                        label="Type"
                        items={[...DEVICE_TYPE_OPTIONS]}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={DEVICE_TYPE_OPTIONS.find(t => t.id === typeFilter)}
                        onChange={({ selectedItem }) => setTypeFilter(selectedItem?.id || 'all')}
                        size="md"
                    />
                    <Dropdown
                        id="location-filter"
                        titleText=""
                        label="Location"
                        items={[...DEVICE_LOCATION_OPTIONS]}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={DEVICE_LOCATION_OPTIONS.find(l => l.id === locationFilter)}
                        onChange={({ selectedItem }) => setLocationFilter(selectedItem?.id || 'all')}
                        size="md"
                    />
                    <Dropdown
                        id="status-filter"
                        titleText=""
                        label="Status"
                        items={[...DEVICE_STATUS_OPTIONS]}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={DEVICE_STATUS_OPTIONS.find(s => s.id === statusFilter)}
                        onChange={({ selectedItem }) => setStatusFilter(selectedItem?.id || 'all')}
                        size="md"
                    />
                </div>
            </div>

            {/* Device Table */}
            <div className="device-table-container">
                <Tile className="devices-table-tile">
                    <DataTable rows={paginatedDevices} headers={headers}>
                        {({ rows, headers, getTableProps, getHeaderProps, getRowProps, onInputChange }) => (
                            <TableContainer>
                                <TableToolbar>
                                    <TableToolbarContent>
                                        <TableToolbarSearch
                                            onChange={(e) => {
                                                if (typeof e !== 'string') {
                                                    onInputChange(e as any);
                                                    setSearchTerm(e?.target?.value || '');
                                                }
                                            }}
                                            placeholder="Search devices..."
                                        />
                                    </TableToolbarContent>
                                </TableToolbar>
                                <Table {...getTableProps()} className="enhanced-data-table">
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
                                            const device = paginatedDevices.find(d => d.id === row.id);
                                            if (!device) return null;
                                            return (
                                                <TableRow {...getRowProps({ row })} key={row.id}>
                                                    <TableCell>
                                                        <div className="device-cell">
                                                            {getDeviceIcon(device.type)}
                                                            <div className="device-info">
                                                                <span className="device-name">{device.name}</span>
                                                                <span className="device-ip">{device.ip}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tag type="gray" size="sm">
                                                            {getDeviceTypeLabel(device.type as DeviceType)}
                                                        </Tag>
                                                    </TableCell>
                                                    <TableCell>{device.location}</TableCell>
                                                    <TableCell>
                                                        <div className="health-cell">
                                                            <span style={{ color: getHealthColor(device.healthScore) }}>
                                                                {device.healthScore}%
                                                            </span>
                                                            <ProgressBar
                                                                label={`Health: ${device.healthScore}%`}
                                                                value={device.healthScore}
                                                                max={100}
                                                                hideLabel
                                                                size="small"
                                                                status={device.healthScore >= 80 ? 'active' : device.healthScore >= 50 ? 'active' : 'error'}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getStatusTag(device.status)}</TableCell>
                                                    <TableCell>
                                                        {device.recentAlerts > 0 ? (
                                                            <Tag type={device.recentAlerts > 5 ? 'red' : 'magenta'} size="sm">
                                                                {device.recentAlerts}
                                                            </Tag>
                                                        ) : (
                                                            <span className="no-alerts">0</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{device.uptime}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            kind="ghost"
                                                            size="sm"
                                                            hasIconOnly
                                                            iconDescription="View device"
                                                            renderIcon={View}
                                                            onClick={() => handleViewDevice(device.id)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DataTable>
                    <Pagination
                        totalItems={filteredDevices.length}
                        backwardText="Previous page"
                        forwardText="Next page"
                        pageSize={pageSize}
                        pageSizes={[10, 25, 50]}
                        itemsPerPageText="Devices per page:"
                        onChange={({ page, pageSize: newPageSize }) => {
                            setCurrentPage(page);
                            setPageSize(newPageSize);
                        }}
                        page={currentPage}
                    />
                </Tile>
            </div>
        </div>
    );
}

export default DeviceExplorerPage;
