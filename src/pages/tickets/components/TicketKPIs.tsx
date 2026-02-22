/**
 * Copyright IBM Corp. 2026
 *
 * TicketKPIs - KPI row for the tickets page.
 * Computes open count, assigned-to-me, SLA breached, and avg resolution time.
 */

import React, { useMemo } from 'react';

import {
  Ticket,
  Time,
  WarningAlt,
  UserMultiple,
} from '@carbon/icons-react';

import { KPICard } from '@/components';
import { authService, type TicketInfo } from '@/shared/services';
import type { TicketStats } from '@/features/tickets/services/ticketService';
import { formatResolutionTime, SLA_THRESHOLDS_MS } from './ticketHelpers';

// ==========================================
// Props
// ==========================================

export interface TicketKPIsProps {
  tickets: TicketInfo[];
  ticketStats: TicketStats | null | undefined;
  kpiFilter: string | null;
  onKPIClick: (filterKey: string | null) => void;
}

// ==========================================
// Component
// ==========================================

export const TicketKPIs: React.FC<TicketKPIsProps> = React.memo(function TicketKPIs({
  tickets,
  ticketStats,
  kpiFilter,
  onKPIClick,
}) {
  const kpiData = useMemo(() => {
    const openCount = tickets.filter((t) => t.status === 'open').length;

    // "Assigned to Me" count
    const currentUser = authService.currentUser;
    const username = currentUser?.username || currentUser?.email || '';
    const myCount = username
      ? tickets.filter(
          (t) =>
            (t.assignedTo === username || t.assignedTo === currentUser?.email) &&
            t.status !== 'resolved' &&
            t.status !== 'closed'
        ).length
      : 0;

    // SLA breached count
    const slaBreachedCount = tickets.filter((t) => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      const created = new Date(t.createdAt.includes('T') ? t.createdAt : t.createdAt.replace(' ', 'T'));
      const threshold = SLA_THRESHOLDS_MS[t.priority] ?? 86400000;
      return Date.now() - created.getTime() > threshold;
    }).length;

    const avgResolution = formatResolutionTime(ticketStats?.avg_resolution_hours ?? 0);

    return [
      {
        id: 'open-tickets',
        label: 'Open Tickets',
        value: openCount.toString(),
        subtitle: 'Awaiting action',
        icon: Ticket,
        severity: 'critical' as const,
        iconColor: 'var(--cds-support-error)',
        trend: openCount > 0
          ? { direction: 'up' as const, value: `+${openCount}`, isPositive: false }
          : undefined,
        filterKey: 'open',
      },
      {
        id: 'assigned-to-me',
        label: 'Assigned to Me',
        value: myCount.toString(),
        subtitle: 'Your active tickets',
        icon: UserMultiple,
        severity: 'major' as const,
        iconColor: 'var(--cds-support-info)',
        filterKey: 'my-tickets',
      },
      {
        id: 'sla-breached',
        label: 'SLA Breached',
        value: slaBreachedCount.toString(),
        subtitle: slaBreachedCount > 0 ? 'Requires attention' : 'All within SLA',
        icon: WarningAlt,
        severity: slaBreachedCount > 0 ? ('critical' as const) : ('success' as const),
        iconColor: slaBreachedCount > 0 ? 'var(--cds-support-error)' : 'var(--cds-support-success)',
        filterKey: 'sla-breached',
      },
      {
        id: 'avg-resolution',
        label: 'Avg Resolution',
        value: avgResolution,
        subtitle: 'Last 30 days',
        icon: Time,
        severity: 'neutral' as const,
        iconColor: 'var(--cds-text-secondary)',
        filterKey: null,
      },
    ];
  }, [tickets, ticketStats]);

  return (
    <div className="kpi-row">
      {kpiData.map((kpi) => (
        <KPICard
          key={kpi.id}
          id={kpi.id}
          label={kpi.label}
          value={kpi.value}
          subtitle={kpi.subtitle}
          icon={kpi.icon}
          severity={kpi.severity}
          iconColor={kpi.iconColor}
          trend={kpi.trend}
          onClick={kpi.filterKey ? () => onKPIClick(kpi.filterKey) : undefined}
          className={kpiFilter === kpi.filterKey ? 'kpi-card--active-filter' : ''}
        />
      ))}
    </div>
  );
});
