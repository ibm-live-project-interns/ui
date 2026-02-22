/**
 * Copyright IBM Corp. 2026
 *
 * SLATimer Component
 * Countdown timer showing time remaining until SLA breach.
 * Color transitions: green (>50%) -> yellow (25-50%) -> red (<25%) -> flashing (breached).
 *
 * Priority SLA thresholds:
 * - Critical: 1 hour
 * - High: 4 hours
 * - Medium: 8 hours
 * - Low: 24 hours
 */

import React, { useState, useEffect, useMemo } from 'react';
import { WarningAlt, Misuse, Time } from '@carbon/icons-react';
import type { TicketPriority } from '@/shared/types';
import './SLATimer.scss';

/** SLA thresholds in milliseconds by priority */
const SLA_THRESHOLDS_MS: Record<TicketPriority, number> = {
  critical: 1 * 60 * 60 * 1000,   // 1 hour
  high: 4 * 60 * 60 * 1000,       // 4 hours
  medium: 8 * 60 * 60 * 1000,     // 8 hours
  low: 24 * 60 * 60 * 1000,       // 24 hours
};

export interface SLATimerProps {
  /** When the ticket was created (ISO 8601 string or date-like string) */
  createdAt: string;
  /** Ticket priority determines the SLA threshold */
  priority: TicketPriority;
  /** Whether the ticket is already resolved/closed (hides countdown) */
  isResolved?: boolean;
  /** Compact display mode (single-line, no icon) */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

type SLAState = 'green' | 'yellow' | 'red' | 'breached';

function parseDateString(dateStr: string): Date {
  // Handle "2024-01-16 14:25:00" (space-separated) as well as ISO 8601
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  return new Date(normalized);
}

function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalHours > 0) {
    return `${totalHours}h ${minutes}m`;
  }
  return `${totalMinutes}m`;
}

function getSLAState(remainingMs: number, totalMs: number): SLAState {
  if (remainingMs <= 0) return 'breached';
  const ratio = remainingMs / totalMs;
  if (ratio > 0.5) return 'green';
  if (ratio > 0.25) return 'yellow';
  return 'red';
}

/**
 * SLATimer - Countdown display for SLA breach timing
 *
 * Automatically recalculates every 30 seconds.
 * Uses Carbon design tokens for color theming.
 */
export const SLATimer = React.memo(function SLATimer({
  createdAt,
  priority,
  isResolved = false,
  compact = false,
  className = '',
}: SLATimerProps) {
  const [now, setNow] = useState(() => Date.now());

  // Refresh the timer every 30 seconds
  useEffect(() => {
    if (isResolved) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [isResolved]);

  const { state, remainingMs, label } = useMemo(() => {
    const created = parseDateString(createdAt);
    const thresholdMs = SLA_THRESHOLDS_MS[priority];
    const deadlineMs = created.getTime() + thresholdMs;
    const remaining = deadlineMs - now;
    const currentState = getSLAState(remaining, thresholdMs);

    let displayLabel: string;
    if (isResolved) {
      displayLabel = remaining > 0 ? 'Met SLA' : 'SLA missed';
    } else if (remaining <= 0) {
      displayLabel = `BREACHED ${formatDuration(remaining)} ago`;
    } else {
      displayLabel = `${formatDuration(remaining)} remaining`;
    }

    return { state: currentState, remainingMs: remaining, label: displayLabel };
  }, [createdAt, priority, now, isResolved]);

  // Resolved tickets get a neutral display
  const resolvedState = isResolved ? (remainingMs > 0 ? 'green' : 'red') : state;

  const StateIcon = resolvedState === 'breached' || (isResolved && remainingMs <= 0)
    ? Misuse
    : resolvedState === 'red' || resolvedState === 'yellow'
      ? WarningAlt
      : Time;

  if (compact) {
    return (
      <span
        className={`sla-timer sla-timer--compact sla-timer--${resolvedState} ${className}`.trim()}
        title={`SLA: ${label} (${priority} priority)`}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className={`sla-timer sla-timer--${resolvedState} ${isResolved ? 'sla-timer--resolved' : ''} ${className}`.trim()}
      role="timer"
      aria-label={`SLA ${label}`}
    >
      <StateIcon size={16} className="sla-timer__icon" />
      <div className="sla-timer__content">
        <span className="sla-timer__label">
          {isResolved ? 'SLA Status' : 'SLA Countdown'}
        </span>
        <span className="sla-timer__value">{label}</span>
      </div>
    </div>
  );
});

export default SLATimer;
