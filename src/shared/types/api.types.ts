/**
 * Copyright IBM Corp. 2026
 *
 * API Types - Barrel Re-export
 *
 * This file re-exports all API types from domain-specific sub-files
 * and defines cross-domain types (User, Auth, RBAC) that don't belong
 * to a single domain.
 *
 * Import from this file (or from '@/shared/types') for convenience.
 * All existing imports continue to work unchanged.
 *
 * Domain files:
 * - api.types.alerts.ts  -- Alert, AlertSeverity, AlertStatus, etc.
 * - api.types.tickets.ts -- Ticket, TicketPriority, TicketStatus, etc.
 * - api.types.devices.ts -- Device, DeviceType, DeviceStatus, etc.
 * - api.types.config.ts  -- AIMetric, AIInsight, APIError, ChartDataPoint, etc.
 *
 * Source files:
 * - ingestor/shared/models/user.go
 * - ingestor/shared/rbac/permissions.go
 */

// Re-export all domain-specific types
export * from './api.types.alerts';
export * from './api.types.tickets';
export * from './api.types.devices';
export * from './api.types.config';

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
