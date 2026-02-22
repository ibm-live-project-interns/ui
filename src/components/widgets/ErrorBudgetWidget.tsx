/**
 * Copyright IBM Corp. 2026
 *
 * ErrorBudgetWidget - Error budget consumption bar.
 * Shows budget remaining with color transitions based on consumption level.
 * Extracted from SREView error budget KPI.
 */

import { memo, useMemo } from 'react';
import { Tile, ProgressBar, Tag } from '@carbon/react';
import { ChartLineSmooth } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { deviceService } from '@/shared/services';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface ErrorBudgetWidgetProps {
  className?: string;
}

export const ErrorBudgetWidget = memo(function ErrorBudgetWidget({ className }: ErrorBudgetWidgetProps) {
  const { data, isLoading, error, refetch } = useFetchData(
    async () => {
      const devices = await deviceService.getDevices();

      // Calculate availability from device health
      let availability: number | null = null;
      let errorBudgetUsed: number | null = null;

      if (devices.length > 0) {
        const totalHealth = devices.reduce((sum, d) => sum + (d.healthScore || 0), 0);
        const avgHealth = totalHealth / devices.length;
        availability = Math.round(Math.min(99.99, Math.max(0, avgHealth)) * 100) / 100;

        // Target 99.9% availability
        const target = 99.9;
        const allowedDowntime = 100 - target; // 0.1%
        const actualDowntime = 100 - availability;
        errorBudgetUsed = Math.min(100, Math.round((actualDowntime / allowedDowntime) * 100));
      }

      return {
        budgetUsed: errorBudgetUsed ?? 0,
        budgetRemaining: 100 - (errorBudgetUsed ?? 0),
        availability: availability ?? 0,
        target: 99.9,
        // Convert to minutes (30-day month)
        totalBudgetMinutes: 43.2, // 0.1% of 30 days = 43.2 min
        usedMinutes: ((errorBudgetUsed ?? 0) / 100) * 43.2,
      };
    },
    []
  );

  const severity = useMemo(() => {
    if (!data) return 'info';
    if (data.budgetUsed > 80) return 'critical';
    if (data.budgetUsed > 50) return 'warning';
    return 'safe';
  }, [data]);

  const barStatus = severity === 'critical' ? 'error' as const : severity === 'warning' ? 'active' as const : 'finished' as const;

  if (isLoading && !data) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !data) return <WidgetError message={error} onRetry={refetch} className={className} />;
  if (!data) return null;

  return (
    <div className={`widget widget--error-budget ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <ChartLineSmooth size={18} />
            Error Budget
          </h3>
          <Tag
            type={severity === 'critical' ? 'red' : severity === 'warning' ? 'gray' : 'green'}
            size="sm"
          >
            {data.budgetRemaining}% remaining
          </Tag>
        </div>

        <div className="error-budget__hero">
          <div className={`error-budget__value error-budget__value--${severity}`}>
            {data.budgetUsed}%
          </div>
          <div className="error-budget__subtitle">
            of monthly budget consumed
          </div>
        </div>

        <div className="budget-visual">
          <ProgressBar
            label="Error budget"
            value={data.budgetUsed}
            max={100}
            size="big"
            hideLabel
            status={barStatus}
          />
          <div className="budget-meta">
            <span>{data.usedMinutes.toFixed(1)} min used</span>
            <span>{data.totalBudgetMinutes.toFixed(1)} min total</span>
          </div>
        </div>

        <div className="error-budget__footer-text">
          Availability: {data.availability}% (Target: {data.target}%)
        </div>
      </Tile>
    </div>
  );
});
