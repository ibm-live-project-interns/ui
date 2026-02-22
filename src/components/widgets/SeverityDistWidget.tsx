/**
 * Copyright IBM Corp. 2026
 *
 * SeverityDistWidget - Donut chart showing alert severity distribution.
 * Extracted from NetworkOpsView severity distribution chart.
 */

import { memo, useMemo } from 'react';
import { Tile } from '@carbon/react';
import { DonutChart } from '@carbon/charts-react';
import { useFetchData, useThemeDetection } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { createDonutChartOptions } from '@/shared/constants/charts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface SeverityDistWidgetProps {
  className?: string;
}

export const SeverityDistWidget = memo(function SeverityDistWidget({ className }: SeverityDistWidgetProps) {
  const theme = useThemeDetection();

  const { data, isLoading, error, refetch } = useFetchData(
    async () => alertDataService.getSeverityDistribution(),
    []
  );

  const chartOptions = useMemo(
    () => createDonutChartOptions({ title: 'Severity Distribution', height: '300px', theme, showTitle: false }),
    [theme]
  );

  if (isLoading && !data) return <WidgetSkeleton variant="chart" className={className} />;
  if (error && !data) return <WidgetError message={error} onRetry={refetch} className={className} />;

  return (
    <div className={`widget widget--chart ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>Severity Distribution</h3>
        </div>
        <div className="widget__body">
          <div className="widget__chart-container severity-dist__chart-center">
            <ChartWrapper
              ChartComponent={DonutChart}
              data={data || []}
              options={chartOptions}
              height="300px"
              emptyMessage="No severity data available"
            />
          </div>
        </div>
      </Tile>
    </div>
  );
});
