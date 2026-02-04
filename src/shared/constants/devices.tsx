/**
 * Device Constants and Utilities
 *
 * Single source of truth for device-related configurations.
 * Update device types, icons, and filters here to change them application-wide.
 */

import type { ReactElement } from 'react';
import {
    VirtualMachine,
    Firewall,
    Router,
    ServerDns,
    Wifi,
    CheckmarkFilled,
    WarningAlt,
    WarningAltFilled,
    Power,
} from '@carbon/icons-react';
import type { DeviceIcon, DeviceStatus, DeviceType } from '@/shared/types';
import { STATUS_COLORS } from './colors';

// ==========================================
// Device Type Configuration
// ==========================================

/** Device icon component mapping */
export const DEVICE_ICONS: Record<DeviceIcon, typeof VirtualMachine> = {
    switch: VirtualMachine,
    firewall: Firewall,
    router: Router,
    server: ServerDns,
    wireless: Wifi,
};

/** Device type filter options for dropdowns */
export const DEVICE_TYPE_OPTIONS = [
    { id: 'all', text: 'All Types' },
    { id: 'router', text: 'Router' },
    { id: 'switch', text: 'Switch' },
    { id: 'firewall', text: 'Firewall' },
    { id: 'server', text: 'Server' },
    { id: 'wireless', text: 'Wireless' },
] as const;

// ==========================================
// Device Status Configuration
// ==========================================

/** Status icon and color configuration */
export interface DeviceStatusConfig {
    label: string;
    color: 'green' | 'red' | 'gray' | 'magenta';
    icon: typeof CheckmarkFilled;
    iconColor: string;
}

export const DEVICE_STATUS_CONFIG: Record<DeviceStatus, DeviceStatusConfig> = {
    online: {
        label: 'Online',
        color: 'green',
        icon: CheckmarkFilled,
        iconColor: STATUS_COLORS.online,
    },
    warning: {
        label: 'Warning',
        color: 'magenta',
        icon: WarningAlt,
        iconColor: STATUS_COLORS.warning,
    },
    critical: {
        label: 'Critical',
        color: 'red',
        icon: WarningAltFilled,
        iconColor: STATUS_COLORS.critical,
    },
    offline: {
        label: 'Offline',
        color: 'gray',
        icon: Power,
        iconColor: STATUS_COLORS.offline,
    },
};

/** Device status filter options for dropdowns */
export const DEVICE_STATUS_OPTIONS = [
    { id: 'all', text: 'All Status' },
    { id: 'online', text: 'Online' },
    { id: 'warning', text: 'Warning' },
    { id: 'critical', text: 'Critical' },
    { id: 'offline', text: 'Offline' },
] as const;

// ==========================================
// Device Location Configuration
// ==========================================

/** Common location filter options - update to match your infrastructure */
export const DEVICE_LOCATION_OPTIONS = [
    { id: 'all', text: 'All Locations' },
    { id: 'dc1', text: 'Data Center 1' },
    { id: 'dc2', text: 'Data Center 2' },
    { id: 'dmz', text: 'DMZ' },
    { id: 'edge', text: 'Edge' },
    { id: 'floor', text: 'Floor Access' },
] as const;

// ==========================================
// Health Score Configuration
// ==========================================

/** Health score thresholds and colors */
export const HEALTH_THRESHOLDS = {
    good: 80,      // >= 80 = green/good
    warning: 50,   // >= 50 = orange/warning
    critical: 0,   // < 50 = red/critical
} as const;

export const HEALTH_COLORS = {
    good: STATUS_COLORS.online,
    warning: STATUS_COLORS.warning,
    critical: STATUS_COLORS.critical,
} as const;

/**
 * Get color based on health score
 */
export function getHealthColor(score: number): string {
    if (score >= HEALTH_THRESHOLDS.good) return HEALTH_COLORS.good;
    if (score >= HEALTH_THRESHOLDS.warning) return HEALTH_COLORS.warning;
    return HEALTH_COLORS.critical;
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get device icon component by type
 *
 * @param icon - Device type/icon key
 * @param size - Icon size in pixels (default: 20)
 * @param className - CSS class name (default: 'device-icon')
 */
export function getDeviceIcon(
    icon: DeviceIcon | DeviceType,
    size: number = 20,
    className: string = 'device-icon'
): ReactElement {
    const IconComponent = DEVICE_ICONS[icon as DeviceIcon] || DEVICE_ICONS.server;
    return <IconComponent size={size} className={className} />;
}

/**
 * Get status configuration for a device
 */
export function getDeviceStatusConfig(status: DeviceStatus): DeviceStatusConfig {
    return DEVICE_STATUS_CONFIG[status] || DEVICE_STATUS_CONFIG.offline;
}

/**
 * Get display label for device type
 */
export function getDeviceTypeLabel(type: DeviceType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
}
