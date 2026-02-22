/**
 * Copyright IBM Corp. 2026
 *
 * useSLAReports - Custom hook encapsulating all state, data fetching,
 * KPI generation, and export logic for the SLA Reports page.
 */

import { useState, useMemo, useEffect } from 'react';
import { logger } from '@/shared/utils/logger';
import { useFetchData, useThemeDetection } from '@/shared/hooks';
import {
    Checkmark,
    WarningAlt,
    Time,
    Timer,
} from '@carbon/icons-react';
import type { KPICardProps, KPISeverity } from '@/components/ui/KPICard';

import { slaService } from './slaService';
import type { SLAOverview, PeriodOption } from './sla.types';
import { SLA_PERIOD_OPTIONS, SLA_TARGET_PERCENT } from './sla.types';
import type { SLAViolation } from './ViolationsTable';
import type { SLATrendPoint } from './ComplianceTrendChart';

// ==========================================
// Return type
// ==========================================

export interface UseSLAReportsReturn {
    // Period
    selectedPeriod: PeriodOption;
    setSelectedPeriod: (period: PeriodOption) => void;

    // Data
    overview: SLAOverview | null;
    violations: SLAViolation[];
    trend: SLATrendPoint[];
    isLoading: boolean;
    currentTheme: string;

    // Pagination
    violationsPage: number;
    violationsPageSize: number;
    handleViolationsPageChange: (page: number, pageSize: number) => void;

    // KPIs
    kpiCards: KPICardProps[];

    // Empty state
    isEmpty: boolean;

    // Actions
    handleExport: () => void;
}

// ==========================================
// Hook
// ==========================================

