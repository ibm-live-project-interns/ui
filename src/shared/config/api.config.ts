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
  appName: import.meta.env.VITE_APP_NAME || 'Sentrix',
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
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    RESEND_VERIFICATION: '/auth/resend-verification',
    // Google OAuth endpoints (if backend supports)
    GOOGLE_LOGIN: '/auth/google/login',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },

  // ==========================================
  // User Endpoints
  // ==========================================
  ME: '/me',
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,

  // ==========================================
  // Alerts Endpoints
  // ==========================================
  ALERTS: '/alerts',
  ALERTS_SUMMARY: '/alerts/summary',
  ALERT_BY_ID: (id: string) => `/alerts/${id}`,
  ACKNOWLEDGE_ALERT: (id: string) => `/alerts/${id}/acknowledge`,
  DISMISS_ALERT: (id: string) => `/alerts/${id}/dismiss`,
  RESOLVE_ALERT: (id: string) => `/alerts/${id}/resolve`,
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
  DEVICE_METRICS: (id: string) => `/devices/${id}/metrics`,

  // ==========================================
  // Tickets Endpoints
  // ==========================================
  TICKETS: '/tickets',
  TICKET_BY_ID: (id: string) => `/tickets/${id}`,
  TICKET_STATS: '/tickets/stats',
  TICKET_EXPORT: '/tickets/export',
  TICKET_COMMENTS: (id: string) => `/tickets/${id}/comments`,

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
  // Audit Log Endpoints
  // ==========================================
  AUDIT_LOGS: '/audit-logs',
  AUDIT_LOG_ACTIONS: '/audit-logs/actions',

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
  // Global settings (maintenance mode, auto-resolve, AI correlation)
  CONFIG_GLOBAL_SETTINGS: '/configuration/global-settings',

  // ==========================================
  // User Settings Endpoints
  // ==========================================
  SETTINGS_NOTIFICATIONS: '/settings/notifications',

  // ==========================================
  // Health Check (internal)
  // ==========================================
  HEALTH: '/health',

  // ==========================================
  // Service Status
  // ==========================================
  SERVICE_STATUS: '/service-status',

  // ==========================================
  // Device Groups
  // ==========================================
  DEVICE_GROUPS: '/device-groups',
  DEVICE_GROUP_BY_ID: (id: string) => `/device-groups/${id}`,

  // ==========================================
  // Docker Container Status & Logs
  // ==========================================
  DOCKER_SERVICES_STATUS: '/services/status',
  DOCKER_SERVICE_LOGS: (name: string) => `/services/${name}/logs`,

  // ==========================================
  // Alert Enrichment Endpoints
  // ==========================================
  ALERTS_BULK_ACTION: '/alerts/bulk-action',
  ALERTS_TICKETS: (id: string) => `/alerts/${id}/tickets`,
  ALERTS_POST_MORTEM: (id: string) => `/alerts/${id}/post-mortem`,

  // ==========================================
  // Runbook Suggestions
  // ==========================================
  RUNBOOKS_SUGGEST: '/runbooks/suggest',

  // ==========================================
  // On-Call Schedules & Overrides
  // ==========================================
  ON_CALL_SCHEDULES: '/on-call/schedules',
  ON_CALL_SCHEDULE_BY_ID: (id: number) => `/on-call/schedules/${id}`,
  ON_CALL_OVERRIDES: '/on-call/overrides',
  ON_CALL_OVERRIDE_BY_ID: (id: number) => `/on-call/overrides/${id}`,
  ON_CALL_CURRENT: '/on-call/current',

  // ==========================================
  // Post-Mortems
  // ==========================================
  POST_MORTEMS: '/post-mortems',
  POST_MORTEM_BY_ID: (id: number) => `/post-mortems/${id}`,
} as const;

// HTTP request timeout (ms)
export const API_TIMEOUT = env.apiTimeout;

// Default request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
