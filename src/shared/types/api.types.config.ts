/**
 * Copyright IBM Corp. 2026
 *
 * Configuration, AI/Analytics, and Chart/UI API Types
 *
 * Cross-cutting types used across multiple domains:
 * - AI analysis and analytics
 * - Chart data structures
 * - API response wrappers
 */

import type { AlertSeverity } from './api.types.alerts';

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
