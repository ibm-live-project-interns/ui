/**
 * Copyright IBM Corp. 2026
 *
 * AIInsightsWidget - AI analysis metrics with progress bars.
 * Shows accuracy %, insights count, and enrichment rates.
 * Extracted from NetworkOpsView AI Impact Metrics section.
 */

import { memo } from 'react';
import { Tile, ProgressBar } from '@carbon/react';
import { Analytics } from '@carbon/icons-react';
import { useFetchData } from '@/shared/hooks';
import { alertDataService } from '@/shared/services';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';

interface AIInsightsWidgetProps {
  className?: string;
}

export const AIInsightsWidget = memo(function AIInsightsWidget({ className }: AIInsightsWidgetProps) {
  const { data: metrics, isLoading, error, refetch } = useFetchData(
    async () => alertDataService.getAIMetrics(),
    []
  );

  if (isLoading && !metrics) return <WidgetSkeleton variant="compact" className={className} />;
  if (error && !metrics) return <WidgetError message={error} onRetry={refetch} className={className} />;

  const items = metrics || [];

  return (
    <div className={`widget widget--compact ${className || ''}`}>
      <Tile className="widget__tile">
        <div className="widget__header">
          <h3>
            <Analytics size={18} />
            AI Impact Metrics
          </h3>
        </div>

        <div className="widget__body">
          {items.length === 0 ? (
            <div className="widget__empty">No AI metrics available</div>
          ) : (
            <div className="widget__metrics-list">
              {items.map((metric, idx) => (
                <div key={metric.id || idx} className="metric-row">
                  <div className="metric-left">
                    <div className="metric-name">{metric.label}</div>
                    <ProgressBar
                      label={metric.label}
                      value={typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0}
                      max={100}
                      hideLabel
                      size="small"
                    />
                  </div>
                  <div className="metric-value">
                    {metric.description || `${typeof metric.value === 'number' ? Math.round(metric.value * 10) / 10 : metric.value}%`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tile>
    </div>
  );
});
