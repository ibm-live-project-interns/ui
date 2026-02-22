/**
 * Copyright IBM Corp. 2026
 *
 * Dashboard Layout Configuration
 *
 * Defines which widgets appear for each role and their grid span.
 * The DashboardPage reads this config to render the correct widget set.
 */

export interface DashboardWidgetConfig {
  /** Widget identifier - maps to WIDGET_REGISTRY key */
  id: string;
  /** Grid span: full=12col, half=6col, third=4col, two-thirds=8col */
  span: 'full' | 'half' | 'third' | 'two-thirds';
}

/**
 * Role-based dashboard layouts.
 * Keys match RoleConfig.dashboardView (RoleId values).
 */
export const ROLE_DASHBOARD_LAYOUTS: Record<string, DashboardWidgetConfig[]> = {
  'network-ops': [
    { id: 'alert-summary', span: 'full' },
    { id: 'action-required', span: 'half' },
    { id: 'recent-alerts', span: 'half' },
    { id: 'alert-trend', span: 'half' },
    { id: 'noisy-devices', span: 'half' },
    { id: 'on-call', span: 'third' },
    { id: 'ai-insights', span: 'third' },
    { id: 'severity-dist', span: 'third' },
  ],
  'sre': [
    { id: 'alert-summary', span: 'full' },
    { id: 'error-budget', span: 'half' },
    { id: 'sla-compliance', span: 'half' },
    { id: 'alert-trend', span: 'half' },
    { id: 'action-required', span: 'half' },
    { id: 'device-health', span: 'full' },
  ],
  'network-admin': [
    { id: 'alert-summary', span: 'full' },
    { id: 'device-health', span: 'half' },
    { id: 'action-required', span: 'half' },
    { id: 'alert-trend', span: 'half' },
    { id: 'noisy-devices', span: 'half' },
    { id: 'severity-dist', span: 'third' },
    { id: 'on-call', span: 'third' },
    { id: 'ai-insights', span: 'third' },
  ],
  'senior-eng': [
    { id: 'alert-summary', span: 'full' },
    { id: 'alert-trend', span: 'half' },
    { id: 'severity-dist', span: 'half' },
    { id: 'sla-compliance', span: 'half' },
    { id: 'device-health', span: 'half' },
    { id: 'ai-insights', span: 'third' },
    { id: 'noisy-devices', span: 'third' },
    { id: 'action-required', span: 'third' },
  ],
  'sysadmin': [
    { id: 'alert-summary', span: 'full' },
    { id: 'user-management', span: 'half' },
    { id: 'system-health', span: 'half' },
    { id: 'audit-activity', span: 'half' },
    { id: 'action-required', span: 'half' },
    { id: 'device-health', span: 'half' },
    { id: 'alert-trend', span: 'half' },
  ],
};
