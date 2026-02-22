/**
 * Copyright IBM Corp. 2026
 *
 * Device Service - Type Definitions
 *
 * All interfaces, types, and backend response shapes used by the device service.
 * Separated from implementation for clean dependency management.
 */

import type {
    Device,
    DeviceDetails,
    DeviceStats,
    NoisyDevice,
    DeviceType,
    DeviceStatus,
    DeviceAPIResponse,
    DeviceDetailsAPIResponse,
} from '@/shared/types';

// Re-export shared types for consumers
export type {
    Device,
    DeviceDetails,
    DeviceStats,
    NoisyDevice,
    DeviceType,
    DeviceStatus,
    DeviceAPIResponse,
    DeviceDetailsAPIResponse,
};

// ==========================================
// Backend Response Shapes (snake_case from Go API)
// ==========================================

/** Raw noisy device from backend (may use different field names) */
export interface BackendNoisyDeviceRaw {
    device_id?: string;
    device_name?: string;
    device?: {
        name?: string;
        ip?: string;
    };
    alertCount?: number;
    alert_count?: number;
    top_issue?: string;
    severity?: string;
}

// ==========================================
// Service Interface
// ==========================================

/**
 * Device Service Interface
 * Defines all operations available for device management.
 * Both Mock and API implementations must satisfy this interface.
 */
export interface IDeviceService {
    /** Fetch all devices */
    getDevices(): Promise<Device[]>;

    /** Fetch single device with detailed metrics */
    getDeviceById(id: string): Promise<DeviceDetails>;

    /** Fetch devices with most alerts */
    getNoisyDevices(limit?: number): Promise<NoisyDevice[]>;

    /** Get aggregated device statistics */
    getDeviceStats(): Promise<DeviceStats>;
}
