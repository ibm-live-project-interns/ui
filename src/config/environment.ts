/**
 * Environment Configuration
 * Centralized configuration for API endpoints and feature flags
 *
 * @see docs/arch/Output&Integration/Component.puml - System components
 */

interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;
  apiVersion: string;

  // Feature Flags
  enableWebSocket: boolean;
  enableTicketing: boolean;
  enableRAGInsights: boolean;

  // WebSocket Configuration
  wsEndpoint: string;

  // Ticketing Integration (ServiceNow)
  ticketingEnabled: boolean;
  ticketingProvider: 'servicenow' | 'jira' | 'none';

  // Polling intervals (ms)
  alertPollingInterval: number;
  dashboardRefreshInterval: number;

  // UI Settings
  maxAlertsPerPage: number;
  maxRecentAlerts: number;
}

const development: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:8000',
  apiVersion: 'v1',
  enableWebSocket: false,
  enableTicketing: false,
  enableRAGInsights: true,
  wsEndpoint: 'ws://localhost:8000/ws',
  ticketingEnabled: false,
  ticketingProvider: 'none',
  alertPollingInterval: 30000,
  dashboardRefreshInterval: 30000,
  maxAlertsPerPage: 20,
  maxRecentAlerts: 10,
};

const production: EnvironmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  apiVersion: 'v1',
  enableWebSocket: true,
  enableTicketing: true,
  enableRAGInsights: true,
  wsEndpoint: import.meta.env.VITE_WS_ENDPOINT || 'wss://api.example.com/ws',
  ticketingEnabled: true,
  ticketingProvider: 'servicenow',
  alertPollingInterval: 15000,
  dashboardRefreshInterval: 15000,
  maxAlertsPerPage: 50,
  maxRecentAlerts: 20,
};

/**
 * Get environment configuration based on current mode
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const mode = import.meta.env.MODE;
  return mode === 'production' ? production : development;
}

export const env = getEnvironmentConfig();

/**
 * Build full API URL
 * @see docs/arch/Output&Integration/Sequence.puml - API endpoints
 */
export function buildApiUrl(path: string): string {
  return `${env.apiBaseUrl}/api/${env.apiVersion}${path}`;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof Pick<EnvironmentConfig, 'enableWebSocket' | 'enableTicketing' | 'enableRAGInsights'>): boolean {
  return env[feature];
}
