/**
 * Copyright IBM Corp. 2026
 *
 * Incident Charts Component
 * Renders the duration timeline bar chart, root cause donut chart,
 * and the prevention recommendations panel.
 */

import React from 'react';
import { Tile, Button } from '@carbon/react';
import { Policy, ArrowRight, Archive } from '@carbon/icons-react';
import { SimpleBarChart, DonutChart } from '@carbon/charts-react';

import { EmptyState } from '@/components';
import ChartWrapper from '@/components/ui/ChartWrapper';

// ==========================================
// Types
// ==========================================

export interface PreventionAction {
  id: string;
  priority: number;
  title: string;
  description: string;
  actionLabel: string;
  priorityColor: string;
}

export interface RootCauseDistribution {
  group: string;
  value: number;
}

export interface DurationChartData {
  group: string;
  key: string;
  value: number;
}

interface IncidentChartsProps {
  /** Data for the duration timeline bar chart */
  durationChartData: DurationChartData[];
  /** Options for the bar chart */
  barChartOptions: Record<string, unknown>;
  /** Data for the root cause donut chart */
  rootCauseDistribution: RootCauseDistribution[];
  /** Options for the donut chart */
  donutOptions: Record<string, unknown>;
  /** Prevention action recommendations derived from incident data */
  preventionActions: PreventionAction[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Callback when a prevention action button is clicked */
  onPreventionAction: (actionLabel: string) => void;
}

// ==========================================
// Component
// ==========================================

export const IncidentCharts = React.memo(function IncidentCharts({
  durationChartData,
  barChartOptions,
  rootCauseDistribution,
  donutOptions,
  preventionActions,
  isLoading,
  onPreventionAction,
}: IncidentChartsProps) {
  return (
    <>
      {/* Left Column Content: Duration Timeline */}
      <Tile className="incident-history-page__chart-tile">
        <div className="chart-header">
          <div className="chart-title-group">
            <h3>Incident Duration Timeline</h3>
            <p className="chart-subtitle">Resolution times by day and severity</p>
          </div>
          <div className="chart-legend-custom">
            <span className="legend-item">
              <span className="legend-dot legend-dot--critical" />
              Critical
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-dot--major" />
              Major
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-dot--minor" />
              Minor
            </span>
          </div>
        </div>
        <div className="chart-container">
          {!isLoading && durationChartData.length === 0 ? (
            <EmptyState
              title="No incident duration data"
              description="Duration data will appear once incidents are resolved"
              size="sm"
            />
          ) : (
            <ChartWrapper
              ChartComponent={SimpleBarChart}
              data={durationChartData}
              options={barChartOptions}
              height="280px"
              isLoading={isLoading}
            />
          )}
        </div>
      </Tile>
    </>
  );
});

/**
 * Right-column charts and panels: donut chart, prevention actions, archive tile.
 */
export const IncidentRightColumn = React.memo(function IncidentRightColumn({
  rootCauseDistribution,
  donutOptions,
  preventionActions,
  isLoading,
  onPreventionAction,
}: Omit<IncidentChartsProps, 'durationChartData' | 'barChartOptions'>) {
  return (
    <>
      {/* Root Cause Distribution */}
      <Tile className="incident-history-page__donut-tile">
        <h3 className="tile-title">Primary Root Causes</h3>
        <div className="chart-container">
          {!isLoading && rootCauseDistribution.length === 0 ? (
            <EmptyState
              title="No root cause data"
              description="Root cause analysis data will appear after incidents are analyzed"
              size="sm"
            />
          ) : (
            <ChartWrapper
              ChartComponent={DonutChart}
              data={rootCauseDistribution}
              options={donutOptions}
              height="260px"
              isLoading={isLoading}
            />
          )}
        </div>
      </Tile>

      {/* Prevention Recommendations */}
      <Tile className="incident-history-page__prevention-tile">
        <div className="prevention-header">
          <div className="prevention-header__title-row">
            <Policy size={20} className="prevention-header__icon" aria-label="Recommended actions" />
            <h3>Recommended Actions</h3>
          </div>
          <p className="prevention-header__subtitle">
            Prevent recurrence based on historical data patterns.
          </p>
        </div>

        <div className="prevention-list">
          {preventionActions.length === 0 ? (
            <p className="prevention-empty">No prevention actions needed. All clear.</p>
          ) : (
            preventionActions.map((action, index) => (
              <div key={action.id}>
                {index > 0 && <div className="prevention-divider" />}
                <div className="prevention-item">
                  <div className="prevention-item__badge-col">
                    <span
                      className="prevention-item__badge"
                      style={{ '--badge-bg': action.priorityColor } as React.CSSProperties}
                    >
                      {action.priority}
                    </span>
                  </div>
                  <div className="prevention-item__content">
                    <h4 className="prevention-item__title">{action.title}</h4>
                    <p className="prevention-item__description">{action.description}</p>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={ArrowRight}
                      className="prevention-item__action"
                      onClick={() => onPreventionAction(action.actionLabel)}
                    >
                      {action.actionLabel}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Tile>

      {/* Archive Access */}
      <div className="incident-history-page__archive-tile">
        <div className="archive-info">
          <span className="archive-title">Archive Access</span>
          <span className="archive-subtitle">Logs older than 90 days</span>
        </div>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Archive}
          hasIconOnly
          iconDescription="Access Archive"
          className="archive-button"
        />
      </div>
    </>
  );
});
