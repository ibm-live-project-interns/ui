/**
 * Copyright IBM Corp. 2026
 *
 * Device Service
 *
 * Handles all device-related API operations with mock fallback.
 * Uses centralized types from @/shared/types for consistency.
 * Uses centralized endpoints from @/shared/config for maintainability.
 *
 * Mock mode is controlled by VITE_USE_MOCK in .env
 *
 * Usage:
 *   import { deviceService } from '@/features/devices/services';
 *   const devices = await deviceService.getDevices();
 */

import { HttpService } from '@/shared/api';
import { API_ENDPOINTS, env } from '@/shared/config';
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

// Re-export types for convenience
export type { Device, DeviceDetails, DeviceStats, NoisyDevice, DeviceType, DeviceStatus };

// ==========================================
// API Response Transformers
// ==========================================

/**
 * Transform backend Device (snake_case) to UI Device (camelCase)
 */
function transformDevice(apiDevice: DeviceAPIResponse): Device {
    return {
        id: apiDevice.id,
        name: apiDevice.name,
        ip: apiDevice.ip,
        type: apiDevice.type,
        location: apiDevice.location,
        status: apiDevice.status,
        healthScore: apiDevice.health_score,
        recentAlerts: apiDevice.recent_alerts,
        uptime: apiDevice.uptime,
        lastSeen: apiDevice.last_seen,
        model: apiDevice.model,
        vendor: apiDevice.vendor,
    };
}

/**
 * Transform backend DeviceDetails (snake_case) to UI DeviceDetails (camelCase)
 */
function transformDeviceDetails(apiDevice: DeviceDetailsAPIResponse): DeviceDetails {
    return {
        ...transformDevice(apiDevice),
        firmware: apiDevice.firmware,
        serialNumber: apiDevice.serial_number,
        macAddress: apiDevice.mac_address,
        cpuUsage: apiDevice.cpu_usage,
        memoryUsage: apiDevice.memory_usage,
        networkIn: apiDevice.network_in,
        networkOut: apiDevice.network_out,
    };
}

// Note: NoisyDevice transformation is handled inline in getNoisyDevices
// for flexibility with different API response formats

// ==========================================
// Mock Data Configuration
// ==========================================

/**
 * Mock device data for development/testing.
 * This data is used when VITE_USE_MOCK=true in .env
 *
 * To add more mock devices, simply extend this array.
 * Fields should match the Device interface in @/shared/types
 */
const MOCK_DEVICES: Device[] = [
    {
        id: 'dev-001',
        name: 'Core-SW-01',
        ip: '192.168.1.10',
        type: 'switch',
        location: 'Data Center 1',
        status: 'online',
        healthScore: 98,
        recentAlerts: 0,
        uptime: '45d 12h',
        lastSeen: '2 min ago',
        model: 'Catalyst 9300',
        vendor: 'Cisco',
    },
    {
        id: 'dev-002',
        name: 'FW-DMZ-03',
        ip: '172.16.3.1',
        type: 'firewall',
        location: 'DMZ',
        status: 'warning',
        healthScore: 72,
        recentAlerts: 3,
        uptime: '12d 8h',
        lastSeen: '1 min ago',
        model: 'PA-5220',
        vendor: 'Palo Alto',
    },
    {
        id: 'dev-003',
        name: 'RTR-EDGE-01',
        ip: '10.0.0.1',
        type: 'router',
        location: 'Edge',
        status: 'online',
        healthScore: 95,
        recentAlerts: 1,
        uptime: '120d 3h',
        lastSeen: '30 sec ago',
        model: 'ASR 9000',
        vendor: 'Cisco',
    },
    {
        id: 'dev-004',
        name: 'SRV-DB-01',
        ip: '192.168.10.50',
        type: 'server',
        location: 'Data Center 2',
        status: 'critical',
        healthScore: 35,
        recentAlerts: 8,
        uptime: '2d 1h',
        lastSeen: '5 min ago',
        model: 'PowerEdge R740',
        vendor: 'Dell',
    },
    {
        id: 'dev-005',
        name: 'SW-ACCESS-12',
        ip: '192.168.5.12',
        type: 'switch',
        location: 'Floor 2',
        status: 'offline',
        healthScore: 0,
        recentAlerts: 12,
        uptime: 'N/A',
        lastSeen: '2 hours ago',
        model: '2960-X',
        vendor: 'Cisco',
    },
];

/**
 * Generates mock device details by extending base device data
 * with additional metrics.
 */
function getMockDeviceDetails(id: string): DeviceDetails {
    const device = MOCK_DEVICES.find(d => d.id === id) || MOCK_DEVICES[0];
    return {
        ...device,
        firmware: '17.6.4',
        serialNumber: 'FCW2148L0PQ',
        macAddress: '00:1A:2B:3C:4D:5E',
        cpuUsage: Math.floor(Math.random() * 60) + 20,
        memoryUsage: Math.floor(Math.random() * 50) + 30,
        networkIn: Math.floor(Math.random() * 1000),
        networkOut: Math.floor(Math.random() * 800),
    };
}

/**
 * Calculates device statistics from a list of devices.
 * Used by both Mock and API implementations.
 */
