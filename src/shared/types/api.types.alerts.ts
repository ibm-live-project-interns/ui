/**
 * Copyright IBM Corp. 2026
 *
 * Alert API Types
 *
 * These types mirror the backend Go alert models exactly.
 * Any changes to backend models MUST be reflected here.
 *
 * Source files:
 * - ingestor/shared/models/alert.go
 */

// ==========================================
// Alert Types (from models/alert.go)
// ==========================================

/** Alert severity levels */
export type AlertSeverity = 'critical' | 'high' | 'major' | 'medium' | 'minor' | 'low' | 'info';

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
