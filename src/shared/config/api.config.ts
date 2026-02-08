/**
 * Copyright IBM Corp. 2026
 *
 * API Configuration
 *
 * Centralized configuration for backend API connectivity.
 * Environment variables are loaded from .env files.
 * All VITE_ prefixed variables are exposed to the client.
 */

// ==========================================
// Environment Configuration
// ==========================================

export const env = {
  // API settings (matches VITE_API_BASE_URL in .env)
  API_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),

  // Mock mode (matches VITE_USE_MOCK in .env)
  useMockData: import.meta.env.VITE_USE_MOCK === 'true',

  // Feature flags
  enableGoogleAuth: import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true',

  // Polling intervals
  alertPollingInterval: parseInt(import.meta.env.VITE_ALERT_POLLING_INTERVAL || '30000', 10),
  dashboardRefreshInterval: parseInt(import.meta.env.VITE_DASHBOARD_REFRESH_INTERVAL || '30000', 10),

  // UI settings
  maxAlertsPerPage: parseInt(import.meta.env.VITE_MAX_ALERTS_PER_PAGE || '20', 10),
  maxRecentAlerts: parseInt(import.meta.env.VITE_MAX_RECENT_ALERTS || '10', 10),
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'system',

  // App info
  appName: import.meta.env.VITE_APP_NAME || 'IBM watsonx Alerts',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // Google OAuth (if enabled)
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Vite mode
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

// Base API URL from environment variable
export const API_BASE_URL = env.API_URL;

/**
 * API Endpoints
 *
 * Centralized endpoint definitions for all API calls.
 * All services MUST import endpoints from here - no hardcoded paths.
 * Matches backend routes defined in api_gateway/main.go
 */
export const API_ENDPOINTS = {
  // ==========================================
  // Auth Endpoints (public - no JWT required)
  // Matches backend routes: /api/v1/login, /api/v1/register
  // ==========================================
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    RESEND_VERIFICATION: '/resend-verification',
    // Google OAuth endpoints (if backend supports)
    GOOGLE_LOGIN: '/google/login',
    GOOGLE_CALLBACK: '/google/callback',
  },

  // ==========================================
  // User Endpoints
  // ==========================================
  ME: '/me',

  // ==========================================
  // Alerts Endpoints
  // ==========================================
  ALERTS: '/alerts',
  ALERTS_SUMMARY: '/alerts/summary',
  ALERT_BY_ID: (id: string) => `/alerts/${id}`,
  ACKNOWLEDGE_ALERT: (id: string) => `/alerts/${id}/acknowledge`,
  DISMISS_ALERT: (id: string) => `/alerts/${id}/dismiss`,
  REANALYZE_ALERT: (id: string) => `/alerts/${id}/reanalyze`,
  ALERTS_OVER_TIME: '/alerts/over-time',
  ALERTS_SEVERITY_DISTRIBUTION: '/alerts/severity-distribution',
  ALERTS_RECURRING: '/alerts/recurring',
  ALERTS_DISTRIBUTION_TIME: '/alerts/distribution/time',

  // ==========================================
  // Devices Endpoints
  // ==========================================
  DEVICES: '/devices',
  DEVICES_NOISY: '/devices/noisy',
  DEVICE_BY_ID: (id: string) => `/devices/${id}`,

  // ==========================================
  // Tickets Endpoints
  // ==========================================
  TICKETS: '/tickets',
  TICKET_BY_ID: (id: string) => `/tickets/${id}`,

  // ==========================================
  // Dashboard / Metrics Endpoints
  // ==========================================
  DASHBOARD_SUMMARY: '/dashboard/summary',
  DASHBOARD_METRICS: '/dashboard/metrics',
  DASHBOARD_CHARTS: '/dashboard/charts',

  // ==========================================
  // Trends Endpoints
  // ==========================================
  TRENDS_KPI: '/trends/kpi',

  // ==========================================
  // AI Endpoints
  // ==========================================
  AI_METRICS: '/ai/metrics',
  AI_INSIGHTS: '/ai/insights',
  AI_IMPACT_OVER_TIME: '/ai/impact-over-time',

  // ==========================================
  // Reports Endpoints
  // ==========================================
  REPORTS_EXPORT: '/reports/export',

  // ==========================================
  // Configuration Endpoints
  // ==========================================
  CONFIG_RULES: '/configuration/rules',
  CONFIG_RULE_BY_ID: (id: string) => `/configuration/rules/${id}`,
  CONFIG_CHANNELS: '/configuration/channels',
  CONFIG_CHANNEL_BY_ID: (id: string) => `/configuration/channels/${id}`,
  CONFIG_POLICIES: '/configuration/policies',
  CONFIG_POLICY_BY_ID: (id: string) => `/configuration/policies/${id}`,
  CONFIG_MAINTENANCE: '/configuration/maintenance',
  CONFIG_MAINTENANCE_BY_ID: (id: string) => `/configuration/maintenance/${id}`,

  // ==========================================
  // User Settings Endpoints
  // ==========================================
  SETTINGS_NOTIFICATIONS: '/settings/notifications',

  // ==========================================
  // Health Check (internal)
  // ==========================================
  HEALTH: '/health',
} as const;

// HTTP request timeout (ms)
export const API_TIMEOUT = env.apiTimeout;

// Default request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
