/**
 * Copyright IBM Corp. 2026
 *
 * RelativeTime Component
 *
 * Renders a self-updating "X ago" timestamp. Each instance manages its own
 * tick interval, so parent components do not need to re-render the entire
 * tree just to keep relative timestamps current.
 */

import React, { useState, useEffect } from 'react';

export interface RelativeTimeProps {
  /** The timestamp to display relative to now. Accepts ISO string or Date. */
  timestamp: string | Date | null | undefined;
  /** How often to re-evaluate the relative time (ms). Default 60000 (1 min). */
  refreshInterval?: number;
  /** Optional CSS class name for the wrapping span. */
  className?: string;
  /** Fallback text when timestamp is null/undefined/invalid. Default empty string. */
  fallback?: string;
}

/**
 * Format a timestamp as a human-readable relative string ("5s ago", "3m ago", etc.)
 */
function formatRelativeTime(input: string | Date | null | undefined): string {
  if (!input) return '';
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 5) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return '';
  }
}

export const RelativeTime = React.memo(function RelativeTime({
  timestamp,
  refreshInterval = 60_000,
  className,
  fallback = '',
}: RelativeTimeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval]);

  const text = formatRelativeTime(timestamp);

  return <span className={className}>{text || fallback}</span>;
});

export default RelativeTime;
