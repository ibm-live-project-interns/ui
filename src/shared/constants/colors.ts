/**
 * Color Constants
 *
 * Centralized color definitions for the application.
 * Uses Carbon Design System color tokens where possible.
 *
 * USAGE: Import colors instead of hardcoding hex values.
 * This ensures consistency and makes theme changes easier.
 */

// ==========================================
// Semantic Color Tokens (from Carbon)
// ==========================================

/** Carbon Design System semantic colors */
export const CARBON_COLORS = {
    // Support colors
    error: 'var(--cds-support-error, #da1e28)',
    warning: 'var(--cds-support-warning, #f1c21b)',
    success: 'var(--cds-support-success, #24a148)',
    info: 'var(--cds-support-info, #0043ce)',

    // Interactive colors
    interactive: 'var(--cds-interactive, #0f62fe)',
    linkPrimary: 'var(--cds-link-primary, #0f62fe)',

    // Text colors
    textPrimary: 'var(--cds-text-primary, #161616)',
    textSecondary: 'var(--cds-text-secondary, #525252)',
    textPlaceholder: 'var(--cds-text-placeholder, #a8a8a8)',
    textInverse: 'var(--cds-text-inverse, #ffffff)',

    // Background colors
    background: 'var(--cds-background, #ffffff)',
    layer01: 'var(--cds-layer-01, #f4f4f4)',
    layer02: 'var(--cds-layer-02, #ffffff)',

    // Border colors
    borderSubtle: 'var(--cds-border-subtle-00, #e0e0e0)',
    borderStrong: 'var(--cds-border-strong-01, #8d8d8d)',
} as const;

// ==========================================
// Severity Colors (matches SEVERITY_CONFIG)
// ==========================================

/** Severity color mapping - use these for consistency */
export const SEVERITY_COLORS = {
    critical: '#da1e28',
    high: '#ff832b',
    major: '#ff832b',
    medium: '#f1c21b',
    minor: '#f1c21b',
    low: '#0f62fe',
    info: '#0043ce',
} as const;

/** Severity background colors (with opacity) */
export const SEVERITY_BG_COLORS = {
    critical: 'rgba(218, 30, 40, 0.2)',
    high: 'rgba(255, 131, 43, 0.2)',
    major: 'rgba(255, 131, 43, 0.2)',
    medium: 'rgba(241, 194, 27, 0.2)',
    minor: 'rgba(241, 194, 27, 0.2)',
    low: 'rgba(15, 98, 254, 0.2)',
    info: 'rgba(69, 137, 255, 0.2)',
} as const;

// ==========================================
// Status Colors
// ==========================================

/** Device/System status colors */
export const STATUS_COLORS = {
    online: '#24a148',
    offline: '#6f6f6f',
    warning: '#ff832b',
    critical: '#da1e28',
} as const;

/** Alert status colors */
export const ALERT_STATUS_COLORS = {
    open: '#da1e28',
    acknowledged: '#ff832b',
    resolved: '#24a148',
    dismissed: '#8d8d8d',
} as const;

// ==========================================
// Priority Colors (for Tickets)
// ==========================================

/** Ticket priority colors */
export const PRIORITY_COLORS = {
    critical: '#da1e28',
    high: '#ff832b',
    medium: '#8a3ffc',
    low: '#0f62fe',
} as const;

// ==========================================
// Chart Colors
// ==========================================

/** Standard chart color palette */
export const CHART_COLORS = {
    primary: '#0f62fe',
    secondary: '#8a3ffc',
    tertiary: '#009d9a',
    quaternary: '#ee538b',
    // For severity-based charts
    critical: '#da1e28',
    high: '#ff832b',
    major: '#ff832b',
    medium: '#f1c21b',
    minor: '#f1c21b',
    low: '#0f62fe',
    info: '#4589ff',
} as const;

// ==========================================
// Helper Types
// ==========================================

export type SeverityColorKey = keyof typeof SEVERITY_COLORS;
export type StatusColorKey = keyof typeof STATUS_COLORS;
export type PriorityColorKey = keyof typeof PRIORITY_COLORS;
