/**
 * Copyright IBM Corp. 2026
 *
 * Device Details Page
 * Displays detailed information about a specific network device
 *
 * Connects to real API via deviceService and alertDataService.
 * No mock data - shows empty states when data is unavailable.
 */

import {
    Tile,
    Button,
    Tag,
    DataTable,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableContainer,
    InlineNotification,
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
import { PageHeader, KPICard } from '@/components/ui';
import { PageLayout } from '@/components/layout';

import {
    DeviceDetailsSkeleton,
    DeviceOverviewSection,
    DeviceMetricsCharts,
    useDeviceDetails,
    INCIDENT_HEADERS,
    getStatusBadgeColor,
    getStatusConfigKey,
    getHealthColor,
} from './components';

import '@/styles/pages/_device-details.scss';

// ==========================================
// Status config mapping (needed for PageHeader badges)
// ==========================================

const STATUS_CONFIGS = {
    online:   { color: 'green'   as const, icon: CheckmarkFilled,  text: 'Online'   },
    warning:  { color: 'magenta' as const, icon: WarningAlt,       text: 'Warning'  },
    critical: { color: 'red'     as const, icon: WarningAltFilled, text: 'Critical' },
    offline:  { color: 'gray'    as const, icon: Power,            text: 'Offline'  },
};

function getSeverityTag(severity: string) {
    switch (severity) {
        case 'critical': return <Tag type="red" size="sm">CRITICAL</Tag>;
        case 'major': return <Tag type="purple" size="sm">MAJOR</Tag>;
        case 'minor': return <Tag type="blue" size="sm">MINOR</Tag>;
        case 'warning': return <Tag type="warm-gray" size="sm">WARNING</Tag>;
        case 'info': return <Tag type="cyan" size="sm">INFO</Tag>;
        default: return <Tag type="gray" size="sm">{severity.toUpperCase()}</Tag>;
    }
}

export function DeviceDetailsPage() {
    const {
        deviceId,
        theme,
        device,
        metricHistory,
        incidents,
        isLoading,
        metricsLoading,
        error,
        metricsPeriod,
        handlePeriodChange,
        handleRefresh,
        navigateBack,
        navigateToSettings,
        navigateToAlert,
        navigateToTicket,
        navigateToDeviceAlerts,
    } = useDeviceDetails();

    if (isLoading) {
        return <DeviceDetailsSkeleton />;
    }

    if (error || !device) {
        return (
            <PageLayout>
            <div className="device-details-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Devices', href: '/devices' },
                        { label: 'Not Found', active: true },
                    ]}
                    title="Device Not Found"
                    subtitle={`Could not find device with ID: ${deviceId ?? 'unknown'}`}
                    showBorder
                />
                <div className="device-details-page__content">
                    {error && (
                        <InlineNotification
                            kind="error"
                            title="Error"
                            subtitle={error}
                            className="device-details-page__error-notification"
                        />
                    )}
                    <Button kind="secondary" renderIcon={ArrowLeft} onClick={navigateBack}>
                        Back to Device Explorer
                    </Button>
                </div>
            </div>
            </PageLayout>
        );
    }

    const statusKey = getStatusConfigKey(device.status);
    const statusConfig = STATUS_CONFIGS[statusKey];

    return (
        <PageLayout>
        <div className="device-details-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Devices', href: '/devices' },
                    { label: device.name, active: true },
                ]}
                title={device.name}
                subtitle={`${device.ip} • ${device.vendor || 'Unknown Vendor'} ${device.model || ''}`}
                badges={[
                    { text: statusConfig.text, color: getStatusBadgeColor(device.status) }
                ]}
                actions={[
                    { label: 'Refresh', icon: Renew, variant: 'ghost', onClick: handleRefresh },
                    { label: 'Configure', icon: Settings, variant: 'secondary', onClick: navigateToSettings },
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
                        iconColor="var(--cds-interactive, #0f62fe)"
                        severity="info"
                    />
                    <KPICard
                        label="Memory Usage"
                        value={device.memoryUsage !== undefined ? `${device.memoryUsage}%` : 'N/A'}
                        icon={Activity}
                        iconColor="var(--cds-support-info, #8a3ffc)"
                        severity="info"
                    />
                    <KPICard
                        label="Recent Alerts"
                        value={device.recentAlerts}
                        icon={WarningAlt}
                        iconColor={device.recentAlerts > 5 ? 'var(--cds-support-error, #da1e28)' : 'var(--cds-support-warning, #ff832b)'}
                        severity={device.recentAlerts > 5 ? 'critical' : 'major'}
                    />
                </div>

                {/* Details Grid */}
                <div className="details-grid">
                    {/* Device Info */}
                    <DeviceOverviewSection device={device} />

                    {/* Performance Chart */}
                    <DeviceMetricsCharts
                        metricHistory={metricHistory}
                        metricsLoading={metricsLoading}
                        metricsPeriod={metricsPeriod}
                        onPeriodChange={handlePeriodChange}
                        theme={theme}
                    />
                </div>

                {/* Recent Incidents */}
                <Tile className="incidents-tile tile--bordered tile--critical">
                    <div className="incidents-header">
                        <h3>
                            <Activity size={20} />
                            Recent Incidents
                        </h3>
                        <Button kind="ghost" size="sm" onClick={() => navigateToDeviceAlerts(device.name)}>View All Alerts</Button>
                    </div>
                    <div className="incidents-table-container">
                        {incidents.length > 0 ? (
                            <DataTable rows={incidents} headers={INCIDENT_HEADERS}>
                                {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                                    <TableContainer aria-label="Recent device incidents">
                                        <Table {...getTableProps()}>
                                            <TableHead>
                                                <TableRow>
                                                    {headers.map((header) => {
                                                        const { key: headerKey, ...headerProps } = getHeaderProps({ header });
                                                        return (
                                                            <TableHeader key={headerKey} {...headerProps}>
                                                                {header.header}
                                                            </TableHeader>
                                                        );
                                                    })}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {rows.map((row) => {
                                                    const incident = incidents.find(i => i.id === row.id);
                                                    if (!incident) return null;
                                                    const { key: rowKey, ...rowProps } = getRowProps({ row });
                                                    return (
                                                        <TableRow
                                                            key={rowKey}
                                                            {...rowProps}
                                                            onClick={() => navigateToAlert(incident.id)}
                                                            className="incidents-table__row--clickable"
                                                        >
                                                            <TableCell>{incident.time}</TableCell>
                                                            <TableCell>{getSeverityTag(incident.severity)}</TableCell>
                                                            <TableCell>{incident.description}</TableCell>
                                                            <TableCell>{incident.category}</TableCell>
                                                            <TableCell>
                                                                {incident.ticketId ? (
                                                                    <span
                                                                        className="incidents-table__ticket-link"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigateToTicket(incident.ticketId!);
                                                                        }}
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
                            <div className="incidents-table__empty">
                                No recent incidents for this device
                            </div>
                        )}
                    </div>
                </Tile>
            </div>
        </div>
        </PageLayout>
    );
}

export default DeviceDetailsPage;
