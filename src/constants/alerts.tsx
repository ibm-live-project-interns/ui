/**
 * Alert System - Types, Constants, and Helpers
 * 
 * Single source of truth for all alert-related definitions.
 * 
 * Usage:
 *   import { Severity, getSeverityTag, SEVERITY_CONFIG } from '@/constants/alerts';
 */

import type { ReactElement } from 'react';
import { Tag } from '@carbon/react';
import {
    ErrorFilled,
    WarningFilled,
    WarningAlt,
    InformationFilled,
    VirtualMachine,
    Firewall,
    Router,
    ServerDns,
    Wifi,
} from '@carbon/icons-react';
import { ScaleTypes } from '@carbon/charts';


// ==========================================
// Type Definitions
// ==========================================

/** Severity levels - lowercase for consistency */
export type Severity = 'critical' | 'major' | 'minor' | 'info';

/** Alert status lifecycle */
export type AlertStatus = 'new' | 'acknowledged' | 'in-progress' | 'resolved' | 'dismissed';

/** Device icon types */
export type DeviceIcon = 'switch' | 'firewall' | 'router' | 'server' | 'wireless';

/** Time period options */
export type TimePeriod = '24h' | '7d' | '30d' | '90d';

/** Display versions (capitalized) */
export type SeverityDisplay = 'Critical' | 'Major' | 'Minor' | 'Info';
export type StatusDisplay = 'New' | 'Acknowledged' | 'In Progress' | 'Resolved' | 'Dismissed';

// ==========================================
// Data Interfaces
// ==========================================

export interface DeviceInfo {
    name: string;
    ip: string;
    icon: DeviceIcon;
    model?: string;
    vendor?: string;
    location?: string;
}

export interface ExtendedDeviceInfo extends DeviceInfo {
    interface?: string;
    interfaceAlias?: string;
}

export interface TimestampInfo {
    absolute: string;
    relative?: string;
}

export interface BaseAlert {
    id: string;
    severity: Severity;
    status: AlertStatus;
    timestamp: TimestampInfo;
    device: DeviceInfo;
}

export interface SummaryAlert extends BaseAlert {
    aiSummary: string;
}

export interface PriorityAlert extends SummaryAlert {
    aiTitle: string;
    confidence: number;
}

export interface HistoricalAlert {
    id: string;
    timestamp: string;
    title: string;
    resolution: string;
    severity: Severity;
}

export interface DetailedAlert extends PriorityAlert {
    similarEvents: number;
    aiAnalysis: {
        summary: string;
        rootCauses: string[];
        businessImpact: string;
        recommendedActions: string[];
    };
    rawData: string;
    extendedDevice: ExtendedDeviceInfo;
    history: HistoricalAlert[];
}

export interface ChartDataPoint {
    group: string;
    date: Date;
    value: number;
}

export interface DistributionDataPoint {
    group: string;
    value: number;
}

export interface NoisyDevice {
    device: DeviceInfo;
    model: string;
    alertCount: number;
    severity: Severity;
}

export interface AIMetric {
    name: string;
    value: number;
    change: string;
    trend: 'positive' | 'negative' | 'neutral';
}

export interface AlertSummary {
    activeCount: number;
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    infoCount: number;
}

// ==========================================
// Severity Configuration (Single Source of Truth)
// ==========================================

export interface SeverityConfig {
    label: SeverityDisplay;
    color: string;
    backgroundColor: string;
    tagType: 'red' | 'magenta' | 'purple' | 'blue';
    icon: typeof ErrorFilled;
    description: string;
    priority: number;
}

export const SEVERITY_CONFIG: Record<Severity, SeverityConfig> = {
    critical: {
        label: 'Critical',
        color: '#da1e28',
        backgroundColor: 'rgba(218, 30, 40, 0.2)',
        tagType: 'red',
        icon: ErrorFilled,
        description: 'Requires immediate action',
        priority: 1,
    },
    major: {
        label: 'Major',
        color: '#ff832b',
        backgroundColor: 'rgba(255, 131, 43, 0.2)',
        tagType: 'magenta',
        icon: WarningFilled,
        description: 'High priority issues',
        priority: 2,
    },
    minor: {
        label: 'Minor',
        color: '#f1c21b',
        backgroundColor: 'rgba(241, 194, 27, 0.2)',
        tagType: 'purple',
        icon: WarningAlt,
        description: 'Monitor closely',
        priority: 3,
    },
    info: {
        label: 'Info',
        color: '#4589ff',
        backgroundColor: 'rgba(69, 137, 255, 0.2)',
        tagType: 'blue',
        icon: InformationFilled,
        description: 'Informational only',
        priority: 4,
    },
};

// ==========================================
// Status Configuration
// ==========================================

export interface StatusConfig {
    label: StatusDisplay;
    tagType: 'teal' | 'blue' | 'cyan' | 'green' | 'gray';
}

