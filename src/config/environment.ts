/**
 * Environment Configuration
 * 
 * Centralized configuration for the application including:
 * - API endpoints and base URLs
 * - Feature flags (WebSocket, ticketing, RAG)
 * - Polling intervals
 * - Mock data switching
 * 
 * Usage:
 *   import { env, API_ENDPOINTS, buildApiUrl } from '@/config';
 */

// ==========================================
// Types
// ==========================================

interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;
  apiVersion: string;
  apiTimeout: number;
  apiRetryAttempts: number;
  apiRetryDelay: number;

  // Data Source
  useMockData: boolean;

  // Feature Flags
  enableWebSocket: boolean;
  enableTicketing: boolean;
  enableRAGInsights: boolean;

  // WebSocket Configuration
  wsEndpoint: string;
  wsReconnectAttempts: number;
  wsReconnectDelay: number;

  // Ticketing Integration
  ticketingProvider: 'servicenow' | 'jira' | 'none';

  // Polling intervals (ms)
  alertPollingInterval: number;
  dashboardRefreshInterval: number;
  healthCheckInterval: number;

  // UI Settings
  maxAlertsPerPage: number;
  maxRecentAlerts: number;
}

// ==========================================
// Environment Configurations
// ==========================================

const development: EnvironmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  apiVersion: 'v1',
  apiTimeout: 30000,
  apiRetryAttempts: 3,
  apiRetryDelay: 1000,

  // In development, use mock data unless explicitly disabled
  useMockData: import.meta.env.VITE_USE_MOCK !== 'false',

  enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
  enableTicketing: false,
  enableRAGInsights: true,

  wsEndpoint: import.meta.env.VITE_WS_ENDPOINT || 'ws://localhost:8080/ws',
  wsReconnectAttempts: 5,
  wsReconnectDelay: 3000,

  ticketingProvider: 'none',

  alertPollingInterval: 30000,
  dashboardRefreshInterval: 30000,
  healthCheckInterval: 60000,

  maxAlertsPerPage: 20,
  maxRecentAlerts: 10,
};

const production: EnvironmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  apiVersion: 'v1',
  apiTimeout: 30000,
  apiRetryAttempts: 3,
  apiRetryDelay: 1000,

  // In production, use real API unless explicitly using mocks (e.g., for demos)
  useMockData: import.meta.env.VITE_USE_MOCK === 'true',

  enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false',
  enableTicketing: true,
  enableRAGInsights: true,

  wsEndpoint: import.meta.env.VITE_WS_ENDPOINT || 'wss://api.example.com/ws',
  wsReconnectAttempts: 5,
  wsReconnectDelay: 3000,

  ticketingProvider: 'servicenow',

  alertPollingInterval: 15000,
  dashboardRefreshInterval: 15000,
  healthCheckInterval: 60000,

  maxAlertsPerPage: 50,
  maxRecentAlerts: 20,
};

const test: EnvironmentConfig = {
  ...development,
  useMockData: true,
  apiTimeout: 5000,
  apiRetryAttempts: 0,
  apiRetryDelay: 0,
};

// ==========================================
// Environment Selection
// ==========================================

function getEnvironmentConfig(): EnvironmentConfig {
  const mode = import.meta.env.MODE;
  switch (mode) {
    case 'production':
      return production;
    case 'test':
      return test;
    default:
      return development;
  }
}

export const env = getEnvironmentConfig();

// ==========================================
// API Endpoints
// ==========================================

export const API_ENDPOINTS = {
  // Alerts
  ALERTS: '/alerts',
  ALERT_BY_ID: (id: string) => `/alerts/${id}`,
  ALERT_STATUS: (id: string) => `/alerts/${id}/status`,
  ALERTS_SUMMARY: '/alerts/summary',
  ALERTS_SEVERITY_DISTRIBUTION: '/alerts/severity-distribution',
  ALERTS_OVER_TIME: '/alerts/over-time',

  // Devices
  DEVICES: '/devices',
  DEVICE_BY_ID: (id: string) => `/devices/${id}`,
  DEVICES_NOISY: '/devices/noisy',

  // Health & Status
  HEALTH: '/health',
  STATUS: '/status',

  // AI/RAG
  AI_METRICS: '/ai/metrics',
  RAG_INSIGHTS: (alertId: string) => `/rag/insights/${alertId}`,
} as const;

// ==========================================
// Helper Functions
// ==========================================

/**
 * Build full API URL from endpoint path
 */
export function buildApiUrl(path: string): string {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}/api/${env.apiVersion}${cleanPath}`;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: 'enableWebSocket' | 'enableTicketing' | 'enableRAGInsights'
): boolean {
  return env[feature];
}

/**
 * Check if using mock data
 */
export function isMockMode(): boolean {
  return env.useMockData;
}
