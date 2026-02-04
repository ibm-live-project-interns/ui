/**
 * Copyright IBM Corp. 2026
 *
 * API Types
 *
 * These types mirror the backend Go models exactly.
 * Any changes to backend models MUST be reflected here.
 *
 * Source files:
 * - ingestor/shared/models/user.go
 * - ingestor/shared/models/alert.go
 * - ingestor/shared/models/ticket.go
 * - ingestor/shared/rbac/permissions.go
 */

// ==========================================
// User & Auth Types (from models/user.go)
// ==========================================

/** User response from API */
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: RoleID;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
}

/** Auth response from login endpoint */
export interface AuthResponse {
  token: string;
  expires_at: string;
  user: User;
  permissions: Permission[];
}

/** Register request payload */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

/** Login request payload */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Forgot password request */
export interface ForgotPasswordRequest {
  email: string;
}

/** Reset password request */
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/** Verify email request */
export interface VerifyEmailRequest {
  token: string;
}

// ==========================================
// RBAC Types (from rbac/permissions.go)
// ==========================================

/** Permission types - MUST be in sync with backend */
export type Permission =
  | 'view-alerts'
  | 'acknowledge-alerts'
  | 'create-tickets'
  | 'view-tickets'
  | 'view-devices'
  | 'manage-devices'
  | 'view-config'
  | 'view-analytics'
  | 'export-reports'
  | 'view-services'
  | 'view-sla'
  | 'view-all'
  | 'view-team-metrics';

/** Role IDs - MUST be in sync with backend */
export type RoleID =
  | 'network-ops'
  | 'sre'
  | 'network-admin'
  | 'senior-eng'
  | 'sysadmin';

/** Role with permissions */
export interface Role {
  id: RoleID;
  name: string;
  permissions: Permission[];
}

/** Role permissions mapping - mirrors backend RolePermissions */
export const ROLE_PERMISSIONS: Record<RoleID, Permission[]> = {
  'network-ops': [
    'view-alerts',
    'acknowledge-alerts',
    'create-tickets',
    'view-tickets',
    'export-reports',
  ],
  'sre': [
    'view-alerts',
    'view-services',
    'view-sla',
    'export-reports',
  ],
  'network-admin': [
    'view-devices',
    'manage-devices',
    'view-config',
    'view-alerts',
  ],
  'senior-eng': [
    'view-all',
    'view-analytics',
    'export-reports',
    'view-team-metrics',
  ],
  'sysadmin': [
    'view-alerts',
    'acknowledge-alerts',
    'create-tickets',
    'view-tickets',
    'view-devices',
    'manage-devices',
    'view-config',
    'view-analytics',
    'export-reports',
    'view-services',
    'view-sla',
    'view-team-metrics',
    'view-all',
  ],
};

/** Role display names */
export const ROLE_NAMES: Record<RoleID, string> = {
  'network-ops': 'Network Operations',
  'sre': 'SRE',
  'network-admin': 'Network Administrator',
  'senior-eng': 'Senior Engineer',
  'sysadmin': 'System Administrator',
};

// ==========================================
// Alert Types (from models/alert.go)
// ==========================================

/** Alert severity levels */
export type AlertSeverity = 'critical' | 'major' | 'minor' | 'info';

/** Alert status lifecycle */
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

/** Alert from API */
export interface Alert {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: string;
  status: AlertStatus;
  source: string;
  source_ip: string;
  device: string;
  timestamp: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_by?: string;
  dismissed_by?: string;
  ai_summary?: string;
  ai_root_cause?: string;
  ai_impact?: string;
  ai_recommendation?: string;
  ai_confidence?: number;
  raw_payload?: string;
  ticket_id?: string;
}

/** Alert summary statistics */
export interface AlertsSummary {
  total: number;
  by_severity: Record<AlertSeverity, number>;
  by_status: Record<AlertStatus, number>;
  by_category: Record<string, number>;
  last_updated: string;
}

/** Severity distribution point */
export interface SeverityDistribution {
  severity: AlertSeverity;
  count: number;
  percent: number;
}

/** Time series data point */
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

/** Recurring alert pattern from API */
export interface RecurringAlertAPIResponse {
  pattern: string;
  count: number;
  first_seen: string;
  last_seen: string;
  devices: string[];
  severity: AlertSeverity;
}

/** Recurring alert for UI display (transformed from API response) */
export interface RecurringAlert {
  id: string;
  name: string;
  count: number;
  severity: AlertSeverity;
  avgResolution: string;
  percentage: number;
  pattern?: string;
  devices?: string[];
  firstSeen?: string;
  lastSeen?: string;
}

/**
 * Noisy device for UI (camelCase)
 * Transformed from NoisyDeviceAPIResponse in service layer
 */
export interface NoisyDevice {
  id: string;
  name: string;
  alertCount: number;
  percentage: number;
  topIssue?: string;
}

// ==========================================
// Ticket Types (from models/ticket.go)
// ==========================================

/** Ticket priority levels */
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

/** Ticket status values */
export type TicketStatus = 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed';

/** Ticket from API */
export interface Ticket {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  assignee?: string;
  reporter: string;
  alert_id?: string;
  device_id?: string;
  due_date?: string;
  resolved_at?: string;
  tags: string[];
}

/** Create ticket request */
export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  alert_id?: string;
  device_id?: string;
  assignee?: string;
  tags?: string[];
}

/** Update ticket request */
export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: string;
  assignee?: string;
  tags?: string[];
}

/** Ticket comment */
export interface TicketComment {
  id: string;
  created_at: string;
  updated_at: string;
  ticket_id: string;
  author: string;
  content: string;
}

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

// ==========================================
// AI/Analytics Types
// ==========================================

/** AI metric */
export interface AIMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  description?: string;
}

/** AI insight */
export interface AIInsight {
  id: string;
  type: 'pattern' | 'optimization' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  action?: string;
  severity?: AlertSeverity;
  confidence?: number;
}

/** Trend KPI */
export interface TrendKPI {
  id: string;
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  subtitle?: string;
  tag?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
  };
}

// ==========================================
// API Response Types
// ==========================================

/** Standard error response */
export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Generic message response */
export interface MessageResponse {
  message: string;
}

// ==========================================
// Chart/UI Types
// ==========================================

/** Chart data point */
export interface ChartDataPoint {
  group: string;
  date: Date | string;
  value: number;
}

/** Distribution data point */
export interface DistributionDataPoint {
  group: string;
  value: number;
}

/** Time period for filtering */
export type TimePeriod = '24h' | '7d' | '30d' | '90d';
