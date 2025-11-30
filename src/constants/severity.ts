/**
 * Centralized Severity Constants
 * Eliminates duplication across AlertService, AlertDetailPage, and components
 */

import type { AlertSeverity } from '../models';

/**
 * Map severity levels to Carbon Design System Tag colors
 * @see https://carbondesignsystem.com/components/tag/usage/
 */
export const SEVERITY_KIND_MAP: Record<
  AlertSeverity,
  'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray'
> = {
  critical: 'red',
  high: 'magenta',
  medium: 'blue',
  low: 'green',
  info: 'gray',
} as const;

/**
 * Human-readable severity labels
 */
export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
} as const;

/**
 * Get Carbon Tag color for severity level
 */
export function getSeverityKind(
  severity: AlertSeverity
): 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray' {
  return SEVERITY_KIND_MAP[severity];
}

/**
 * Get human-readable label for severity level
 */
export function getSeverityLabel(severity: AlertSeverity): string {
  return SEVERITY_LABELS[severity];
}
