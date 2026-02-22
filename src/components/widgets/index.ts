/**
 * Copyright IBM Corp. 2026
 *
 * Widgets Index
 *
 * Barrel export for all dashboard widgets and the widget registry.
 * The WIDGET_REGISTRY maps string IDs to React components for the
 * layout-driven dashboard shell.
 */

import type { ComponentType } from 'react';

// Existing widgets
export * from './TopInterfaces';
export * from './ConfigAuditLog';

// Shared widget primitives
export { WidgetSkeleton } from './WidgetSkeleton';
export { WidgetError } from './WidgetError';

// Dashboard widgets
export { AlertSummaryWidget } from './AlertSummaryWidget';
export { AlertTrendWidget } from './AlertTrendWidget';
export { SeverityDistWidget } from './SeverityDistWidget';
export { NoisyDevicesWidget } from './NoisyDevicesWidget';
export { RecentAlertsWidget } from './RecentAlertsWidget';
export { DeviceHealthWidget } from './DeviceHealthWidget';
export { SLAComplianceWidget } from './SLAComplianceWidget';
export { ErrorBudgetWidget } from './ErrorBudgetWidget';
export { AIInsightsWidget } from './AIInsightsWidget';
export { UserManagementWidget } from './UserManagementWidget';
export { AuditActivityWidget } from './AuditActivityWidget';
export { SystemHealthWidget } from './SystemHealthWidget';
export { OnCallWidget } from './OnCallWidget';
export { ActionRequiredWidget } from './ActionRequiredWidget';

// ==========================================
// Widget Registry
// ==========================================

import { AlertSummaryWidget } from './AlertSummaryWidget';
import { AlertTrendWidget } from './AlertTrendWidget';
import { SeverityDistWidget } from './SeverityDistWidget';
import { NoisyDevicesWidget } from './NoisyDevicesWidget';
import { RecentAlertsWidget } from './RecentAlertsWidget';
import { DeviceHealthWidget } from './DeviceHealthWidget';
import { SLAComplianceWidget } from './SLAComplianceWidget';
import { ErrorBudgetWidget } from './ErrorBudgetWidget';
import { AIInsightsWidget } from './AIInsightsWidget';
import { UserManagementWidget } from './UserManagementWidget';
import { AuditActivityWidget } from './AuditActivityWidget';
import { SystemHealthWidget } from './SystemHealthWidget';
import { OnCallWidget } from './OnCallWidget';
import { ActionRequiredWidget } from './ActionRequiredWidget';

/**
 * Maps widget IDs (from dashboardLayouts.ts) to their React components.
 * Used by DashboardPage to render the correct widget based on the role's layout config.
 */
export const WIDGET_REGISTRY: Record<string, ComponentType<{ className?: string }>> = {
  'alert-summary': AlertSummaryWidget,
  'alert-trend': AlertTrendWidget,
  'severity-dist': SeverityDistWidget,
  'noisy-devices': NoisyDevicesWidget,
  'recent-alerts': RecentAlertsWidget,
  'device-health': DeviceHealthWidget,
  'sla-compliance': SLAComplianceWidget,
  'error-budget': ErrorBudgetWidget,
  'ai-insights': AIInsightsWidget,
  'user-management': UserManagementWidget,
  'audit-activity': AuditActivityWidget,
  'system-health': SystemHealthWidget,
  'on-call': OnCallWidget,
  'action-required': ActionRequiredWidget,
};