export const STATUS_CONFIG: Record<AlertStatus, StatusConfig> = {
    new: { label: 'New', tagType: 'teal' },
    acknowledged: { label: 'Acknowledged', tagType: 'blue' },
    'in-progress': { label: 'In Progress', tagType: 'cyan' },
    resolved: { label: 'Resolved', tagType: 'green' },
    dismissed: { label: 'Dismissed', tagType: 'gray' },
};

// ==========================================
// Device Icons
// ==========================================

export const DEVICE_ICONS: Record<DeviceIcon, typeof VirtualMachine> = {
    switch: VirtualMachine,
    firewall: Firewall,
    router: Router,
    server: ServerDns,
    wireless: Wifi,
};

// ==========================================
// Chart Color Scale (for Carbon Charts)
// ==========================================

export const CHART_COLOR_SCALE: Record<SeverityDisplay, string> = {
    Critical: SEVERITY_CONFIG.critical.color,
    Major: SEVERITY_CONFIG.major.color,
    Minor: SEVERITY_CONFIG.minor.color,
    Info: SEVERITY_CONFIG.info.color,
};

// ==========================================
// Helper Functions - Converters
// ==========================================

export function normalizeSeverity(severity: string): Severity {
    const lower = severity.toLowerCase();
    if (['critical', 'major', 'minor', 'info'].includes(lower)) {
        return lower as Severity;
    }
    return 'info';
}

export function normalizeStatus(status: string): AlertStatus {
    const lower = status.toLowerCase().replace(' ', '-');
    if (['new', 'acknowledged', 'in-progress', 'resolved', 'dismissed'].includes(lower)) {
        return lower as AlertStatus;
    }
    return 'new';
}

export function toDisplaySeverity(severity: Severity): SeverityDisplay {
    return SEVERITY_CONFIG[severity].label;
}

export function toDisplayStatus(status: AlertStatus): StatusDisplay {
    return STATUS_CONFIG[status].label;
}

// ==========================================
// Helper Functions - Component Renderers
// ==========================================

export function getSeverityIcon(severity: Severity, size: number = 24): ReactElement {
    const config = SEVERITY_CONFIG[severity];
    const IconComponent = config.icon;
    return <IconComponent size={size} style={{ color: config.color }} />;
}

export function getSeverityTag(severity: Severity, size: 'sm' | 'md' = 'sm'): ReactElement {
    const config = SEVERITY_CONFIG[severity];
    return <Tag type={config.tagType} size={size}>{config.label}</Tag>;
}

export function getStatusTag(status: AlertStatus, size: 'sm' | 'md' = 'sm'): ReactElement {
    const config = STATUS_CONFIG[status];
    return <Tag type={config.tagType} size={size}>{config.label}</Tag>;
}

export function getDeviceIcon(icon: DeviceIcon, size: number = 20, className: string = 'device-icon'): ReactElement {
    const IconComponent = DEVICE_ICONS[icon] || DEVICE_ICONS.server;
    return <IconComponent size={size} className={className} />;
}

export function getSeverityBackgroundClass(severity: Severity): string {
    return `severity-bg severity-bg--${severity}`;
}

// ==========================================
// Chart Options Factory (Carbon Charts)
// ==========================================

export interface ChartOptionsConfig {
    title: string;
    height?: string;
    theme: string;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    showTitle?: boolean;
}

export function createBaseChartOptions(config: ChartOptionsConfig) {
    const showTitle = config.showTitle !== false;
    return {
        ...(showTitle && { title: config.title }),
        height: config.height || '320px',
        color: { scale: CHART_COLOR_SCALE },
        legend: {
            position: config.legendPosition || 'top',
            alignment: 'center' as const,
        },
        toolbar: { enabled: true },
        theme: config.theme,
    };
}

export function createAreaChartOptions(config: ChartOptionsConfig) {
    return {
        ...createBaseChartOptions(config),
        axes: {
            left: { stacked: true, scaleType: ScaleTypes.LINEAR, mapsTo: 'value' },
            bottom: { scaleType: ScaleTypes.TIME, mapsTo: 'date' },
        },
        curve: 'curveMonotoneX',
        timeScale: { addSpaceOnEdges: 0 },
    };
}

export function createDonutChartOptions(config: ChartOptionsConfig) {
    return {
        ...createBaseChartOptions({ ...config, legendPosition: 'bottom' }),
        resizable: true,
        donut: { center: { label: 'Alerts' } },
    };
}

// ==========================================
// Sorting Utilities
// ==========================================

export function sortBySeverity<T extends { severity: Severity }>(items: T[]): T[] {
    return [...items].sort((a, b) =>
        SEVERITY_CONFIG[a.severity].priority - SEVERITY_CONFIG[b.severity].priority
    );
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'major', 'minor', 'info'];
export const STATUS_ORDER: AlertStatus[] = ['new', 'acknowledged', 'in-progress', 'resolved', 'dismissed'];
