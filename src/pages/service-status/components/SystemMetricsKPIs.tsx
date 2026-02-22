/**
 * System Metrics KPI Row
 *
 * Displays the 4 system-level KPI cards: alerts, events, response time, and error rate.
 */

import React from 'react';
import {
  Activity,
  Time,
  EventSchedule,
  ChartLineData,
} from '@carbon/icons-react';

import { KPICard } from '@/components';
import type { SystemMetrics } from './serviceStatus.types';

interface SystemMetricsKPIsProps {
  /** System metrics from the service status API (null if not loaded) */
  metrics: SystemMetrics | undefined;
}

export const SystemMetricsKPIs = React.memo(function SystemMetricsKPIs({
  metrics,
}: SystemMetricsKPIsProps) {
  return (
    <div className="kpi-row">
      <KPICard
        label="Alerts (24h)"
        value={metrics?.total_alerts_24h ?? 0}
        icon={Activity}
        iconColor="var(--cds-support-error, #da1e28)"
        severity={
          (metrics?.total_alerts_24h ?? 0) > 200
            ? 'critical'
            : (metrics?.total_alerts_24h ?? 0) > 100
              ? 'major'
              : 'info'
        }
        subtitle="Active alerts in last 24 hours"
      />
      <KPICard
        label="Events (24h)"
        value={(metrics?.total_events_24h ?? 0).toLocaleString()}
        icon={ChartLineData}
        iconColor="var(--cds-interactive, #0f62fe)"
        severity="info"
        subtitle="Total events processed"
      />
      <KPICard
        label="Avg Response Time"
        value={`${metrics?.avg_response_time_ms ?? 0}ms`}
        icon={Time}
        iconColor="var(--cds-support-success, #42be65)"
        severity={
          (metrics?.avg_response_time_ms ?? 0) > 500
            ? 'critical'
            : (metrics?.avg_response_time_ms ?? 0) > 200
              ? 'major'
              : 'success'
        }
        subtitle="API response latency"
      />
      <KPICard
        label="Error Rate"
        value={`${(metrics?.error_rate_percent ?? 0).toFixed(2)}%`}
        icon={EventSchedule}
        iconColor={
          (metrics?.error_rate_percent ?? 0) > 5 ? 'var(--cds-support-error, #da1e28)' : 'var(--cds-support-success, #42be65)'
        }
        severity={
          (metrics?.error_rate_percent ?? 0) > 5
            ? 'critical'
            : (metrics?.error_rate_percent ?? 0) > 1
              ? 'major'
              : 'success'
        }
        subtitle="Critical alert ratio"
      />
    </div>
  );
});
