/**
 * AuditKPIs - KPI cards row for the Audit Log page.
 * Displays total actions, failed actions, active users, and most active user.
 */

import React, { useMemo } from 'react';
import {
    Activity,
    ErrorFilled,
    UserMultiple,
    UserAvatar,
} from '@carbon/icons-react';
import { KPICard } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';
import type { AuditLogStats } from './audit-log.types';

interface AuditKPIsProps {
    stats: AuditLogStats;
}

export const AuditKPIs = React.memo(function AuditKPIs({ stats }: AuditKPIsProps) {
    const kpiData = useMemo((): KPICardProps[] => [
        {
            id: 'total-actions',
            label: 'Total Actions (24h)',
            value: stats.total_actions_24h,
            icon: Activity,
            iconColor: 'var(--cds-interactive, #0f62fe)',
            severity: 'info' as const,
            subtitle: 'Last 24 hours',
        },
        {
            id: 'failed-actions',
            label: 'Failed Actions',
            value: stats.failed_actions_24h,
            icon: ErrorFilled,
            iconColor: 'var(--cds-support-error, #da1e28)',
            severity: stats.failed_actions_24h > 0 ? 'critical' as const : 'success' as const,
            subtitle: 'Last 24 hours',
        },
        {
            id: 'active-users',
            label: 'Active Users',
            value: stats.active_users_24h,
            icon: UserMultiple,
            iconColor: 'var(--cds-support-success, #198038)',
            severity: 'success' as const,
            subtitle: 'Last 24 hours',
        },
        {
            id: 'most-active',
            label: 'Most Active User',
            value: stats.most_active_user,
            icon: UserAvatar,
            iconColor: 'var(--cds-support-info, #8a3ffc)',
            severity: 'neutral' as const,
            subtitle: `${stats.most_active_user_actions} actions`,
        },
    ], [stats]);

    return (
        <div className="kpi-row">
            {kpiData.map((kpi) => (
                <KPICard key={kpi.id} {...kpi} />
            ))}
        </div>
    );
});

export default AuditKPIs;
