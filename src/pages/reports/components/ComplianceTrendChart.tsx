/**
 * Copyright IBM Corp. 2026
 *
 * ComplianceTrendChart - SLA compliance trend line chart.
 * Shows daily compliance percentage with a target line.
 */

import React, { useMemo } from 'react';
import { Tile } from '@carbon/react';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import '@carbon/charts-react/styles.css';

import ChartWrapper from '@/components/ui/ChartWrapper';

import '@/styles/pages/_compliance-table.scss';

// ==========================================
// Types
// ==========================================

export interface SLATrendPoint {
  date: string;
  compliance_percent: number;
  met: number;
  violated: number;
  total: number;
}

// ==========================================
// Props
// ==========================================

export interface ComplianceTrendChartProps {
  trend: SLATrendPoint[];
  targetPercent: number;
  currentTheme: string;
}

// ==========================================
// Component
// ==========================================

export const ComplianceTrendChart = React.memo(function ComplianceTrendChart({
  trend,
  targetPercent,
  currentTheme,
}: ComplianceTrendChartProps) {
  const trendChartData = useMemo(() => {
    if (!trend || trend.length === 0) return [];

    const compliancePoints = trend.map((point) => ({
      group: 'SLA Compliance',
      date: new Date(point.date),
      value: point.compliance_percent,
    }));

    // Add target line
    const targetPoints = trend.map((point) => ({
      group: `Target (${targetPercent}%)`,
      date: new Date(point.date),
      value: targetPercent,
    }));

    return [...compliancePoints, ...targetPoints];
  }, [trend, targetPercent]);

  const lineChartOptions = useMemo(
    () => ({
      axes: {
        left: {
          title: 'Compliance %',
          mapsTo: 'value',
          includeZero: false,
          domain: [
            Math.max(0, Math.min(...(trend.map((t) => t.compliance_percent).filter((v) => v > 0))) - 5),
            100,
          ],
        },
        bottom: {
          title: 'Date',
          mapsTo: 'date',
          scaleType: ScaleTypes.TIME,
        },
      },
      height: '100%',
      curve: 'curveMonotoneX' as const,
      theme: currentTheme,
      toolbar: { enabled: false },
      legend: { alignment: 'center' as const, position: 'top' as const },
      points: { enabled: true, radius: 3 },
      color: {
        scale: {
          'SLA Compliance': '#0f62fe',
          [`Target (${targetPercent}%)`]: '#da1e28',
        },
      },
    }),
    [currentTheme, trend, targetPercent]
  );

  return (
    <Tile className="compliance-tile compliance-tile--chart">
      <div className="compliance-tile__header">
        <h3 className="compliance-tile__title">
          SLA Compliance Trend
        </h3>
        <p className="compliance-tile__description">
          Daily compliance percentage with {targetPercent}% target line
        </p>
      </div>
      <div className="compliance-trend-chart__container">
        <ChartWrapper
          ChartComponent={LineChart}
          data={trendChartData}
          options={lineChartOptions}
          height="400px"
          emptyMessage="No trend data available for this period"
        />
      </div>
    </Tile>
  );
});
