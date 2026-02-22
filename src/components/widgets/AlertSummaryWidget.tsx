/**
 * Copyright IBM Corp. 2026
 *
 * AlertSummaryWidget - KPI cards showing active/critical/major/warning counts.
 * Each KPI card is clickable and navigates to priority alerts with a severity filter.
 * Extracted from NetworkOpsView alert summary section.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, WarningAltFilled, WarningAlt, Analytics } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { KPICard, type KPISeverity } from '@/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface AlertSummaryWidgetProps {
  className?: string;
}

export const AlertSummaryWidget = memo(function AlertSummaryWidget({ className }: AlertSummaryWidgetProps) {
  const navigate = useNavigate();

  const { data: summary, isLoading, error, refetch } = useFetchData(
    async () => {
      const [summaryResult, metricsResult] = await Promise.allSettled([
        alertDataService.getAlertsSummary(),
        alertDataService.getAIMetrics(),
      ]);
      const summaryData = summaryResult.status === 'fulfilled'
        ? summaryResult.value
        : { activeCount: 0, criticalCount: 0, majorCount: 0, minorCount: 0, infoCount: 0 };
      const metrics = metricsResult.status === 'fulfilled'
        ? metricsResult.value
        : [];
      return { summary: summaryData, metrics };
    },
    []
  );

  const kpiData = useMemo(() => {
    if (!summary) return [];

    const { summary: s, metrics } = summary;
    const aiAccuracyMetric = metrics.find(m => m.label?.toLowerCase().includes('accuracy'));
    const aiAccuracyValue = aiAccuracyMetric ? parseFloat(String(aiAccuracyMetric.value)) : null;

    return [
      {
        id: 'total-alerts',
        label: 'Active Alerts',
        value: s.activeCount || 0,
        icon: Notification,
        iconColor: 'var(--cds-interactive, #0f62fe)',
        severity: 'info' as KPISeverity,
        trend: { direction: 'stable' as const, value: 'vs last hour', isPositive: true },
        subtitle: 'Total alerts in system',
        onClick: () => navigate(ROUTES.PRIORITY_ALERTS),
      },
      {
        id: 'critical-alerts',
        label: 'Critical',
        value: s.criticalCount || 0,
        icon: WarningAltFilled,
        iconColor: 'var(--cds-support-error, #da1e28)',
        severity: 'critical' as KPISeverity,
        subtitle: 'Requires immediate attention',
        onClick: () => navigate(`${ROUTES.PRIORITY_ALERTS}?severity=critical`),
      },
      {
        id: 'major-alerts',
        label: 'Major',
        value: s.majorCount || 0,
        icon: WarningAlt,
        iconColor: 'var(--cds-support-warning, #ff832b)',
        severity: 'major' as KPISeverity,
        subtitle: 'Service impacting',
        onClick: () => navigate(`${ROUTES.PRIORITY_ALERTS}?severity=major`),
      },
      {
        id: 'ai-accuracy',
        label: 'AI Accuracy',
        value: aiAccuracyValue !== null ? `${aiAccuracyValue}%` : 'N/A',
        icon: Analytics,
        iconColor: aiAccuracyValue !== null && aiAccuracyValue >= 90 ? 'var(--cds-support-info, #8a3ffc)' : 'var(--cds-support-warning, #ff832b)',
        severity: (aiAccuracyValue !== null && aiAccuracyValue >= 90 ? 'success' : 'major') as KPISeverity,
        subtitle: aiAccuracyValue !== null ? 'Based on recent correlations' : 'Data unavailable',
      },
    ];
  }, [summary, navigate]);

  if (isLoading) return <WidgetSkeleton variant="kpi" className={className} />;
  if (error) return <WidgetError message={error} onRetry={refetch} className={className} />;
  if (!summary) return null;

  return (
    <div className={`widget widget--alert-summary ${className || ''}`}>
      <div className="widget__kpi-grid">
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            id={kpi.id}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            severity={kpi.severity}
            trend={kpi.trend}
            subtitle={kpi.subtitle}
            onClick={kpi.onClick}
          />
        ))}
      </div>
    </div>
  );
});
