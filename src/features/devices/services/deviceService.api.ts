/**
 * Copyright IBM Corp. 2026
 *
 * Device Service - Mock & API Implementations
 *
 * Contains both the real backend API client and the static mock
 * implementation for device operations.
 * Extends HttpService for authenticated HTTP requests.
 */

import { HttpService } from '@/shared/api';
import { API_ENDPOINTS, env } from '@/shared/config';
import { deviceLogger } from '@/shared/utils/logger';
import type {
    Device,
    DeviceDetails,
    DeviceStats,
    DeviceAPIResponse,
    DeviceDetailsAPIResponse,
    NoisyDevice,
    DeviceStatus,
    IDeviceService,
    BackendNoisyDeviceRaw,
} from './deviceService.types';

// ==========================================
// API Response Transformers
// ==========================================

/**
 * Normalize backend device status to one of the four UI-recognized values.
 * The database may store statuses like "active" or "maintenance" that differ
 * from the UI's expected "online" | "offline" | "warning" | "critical".
 */
function normalizeDeviceStatus(raw: string): DeviceStatus {
    switch (raw?.toLowerCase()) {
        case 'online':
        case 'active':
        case 'up':
            return 'online';
        case 'offline':
        case 'down':
        case 'unreachable':
            return 'offline';
        case 'critical':
        case 'error':
            return 'critical';
        case 'warning':
        case 'degraded':
        case 'maintenance':
            return 'warning';
        default:
            return 'online';
    }
}

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
        status: normalizeDeviceStatus(apiDevice.status as string),
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
        cpuUsage: 42,
        memoryUsage: 56,
        networkIn: 524,
        networkOut: 312,
    };
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
export class MockDeviceService implements IDeviceService {
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
export class ApiDeviceService extends HttpService implements IDeviceService {
    constructor() {
        // Build API URL from environment config
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = `${baseUrl}/api/${env.apiVersion}`;
        super(apiPath);
    }

    /**
     * Determine if an error is a network/connectivity error (suitable for mock fallback)
     * vs an auth or server error (should be thrown to the caller).
     */
    private isNetworkError(error: unknown): boolean {
        if (error instanceof TypeError && error.message.includes('fetch')) return true;
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('unable to connect') || msg.includes('timed out') || msg.includes('network')) return true;
        }
        return false;
    }

    /**
     * Determine if an error is an auth error (401/403) that must not be swallowed.
     */
    private isAuthOrServerError(error: unknown): boolean {
        if (error instanceof Error) {
            const msg = error.message;
            // HttpService throws "Session expired" for 401 and "HTTP Error: 4xx/5xx" for others
            if (msg.includes('Session expired') || msg.includes('403') || msg.includes('401')) return true;
            if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return true;
        }
        return false;
    }

    async getDevices(): Promise<Device[]> {
        try {
            const response = await this.get<{ devices: DeviceAPIResponse[]; total: number } | DeviceAPIResponse[]>(API_ENDPOINTS.DEVICES);
            // API returns {devices: [...], total: N} wrapper - extract the array
            const apiDevices = Array.isArray(response) ? response : (response.devices ?? []);
            return apiDevices.map(transformDevice);
        } catch (error) {
            // Re-throw auth and server errors -- only fall back to mock on network errors or when mock mode is enabled
            if (this.isAuthOrServerError(error)) throw error;
            if (env.useMockData || this.isNetworkError(error)) {
                deviceLogger.warn('/devices endpoint not available, using mock data');
                const mockService = new MockDeviceService();
                return mockService.getDevices();
            }
            throw error;
        }
    }

    async getDeviceById(id: string): Promise<DeviceDetails> {
        try {
            const apiDevice = await this.get<DeviceDetailsAPIResponse>(API_ENDPOINTS.DEVICE_BY_ID(id));
            return transformDeviceDetails(apiDevice);
        } catch (error) {
            if (this.isAuthOrServerError(error)) throw error;
            if (env.useMockData || this.isNetworkError(error)) {
                deviceLogger.warn('/devices/:id endpoint not available, using mock data');
                const mockService = new MockDeviceService();
                return mockService.getDeviceById(id);
            }
            throw error;
        }
    }

    async getNoisyDevices(limit = 5): Promise<NoisyDevice[]> {
        try {
            const response = await this.get<BackendNoisyDeviceRaw[]>(`${API_ENDPOINTS.DEVICES_NOISY}?limit=${limit}`);
            // Handle both backend formats:
            // New: { device: {name, ip, ...}, model, alertCount, severity }
            // Legacy: { device_id, device_name, alert_count, top_issue }
            const devices: BackendNoisyDeviceRaw[] = Array.isArray(response) ? response : [];
            const totalAlerts = devices.reduce((sum, d) => {
                const count = d.alertCount || d.alert_count || 0;
                return sum + count;
            }, 0);

            return devices.map((d: BackendNoisyDeviceRaw) => {
                const alertCount = d.alertCount || d.alert_count || 0;
                const deviceName = d.device?.name || d.device_name || 'Unknown';
                const deviceId = d.device?.ip || d.device_id || deviceName;
                return {
                    id: deviceId || '',
                    name: deviceName,
                    alertCount,
                    percentage: totalAlerts > 0 ? Math.round((alertCount / totalAlerts) * 100) : 0,
                    topIssue: d.top_issue || d.severity || 'Alert',
                };
            }).slice(0, limit);
        } catch (error) {
            if (this.isAuthOrServerError(error)) throw error;
            if (env.useMockData || this.isNetworkError(error)) {
                deviceLogger.warn('/devices/noisy endpoint error, using mock data');
                const mockService = new MockDeviceService();
                return mockService.getNoisyDevices(limit);
            }
            throw error;
        }
    }

    async getDeviceStats(): Promise<DeviceStats> {
        // Backend doesn't have a dedicated stats endpoint,
        // so we calculate from the devices list
        const devices = await this.getDevices();
        return calculateDeviceStats(devices);
    }
}
