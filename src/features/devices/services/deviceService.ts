/**
 * Copyright IBM Corp. 2026
 *
 * Device Service
 *
 * Unified data layer for device operations.
 * Connects to backend API for all device-related operations.
 *
 * Usage:
 *   import { deviceService } from '@/features/devices/services';
 *   const devices = await deviceService.getDevices();
 */

import { env } from '@/shared/config';
import { deviceLogger } from '@/shared/utils/logger';
import { ApiDeviceService, MockDeviceService } from './deviceService.api';
import type { IDeviceService } from './deviceService.types';

// Re-export all types for consumers
export type {
    IDeviceService,
    Device,
    DeviceDetails,
    DeviceStats,
    NoisyDevice,
    DeviceType,
    DeviceStatus,
} from './deviceService.types';

// ==========================================
// Service Factory & Export
// ==========================================

/**
 * Creates the appropriate device service based on environment config.
 *
 * @returns Mock service if VITE_USE_MOCK=true, otherwise API service
 */
function createDeviceService(): IDeviceService {
    if (env.useMockData) {
        deviceLogger.info('Using Mock implementation');
        return new MockDeviceService();
    }
    deviceLogger.info('Using API: ' + env.apiBaseUrl);
    return new ApiDeviceService();
}

/** Singleton device service instance */
export const deviceService: IDeviceService = createDeviceService();
