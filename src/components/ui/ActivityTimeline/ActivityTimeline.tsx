/**
 * Copyright IBM Corp. 2026
 *
 * ActivityTimeline Component
 * Vertical timeline for ticket activity history.
 * Each entry shows user avatar initials, action text, and relative timestamp.
 *
 * Activity types: created, assigned, commented, status_changed, resolved, reopened
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@carbon/react';
import { ChevronDown } from '@carbon/icons-react';
import './ActivityTimeline.scss';

export type ActivityType =
  | 'created'
  | 'assigned'
  | 'commented'
  | 'status_changed'
  | 'resolved'
  | 'reopened';

export interface ActivityEntry {
  /** Unique identifier */
  id: string;
  /** Type of activity */
  type: ActivityType;
  /** User who performed the action */
  user: string;
  /** User's role (used for avatar color) */
  role?: string;
  /** Human-readable description of what happened */
  description: string;
  /** ISO timestamp or date-like string */
  timestamp: string;
}

export interface ActivityTimelineProps {
  /** List of activity entries, newest first */
  entries: ActivityEntry[];
  /** Maximum entries to show before "Show more" (default: 10) */
  initialLimit?: number;
  /** Additional CSS class */
  className?: string;
}

/** Map activity types to labels for screen readers and fallback */
const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  created: 'Created',
  assigned: 'Assigned',
  commented: 'Commented',
  status_changed: 'Status changed',
  resolved: 'Resolved',
  reopened: 'Reopened',
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(timestamp: string): string {
  const normalized = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
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

/**
 * ActivityTimeline - Vertical timeline for ticket history
 *
 * Features:
 * - Colored avatar circles based on user role
 * - Relative timestamps that update on re-render
 * - Expandable list with "Show more" button
 * - Accessible with ARIA labels
 */
export const ActivityTimeline = React.memo(function ActivityTimeline({
  entries,
  initialLimit = 10,
  className = '',
}: ActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleEntries = useMemo(() => {
    if (showAll || entries.length <= initialLimit) return entries;
    return entries.slice(0, initialLimit);
  }, [entries, showAll, initialLimit]);

  const hasMore = entries.length > initialLimit && !showAll;

  if (entries.length === 0) {
    return (
      <div className={`activity-timeline activity-timeline--empty ${className}`.trim()}>
        <p className="activity-timeline__empty-text">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={`activity-timeline ${className}`.trim()} role="log" aria-label="Ticket activity">
      <ol className="activity-timeline__list">
        {visibleEntries.map((entry, index) => (
          <li
            key={entry.id}
            className={`activity-timeline__entry activity-timeline__entry--${entry.type}`}
          >
            {/* Connector line (not on last item) */}
            {index < visibleEntries.length - 1 && (
              <div className="activity-timeline__connector" />
            )}

            {/* Avatar */}
            <div
              className={`activity-timeline__avatar activity-timeline__avatar--${entry.role || 'system'}`}
              title={entry.user}
              aria-hidden="true"
            >
              {getInitials(entry.user)}
            </div>

            {/* Content */}
            <div className="activity-timeline__content">
              <div className="activity-timeline__header">
                <span className="activity-timeline__user">{entry.user}</span>
                <span className="activity-timeline__type-badge">
                  {ACTIVITY_TYPE_LABELS[entry.type]}
                </span>
                <span className="activity-timeline__time">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
              <p className="activity-timeline__description">{entry.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {hasMore && (
        <Button
          kind="ghost"
          size="sm"
          renderIcon={ChevronDown}
          onClick={() => setShowAll(true)}
          className="activity-timeline__show-more"
        >
          Show {entries.length - initialLimit} more
        </Button>
      )}
    </div>
  );
});

export default ActivityTimeline;