export function useSLAReports(): UseSLAReportsReturn {
    // State
    const [selectedPeriod, setSelectedPeriod] = useState(SLA_PERIOD_OPTIONS[0]);
    const currentTheme = useThemeDetection();

    // Violations table pagination
    const [violationsPage, setViolationsPage] = useState(1);
    const [violationsPageSize, setViolationsPageSize] = useState(10);

    // Fetch SLA data via useFetchData
    const { data: slaResult, isLoading, refetch } = useFetchData(
        async (_signal) => {
            const period = selectedPeriod.id;
            const [overviewData, violationsData, trendData] = await Promise.all([
                slaService.getOverview(period),
                slaService.getViolations(period),
                slaService.getTrend(period),
            ]);
            return {
                overview: overviewData as SLAOverview | null,
                violations: (violationsData?.violations || []) as SLAViolation[],
                trend: (trendData?.trend || []) as SLATrendPoint[],
            };
        },
        [selectedPeriod],
        {
            onError: (err) => logger.error('Failed to fetch SLA data', err),
        }
    );

    const overview = slaResult?.overview ?? null;
    const violations = slaResult?.violations ?? [];
    const trend = slaResult?.trend ?? [];

    // 60-second auto-refresh
    useEffect(() => {
        const interval = setInterval(refetch, 60000);
        return () => clearInterval(interval);
    }, [refetch]);

    // Export handler
    const handleExport = () => {
        if (!overview) return;

        const lines: string[] = [];
        lines.push('SLA Compliance Report');
        lines.push(`Period: ${selectedPeriod.text}`);
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push('');
        lines.push('Overall Metrics');
        lines.push(`Compliance %,${overview.compliance_percent}`);
        lines.push(`MTTR,${overview.mttr_display}`);
        lines.push(`MTTA,${overview.mtta_display}`);
        lines.push(`Total Violations,${overview.total_violations}`);
        lines.push(`Total Alerts,${overview.total_alerts}`);
        lines.push(`Resolved Count,${overview.resolved_count}`);
        lines.push('');

        lines.push('Compliance by Severity');
        lines.push('Severity,SLA Target,Met,Violated,Compliance %');
        (overview.by_severity || []).forEach((s) => {
            lines.push(`${s.severity},${s.sla_target},${s.met},${s.violated},${s.compliance_percent}`);
        });
        lines.push('');

        if (violations.length > 0) {
            lines.push('SLA Violations');
            lines.push('Alert ID,Severity,Device,Expected Time,Actual Time,Excess Time');
            violations.forEach((v) => {
                lines.push(
                    `${v.alert_id},${v.severity},${v.device},${v.expected_display},${v.actual_display},${v.excess_display}`
                );
            });
        }

        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sla-report-${selectedPeriod.id}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Build KPI cards
    const kpiCards: KPICardProps[] = useMemo(() => {
        if (!overview) return [];

        const complianceSeverity: KPISeverity =
            overview.compliance_percent >= 99.9
                ? 'success'
                : overview.compliance_percent >= 95
                    ? 'minor'
                    : overview.compliance_percent >= 90
                        ? 'major'
                        : 'critical';

        const complianceTrend = overview.compliance_percent >= SLA_TARGET_PERCENT
            ? { direction: 'up' as const, value: 'On target', isPositive: true }
            : { direction: 'down' as const, value: `${(SLA_TARGET_PERCENT - overview.compliance_percent).toFixed(1)}% below target`, isPositive: false };

        const violationsSeverity: KPISeverity =
            overview.total_violations === 0
                ? 'success'
                : overview.total_violations <= 5
                    ? 'minor'
                    : overview.total_violations <= 20
                        ? 'major'
                        : 'critical';

        return [
            {
                id: 'sla-compliance',
                label: 'SLA Compliance',
                value: `${overview.compliance_percent}%`,
                subtitle: `${overview.resolved_count} resolved of ${overview.total_alerts} total`,
                icon: Checkmark,
                iconColor: complianceSeverity === 'success' ? '#24a148' : complianceSeverity === 'critical' ? '#da1e28' : '#f1c21b',
                severity: complianceSeverity,
                trend: complianceTrend,
            },
            {
                id: 'mttr',
                label: 'Mean Time to Resolve',
                value: overview.mttr_display,
                subtitle: `${overview.mttr_minutes.toFixed(1)} minutes average`,
                icon: Time,
                iconColor: '#0f62fe',
                severity: 'info' as KPISeverity,
                trend: overview.mttr_minutes <= 30
                    ? { direction: 'down' as const, value: 'Healthy', isPositive: true }
                    : { direction: 'up' as const, value: 'Above target', isPositive: false },
            },
            {
                id: 'mtta',
                label: 'Mean Time to Acknowledge',
                value: overview.mtta_display,
                subtitle: `${overview.mtta_minutes.toFixed(1)} minutes average`,
                icon: Timer,
                iconColor: '#8a3ffc',
                severity: 'info' as KPISeverity,
            },
            {
                id: 'total-violations',
                label: 'Total SLA Violations',
                value: overview.total_violations,
                subtitle: `Across ${overview.total_alerts} alerts in period`,
                icon: WarningAlt,
                iconColor: overview.total_violations > 0 ? '#da1e28' : '#24a148',
                severity: violationsSeverity,
                trend: overview.total_violations === 0
                    ? { direction: 'stable' as const, value: 'No violations', isPositive: true }
                    : { direction: 'up' as const, value: `${overview.total_violations} breached`, isPositive: false },
            },
        ];
    }, [overview]);

    // Empty state
    const isEmpty = !overview || (overview.total_alerts === 0 && violations.length === 0 && trend.length === 0);

    const handleViolationsPageChange = (page: number, pageSize: number) => {
        setViolationsPage(page);
        setViolationsPageSize(pageSize);
    };

    return {
        selectedPeriod,
        setSelectedPeriod,
        overview,
        violations,
        trend,
        isLoading,
        currentTheme,
        violationsPage,
        violationsPageSize,
        handleViolationsPageChange,
        kpiCards,
        isEmpty,
        handleExport,
    };
}
