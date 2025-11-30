/**
 * API Configuration for Agents-api
 * @see docs/arch/Output&Integration - Agents-api endpoints
 */

/**
 * Environment-based API configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Get API configuration based on environment
 */
export function getApiConfig(): ApiConfig {
  const env = import.meta.env.MODE;

  const configs: Record<string, ApiConfig> = {
    development: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    production: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    test: {
      baseUrl: 'http://localhost:8080/api/v1',
      timeout: 5000,
      retryAttempts: 0,
      retryDelay: 0,
    },
  };

  return configs[env] || configs.development;
}

/**
 * API Endpoints
 * Maps to Agents-api routes
 */
export const API_ENDPOINTS = {
  // Alerts
  ALERTS: '/alerts',
  ALERT_BY_ID: (id: string) => `/alerts/${id}`,
  ALERT_STATUS: (id: string) => `/alerts/${id}/status`,
  ALERTS_SUMMARY: '/alerts/summary',
  ALERTS_SEVERITY_DISTRIBUTION: '/alerts/severity-distribution',

  // Devices (future use)
  DEVICES: '/devices',
  DEVICE_BY_ID: (id: string) => `/devices/${id}`,

  // Health & Status
  HEALTH: '/health',
  STATUS: '/status',
} as const;

/**
 * Polling intervals for real-time updates (in milliseconds)
 */
export const POLLING_INTERVALS = {
  ALERTS: 10000, // 10 seconds
  DASHBOARD: 30000, // 30 seconds
  HEALTH: 60000, // 1 minute
} as const;

/**
 * WebSocket configuration (future use)
 */
export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectAttempts: 5,
  reconnectDelay: 3000,
} as const;

export const apiConfig = getApiConfig();
