/**
 * Copyright IBM Corp. 2026
 *
 * Incident History - Shared Types, Constants, and Helper Functions
 * Used by IncidentHistoryPage and its child components.
 */

import type { ResolvedIncident } from './IncidentTable';
import type { PreventionAction } from './IncidentCharts';

// ==========================================
// Constants
// ==========================================

export const SLA_THRESHOLD_MINUTES = 60; // 60-minute SLA threshold for resolution

export const TIME_RANGE_OPTIONS = [
  { id: '7d', text: 'Last 7 Days' },
  { id: '30d', text: 'Last 30 Days' },
  { id: '90d', text: 'Last 90 Days' },
] as const;

export type TimeRangeOption = { id: string; text: string };

export const ROOT_CAUSE_COLORS: Record<string, string> = {
  'Hardware Failure': '#da1e28',
  'Config Drift': '#ff832b',
  'Capacity': '#0f62fe',
  'Upstream': '#42be65',
  'Software Bug': '#a56eff',
  'Human Error': '#f1c21b',
  'Other': '#525252',
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Compute duration in human-readable format from two ISO timestamps.
 */
export function computeDuration(start: string, end: string): { text: string; minutes: number } {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { text: 'N/A', minutes: 0 };
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return { text: '< 1m', minutes: 0 };

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diffMs % 60000) / 1000);

  if (hours > 0) {
    return { text: `${hours}h ${minutes}m`, minutes: totalMinutes };
  }
  if (minutes > 0) {
    return { text: `${minutes}m ${seconds}s`, minutes: totalMinutes };
  }
  return { text: `${seconds}s`, minutes: totalMinutes };
}

/**
 * Map alert category to a user-friendly root cause category.
 */
export function categorizeRootCause(category: string | undefined): string {
  if (!category) return 'Other';

  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('hardware') || lowerCat.includes('device') || lowerCat.includes('interface')) {
    return 'Hardware Failure';
  }
  if (lowerCat.includes('config') || lowerCat.includes('bgp') || lowerCat.includes('routing')) {
    return 'Config Drift';
  }
  if (lowerCat.includes('capacity') || lowerCat.includes('threshold') || lowerCat.includes('utilization') || lowerCat.includes('cpu') || lowerCat.includes('memory')) {
    return 'Capacity';
  }
  if (lowerCat.includes('upstream') || lowerCat.includes('external') || lowerCat.includes('provider')) {
    return 'Upstream';
  }
  if (lowerCat.includes('software') || lowerCat.includes('firmware') || lowerCat.includes('bug')) {
    return 'Software Bug';
  }
  if (lowerCat.includes('human') || lowerCat.includes('manual') || lowerCat.includes('misconfig')) {
    return 'Human Error';
  }
  return 'Other';
}

/**
 * Format ISO date to display format.
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Derive prevention actions from incident patterns.
 */
export function derivePreventionActions(incidents: ResolvedIncident[]): PreventionAction[] {
  // Count root causes to find most impactful
  const causeCount: Record<string, { count: number; totalMinutes: number; examples: string[] }> = {};

  incidents.forEach((inc) => {
    const cause = inc.rootCauseCategory;
    if (!causeCount[cause]) {
      causeCount[cause] = { count: 0, totalMinutes: 0, examples: [] };
    }
    causeCount[cause].count += 1;
    causeCount[cause].totalMinutes += inc.durationMinutes;
    if (causeCount[cause].examples.length < 2) {
      causeCount[cause].examples.push(inc.summary);
    }
  });

  // Sort by combined impact (count * avgDuration)
  const sorted = Object.entries(causeCount)
    .map(([cause, data]) => ({
      cause,
      count: data.count,
      avgMinutes: data.totalMinutes / data.count,
      impact: data.count * (data.totalMinutes / data.count),
      examples: data.examples,
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const priorityColors = ['#da1e28', '#ff832b', '#0f62fe'];

  return sorted.map((item, index) => {
    const actionMap: Record<string, { title: string; description: string; actionLabel: string }> = {
      'Hardware Failure': {
        title: 'Schedule Hardware Health Audits',
        description: `${item.count} incidents linked to hardware failures. Avg resolution: ${Math.round(item.avgMinutes)}m. Proactive monitoring recommended.`,
        actionLabel: 'Create Ticket',
      },
      'Config Drift': {
        title: 'Implement Config Drift Detection',
        description: `${item.count} incidents caused by configuration drift. Deploy automated config validation checks.`,
        actionLabel: 'View Policy',
      },
      'Capacity': {
        title: 'Review Capacity Thresholds',
        description: `${item.count} capacity-related incidents detected. Adjust scaling policies and alerting thresholds.`,
        actionLabel: 'Adjust Thresholds',
      },
      'Upstream': {
        title: 'Strengthen Upstream Monitoring',
        description: `${item.count} upstream-related incidents. Add redundant path monitoring and provider SLA tracking.`,
        actionLabel: 'View Topology',
      },
      'Software Bug': {
        title: 'Update Firmware & Software',
        description: `${item.count} incidents linked to software bugs. Ensure all devices run latest stable versions.`,
        actionLabel: 'Create Ticket',
      },
      'Human Error': {
        title: 'Enhance Change Management',
        description: `${item.count} incidents caused by human error. Implement peer review for config changes.`,
        actionLabel: 'View Runbook',
      },
    };

    const action = actionMap[item.cause] || {
      title: `Address ${item.cause} Issues`,
      description: `${item.count} incidents in this category. Review and create a remediation plan.`,
      actionLabel: 'Review',
    };

    return {
      id: `prevention-${index}`,
      priority: index + 1,
      title: action.title,
      description: action.description,
      actionLabel: action.actionLabel,
      priorityColor: priorityColors[index] || '#525252',
    };
  });
}
