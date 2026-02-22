/**
 * Post-Mortem Page Types, Constants & Helpers
 *
 * Shared interfaces, filter options, and utility functions used by
 * PostMortemPage and its child components.
 */

import type { FilterOption } from '@/components/ui/FilterBar';
import type { TimelineEntry, ActionItem } from '@/shared/services';

// ==========================================
// Helpers
// ==========================================

export function formatDate(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export function getStatusTagType(status: string): 'gray' | 'blue' | 'green' {
  switch (status) {
    case 'draft': return 'gray';
    case 'in-review': return 'blue';
    case 'published': return 'green';
    default: return 'gray';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'in-review': return 'In Review';
    case 'published': return 'Published';
    default: return status;
  }
}

export function getCategoryTagType(
  category: string
): 'red' | 'blue' | 'teal' | 'purple' | 'magenta' | 'cyan' | 'gray' {
  switch (category) {
    case 'hardware': return 'red';
    case 'software': return 'blue';
    case 'network': return 'teal';
    case 'configuration': return 'purple';
    case 'human-error': return 'magenta';
    case 'external': return 'cyan';
    case 'unknown': return 'gray';
    default: return 'gray';
  }
}

export function parseJsonField<T>(field: T | string | undefined | null): T | [] {
  if (!field) return [] as unknown as T;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return [] as unknown as T;
    }
  }
  return field;
}

// ==========================================
// Constants
// ==========================================

export const STATUS_OPTIONS: FilterOption[] = [
  { id: 'all', text: 'All Statuses' },
  { id: 'draft', text: 'Draft' },
  { id: 'in-review', text: 'In Review' },
  { id: 'published', text: 'Published' },
];

export const CATEGORY_OPTIONS: FilterOption[] = [
  { id: 'all', text: 'All Categories' },
  { id: 'hardware', text: 'Hardware' },
  { id: 'software', text: 'Software' },
  { id: 'network', text: 'Network' },
  { id: 'configuration', text: 'Configuration' },
  { id: 'human-error', text: 'Human Error' },
  { id: 'external', text: 'External' },
  { id: 'unknown', text: 'Unknown' },
];

export const TABLE_HEADERS = [
  { key: 'title', header: 'Title' },
  { key: 'alert_id', header: 'Alert ID' },
  { key: 'root_cause_category', header: 'Category' },
  { key: 'status', header: 'Status' },
  { key: 'created_by', header: 'Author' },
  { key: 'created_at', header: 'Date' },
];

// Re-export types used by child components
export type { TimelineEntry, ActionItem };
