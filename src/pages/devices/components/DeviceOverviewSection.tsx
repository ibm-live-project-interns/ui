/**
 * Copyright IBM Corp. 2026
 *
 * DeviceOverviewSection - Device information tile with status, location,
 * firmware, serial, MAC, uptime, and last-seen details.
 */

import React from 'react';
import { Tile, Tag } from '@carbon/react';
import {
    CheckmarkFilled,
    WarningAlt,
    WarningAltFilled,
    Power,
} from '@carbon/icons-react';
import { RelativeTime } from '@/components/ui';
import { getDeviceIcon } from '@/shared/constants/devices';
import type { DeviceDetails } from '@/shared/services';
import { getStatusConfigKey } from './deviceDetails.types';

// ==========================================
// Types
// ==========================================

export interface DeviceOverviewSectionProps {
    device: DeviceDetails;
}

// ==========================================
// Status config mapping
// ==========================================

const STATUS_CONFIGS = {
    online:   { color: 'green'   as const, icon: CheckmarkFilled,  text: 'Online'   },
    warning:  { color: 'magenta' as const, icon: WarningAlt,       text: 'Warning'  },
    critical: { color: 'red'     as const, icon: WarningAltFilled, text: 'Critical' },
    offline:  { color: 'gray'    as const, icon: Power,            text: 'Offline'  },
};

// ==========================================
// Component
// ==========================================

export const DeviceOverviewSection: React.FC<DeviceOverviewSectionProps> = React.memo(
    function DeviceOverviewSection({ device }) {
        const statusKey = getStatusConfigKey(device.status);
        const statusConfig = STATUS_CONFIGS[statusKey];
        const StatusIcon = statusConfig.icon;

        return (
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
                            <StatusIcon size={12} className="device-details__status-icon" />
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
                        <span
                            className="info-value"
                            title={device.lastSeen ? new Date(device.lastSeen).toLocaleString() : ''}
                        >
                            <RelativeTime timestamp={device.lastSeen} fallback="Unknown" />
                        </span>
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
        );
    }
);
