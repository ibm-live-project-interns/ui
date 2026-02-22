/**
 * Copyright IBM Corp. 2026
 *
 * Device API Types
 *
 * These types mirror the backend Go device models exactly.
 * Any changes to backend models MUST be reflected here.
 */

// ==========================================
// Device Types
// ==========================================

/** Device types */
export type DeviceType = 'router' | 'switch' | 'firewall' | 'server' | 'wireless';

/** Device operational status */
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'critical';

/**
 * Device from API (UI-friendly camelCase)
 * Note: Backend returns snake_case; transform in service layer
 */
export interface Device {
  id: string;
  name: string;
  ip: string;
  type: DeviceType;
  location: string;
  status: DeviceStatus;
  healthScore: number;
  recentAlerts: number;
  uptime: string;
  lastSeen: string;
  model?: string;
  vendor?: string;
}

/**
 * Device with detailed metrics (UI-friendly camelCase)
 * Note: Backend returns snake_case; transform in service layer
 */
export interface DeviceDetails extends Device {
  firmware?: string;
  serialNumber?: string;
  macAddress?: string;
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
}

/** Device from backend API (raw snake_case) */
export interface DeviceAPIResponse {
  id: string;
  name: string;
  ip: string;
  type: DeviceType;
  location: string;
  status: DeviceStatus;
  health_score: number;
  recent_alerts: number;
  uptime: string;
  last_seen: string;
  model?: string;
  vendor?: string;
}

/** Device details from backend API (raw snake_case) */
export interface DeviceDetailsAPIResponse extends DeviceAPIResponse {
  firmware?: string;
  serial_number?: string;
  mac_address?: string;
  cpu_usage: number;
  memory_usage: number;
  network_in: number;
  network_out: number;
}

/** Noisy device from backend API (raw snake_case) */
export interface NoisyDeviceAPIResponse {
  device_id: string;
  device_name: string;
  alert_count: number;
  top_issue: string;
}

/** Device statistics */
export interface DeviceStats {
  online: number;
  critical: number;
  warning: number;
  offline: number;
  total: number;
}
