/**
 * Copyright IBM Corp. 2026
 *
 * Ticket helper functions and constants shared across ticket components.
 */

import type { ActivityEntry } from '@/components/ui/ActivityTimeline';
import type { TicketInfo } from '@/shared/services';
import type { TicketComment } from '@/features/tickets/services/ticketService';

// ==========================================
// Constants
// ==========================================

export const QUICK_TAB_OPTIONS = ['All', 'My Tickets', 'Unassigned'] as const;
export type QuickTab = (typeof QUICK_TAB_OPTIONS)[number];

export const TABLE_HEADERS = [
  { key: 'ticketNumber', header: 'ID' },
  { key: 'title', header: 'Subject' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'createdAt', header: 'Updated' },
];

/** SLA thresholds in milliseconds by priority level */
export const SLA_THRESHOLDS_MS: Record<string, number> = {
  critical: 3600000,    // 1 hour
  high: 14400000,       // 4 hours
  medium: 28800000,     // 8 hours
  low: 86400000,        // 24 hours
};

// ==========================================
// Helper Functions
// ==========================================

/** Format a date string as a human-readable relative time (e.g., "5m ago", "2h ago") */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '--';
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return 'just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format resolution hours as a compact string (e.g., "2h 30m") */
export function formatResolutionTime(hours: number): string {
  if (hours <= 0) return '--';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const wholeHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - wholeHours) * 60);
  if (remainingMinutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${remainingMinutes}m`;
}

/** Check if an alert ID is a real linkable alert (not manual or empty) */
export function isLinkableAlertId(alertId: string | undefined | null): alertId is string {
  if (!alertId) return false;
  if (alertId.startsWith('manual-')) return false;
  return true;
}

/** Build synthetic activity entries from ticket + comments data */
export function buildActivityEntries(
  ticket: TicketInfo | null,
  comments: TicketComment[]
): ActivityEntry[] {
  if (!ticket) return [];

  const entries: ActivityEntry[] = [];

  // Ticket creation event
  entries.push({
    id: `activity-created-${ticket.id}`,
    type: 'created',
    user: 'System',
    role: 'system',
    description: `Ticket ${ticket.ticketNumber} created${ticket.alertId ? ` from alert ${ticket.alertId}` : ''}`,
    timestamp: ticket.createdAt,
  });

  // Assigned event (if assigned)
  if (ticket.assignedTo && ticket.assignedTo !== 'Unassigned') {
    entries.push({
      id: `activity-assigned-${ticket.id}`,
      type: 'assigned',
      user: 'System',
      role: 'system',
      description: `Assigned to ${ticket.assignedTo}`,
      timestamp: ticket.createdAt,
    });
  }

  // Status change events based on current status
  if (ticket.status === 'in-progress') {
    entries.push({
      id: `activity-status-inprogress-${ticket.id}`,
      type: 'status_changed',
      user: ticket.assignedTo || 'Unknown',
      description: 'Changed status to In Progress',
      timestamp: ticket.updatedAt || ticket.createdAt,
    });
  }

  if (ticket.status === 'resolved') {
    entries.push({
      id: `activity-resolved-${ticket.id}`,
      type: 'resolved',
      user: ticket.assignedTo || 'Unknown',
      description: 'Resolved the ticket',
      timestamp: ticket.updatedAt || ticket.createdAt,
    });
  }

  // Comment events
  for (const comment of comments) {
    entries.push({
      id: `activity-comment-${comment.id}`,
      type: 'commented',
      user: comment.author || 'Unknown',
      description: comment.content,
      timestamp: comment.createdAt,
    });
  }

  // Sort newest first
  entries.sort((a, b) => {
    const aTime = new Date(a.timestamp.includes('T') ? a.timestamp : a.timestamp.replace(' ', 'T')).getTime();
    const bTime = new Date(b.timestamp.includes('T') ? b.timestamp : b.timestamp.replace(' ', 'T')).getTime();
    return bTime - aTime;
  });

  return entries;
}
