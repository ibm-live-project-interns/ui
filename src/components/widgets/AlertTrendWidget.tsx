/**
 * Copyright IBM Corp. 2026
 *
 * AlertTrendWidget - Stacked area chart showing alerts over time.
 * Includes a period selector (24h/7d/30d).
 * Extracted from NetworkOpsView alert trend chart.
 */

import { memo, useState, useMemo } from 'react';
import { Tile, Button } from '@carbon/react';
import { StackedAreaChart } from '@carbon/charts-react';
import { useFetchData, useThemeDetection } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { createAreaChartOptions } from '@/shared/constants/charts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { TimePeriod } from '@/features/alerts/types';

interface AlertTrendWidgetProps {
  className?: string;
}

export const AlertTrendWidget = memo(function AlertTrendWidget({ className }: AlertTrendWidgetProps) {
  const theme = useThemeDetection();
  const [period, setPeriod] = useState<TimePeriod>('24h');

  const { data, isLoading, error, refetch } = useFetchData(
    async () => alertDataService.getAlertsOverTime(period),
    [period]
  );

  const chartOptions = useMemo(
    () => createAreaChartOptions({ title: 'Alerts Over Time', height: '320px', theme, showTitle: false }),
    [theme]
  );

  if (isLoading && !data) return <WidgetSkeleton variant="chart" className={className} />;
  if (error && !data) return <WidgetError message={error} onRetry={refetch} className={className} />;

  return (
    <div className={`widget widget--chart ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>Alerts Over Time</h3>
          <div className="alert-trend__period-buttons">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <Button
                key={p}
                kind={period === p ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        <div className="widget__body">
          <div className="widget__chart-container">
            <ChartWrapper
              ChartComponent={StackedAreaChart}
              data={data || []}
              options={chartOptions}
              height="320px"
              emptyMessage="No alert trend data available"
            />
          </div>
        </div>
      </Tile>
    </div>
  );
});
