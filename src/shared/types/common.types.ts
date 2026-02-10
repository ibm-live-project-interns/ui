/**
 * Common Types
 *
 * UI-specific type extensions and display variants.
 * Re-exports core types from api.types.ts for convenience.
 *
 * Use api.types.ts for types that mirror backend Go models.
 * Use this file for UI display variants and derived types.
 */

import type {
    AlertSeverity,
    AlertStatus as ApiAlertStatus,
} from './api.types';

// ==========================================
// Type Aliases for Convenience
// ==========================================

/** Severity levels - alias for AlertSeverity */
export type Severity = AlertSeverity;

/** Alert status lifecycle - alias for API AlertStatus */
export type AlertStatus = ApiAlertStatus;

/** Device icon types - matches DeviceType for icon component mapping */
export type DeviceIcon = 'switch' | 'firewall' | 'router' | 'server' | 'wireless';

// ==========================================
// Display Types (UI Labels - Capitalized)
// ==========================================

/** Display versions (capitalized) for UI rendering - matches backend status values */
export type SeverityDisplay = 'Critical' | 'High' | 'Major' | 'Medium' | 'Minor' | 'Low' | 'Info';
export type StatusDisplay = 'Open' | 'Acknowledged' | 'Resolved' | 'Dismissed';
export type DeviceStatusDisplay = 'Online' | 'Offline' | 'Warning' | 'Critical';

// ==========================================
// Device UI Interfaces
// ==========================================

/** Basic device information for display */
export interface DeviceInfo {
    name: string;
    ip: string;
    icon: DeviceIcon;
    model?: string;
    vendor?: string;
    location?: string;
}

/** Extended device info with interface details */
export interface ExtendedDeviceInfo extends DeviceInfo {
    interface?: string;
    interfaceAlias?: string;
}

// ==========================================
// Chart & Data UI Interfaces
// ==========================================

/** Timestamp with both absolute and relative formats for display */
export interface TimestampInfo {
    absolute: string;
    relative?: string;
}

/** Noisy device summary for dashboard widgets - UI-friendly format */
export interface NoisyDeviceUI {
    id: string;
    name: string;
    alertCount: number;
    percentage: number;
}