function calculateDeviceStats(devices: Device[]): DeviceStats {
    return devices.reduce(
        (acc, device) => {
            acc.total++;
            switch (device.status) {
                case 'online': acc.online++; break;
                case 'critical': acc.critical++; break;
                case 'warning': acc.warning++; break;
                case 'offline': acc.offline++; break;
            }
            return acc;
        },
        { online: 0, critical: 0, warning: 0, offline: 0, total: 0 }
    );
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

// ==========================================
// Mock Implementation
// ==========================================

/**
 * Mock Device Service
 *
 * Uses static mock data with simulated network delays.
 * Activated when VITE_USE_MOCK=true in .env
 */
class MockDeviceService implements IDeviceService {
    /** Simulated network delay (ms) */
    private readonly MOCK_DELAY = 500;

    async getDevices(): Promise<Device[]> {
        await new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY));
        return [...MOCK_DEVICES]; // Return copy to prevent mutations
    }

    async getDeviceById(id: string): Promise<DeviceDetails> {
        await new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY / 2));
        return getMockDeviceDetails(id);
    }

    async getNoisyDevices(limit = 5): Promise<NoisyDevice[]> {
        await new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY / 2));

        const devicesWithAlerts = MOCK_DEVICES
            .filter(d => d.recentAlerts > 0)
            .sort((a, b) => b.recentAlerts - a.recentAlerts)
            .slice(0, limit);

        const totalAlerts = devicesWithAlerts.reduce((sum, d) => sum + d.recentAlerts, 0);

        return devicesWithAlerts.map(d => ({
            id: d.id,
            name: d.name,
            alertCount: d.recentAlerts,
            percentage: totalAlerts > 0 ? Math.round((d.recentAlerts / totalAlerts) * 100) : 0,
        }));
    }

    async getDeviceStats(): Promise<DeviceStats> {
        await new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY / 2));
        return calculateDeviceStats(MOCK_DEVICES);
    }
}

// ==========================================
// API Implementation
// ==========================================

/**
 * API Device Service
 *
 * Connects to backend API for device operations.
 * Uses centralized API_ENDPOINTS from @/shared/config
 * Extends HttpService for automatic JWT handling.
 * Transforms snake_case API responses to camelCase for UI.
 */
class ApiDeviceService extends HttpService implements IDeviceService {
    constructor() {
        // Build API URL from environment config
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = `${baseUrl}/api/${env.apiVersion}`;
        super(apiPath);
    }

    async getDevices(): Promise<Device[]> {
        try {
            const apiDevices = await this.get<DeviceAPIResponse[]>(API_ENDPOINTS.DEVICES);
            return apiDevices.map(transformDevice);
        } catch (error) {
            // Fallback to mock data if endpoint not implemented
            console.warn('[DeviceService] /devices endpoint not available, using mock data');
            const mockService = new MockDeviceService();
            return mockService.getDevices();
        }
    }

    async getDeviceById(id: string): Promise<DeviceDetails> {
        try {
            const apiDevice = await this.get<DeviceDetailsAPIResponse>(API_ENDPOINTS.DEVICE_BY_ID(id));
            return transformDeviceDetails(apiDevice);
        } catch (error) {
            // Fallback to mock data if endpoint not implemented
            console.warn('[DeviceService] /devices/:id endpoint not available, using mock data');
            const mockService = new MockDeviceService();
            return mockService.getDeviceById(id);
        }
    }

    async getNoisyDevices(limit = 5): Promise<NoisyDevice[]> {
        try {
            const response = await this.get<any[]>(`${API_ENDPOINTS.DEVICES_NOISY}?limit=${limit}`);
            // Handle both backend formats:
            // New: { device: {name, ip, ...}, model, alertCount, severity }
            // Legacy: { device_id, device_name, alert_count, top_issue }
            const devices = Array.isArray(response) ? response : [];
            const totalAlerts = devices.reduce((sum, d) => {
                const count = d.alertCount || d.alert_count || 0;
                return sum + count;
            }, 0);

            return devices.map(d => {
                const alertCount = d.alertCount || d.alert_count || 0;
                const deviceName = d.device?.name || d.device_name || 'Unknown';
                const deviceId = d.device?.ip || d.device_id || deviceName;
                return {
                    id: deviceId,
                    name: deviceName,
                    alertCount,
                    percentage: totalAlerts > 0 ? Math.round((alertCount / totalAlerts) * 100) : 0,
                    topIssue: d.top_issue || d.severity || 'Alert',
                };
            }).slice(0, limit);
        } catch (error) {
            console.warn('[DeviceService] /devices/noisy endpoint error, using mock data');
            const mockService = new MockDeviceService();
            return mockService.getNoisyDevices(limit);
        }
    }

    async getDeviceStats(): Promise<DeviceStats> {
        // Backend doesn't have a dedicated stats endpoint,
        // so we calculate from the devices list
        const devices = await this.getDevices();
        return calculateDeviceStats(devices);
    }
}

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
        console.info('[DeviceService] Using Mock implementation');
        return new MockDeviceService();
    }
    console.info('[DeviceService] Using API:', env.apiBaseUrl);
    return new ApiDeviceService();
}

/** Singleton device service instance */
export const deviceService: IDeviceService = createDeviceService();
