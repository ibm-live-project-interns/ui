/**
 * Copyright IBM Corp. 2026
 *
 * DeviceTable - Table rendering for the Device Explorer page.
 * Displays device rows with name, type, health, status, alerts, uptime, and actions.
 */

import React from 'react';
import {
    DataTable,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    Button,
    Tag,
    ProgressBar,
    Pagination,
} from '@carbon/react';
import { View } from '@carbon/icons-react';
import type { Device, DeviceType, DeviceStatus } from '@/shared/types';
import {
    getDeviceIcon,
    getDeviceStatusConfig,
    getDeviceTypeLabel,
} from '@/shared/constants';

// ==========================================
// Constants
// ==========================================

const TABLE_HEADERS = [
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
// Props
// ==========================================

export interface DeviceTableProps {
    paginatedDevices: Device[];
    filteredCount: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
    onViewDevice: (deviceId: string) => void;
}

// ==========================================
// Helpers
// ==========================================

function getStatusTag(status: DeviceStatus) {
    const config = getDeviceStatusConfig(status);
    const Icon = config.icon;
    return (
        <Tag type={config.color} size="sm">
            <Icon size={12} className="status-tag-icon" />
            {config.label}
        </Tag>
    );
}

// ==========================================
// Component
// ==========================================

export const DeviceTable = React.memo(function DeviceTable({
    paginatedDevices,
    filteredCount,
    currentPage,
    pageSize,
    onPageChange,
    onViewDevice,
}: DeviceTableProps) {
    return (
        <>
            <DataTable rows={paginatedDevices} headers={TABLE_HEADERS}>
                {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                    <TableContainer aria-label="Network devices with health and status">
                        <Table {...getTableProps()} className="enhanced-data-table">
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
                                    const device = paginatedDevices.find(d => d.id === row.id);
                                    if (!device) return null;
                                    const { key: rowKey, ...rowProps } = getRowProps({ row });
                                    return (
                                        <TableRow key={rowKey} {...rowProps}>
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
                                                    <span className={`health-value health-value--${device.healthScore >= 80 ? 'good' : device.healthScore >= 50 ? 'fair' : 'poor'}`}>
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
                                                    onClick={() => onViewDevice(device.id)}
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
                totalItems={filteredCount}
                backwardText="Previous page"
                forwardText="Next page"
                pageSize={pageSize}
                pageSizes={[10, 25, 50]}
                itemsPerPageText="Devices per page:"
                onChange={({ page, pageSize: newPageSize }) => {
                    onPageChange(page, newPageSize);
                }}
                page={currentPage}
            />
        </>
    );
});
