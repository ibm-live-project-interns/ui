/**
 * Copyright IBM Corp. 2026
 *
 * DeviceMetricsCharts - Performance chart tile with period selector.
 * Displays CPU and Memory usage over time using a Carbon LineChart.
 */

import React from 'react';
import {
    Tile,
    SkeletonPlaceholder,
    ContentSwitcher,
    Switch,
} from '@carbon/react';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';

import type { MetricDataPoint, MetricsPeriod } from './deviceDetails.types';
import { PERIOD_OPTIONS } from './deviceDetails.types';

// ==========================================
// Types
// ==========================================

export interface DeviceMetricsChartsProps {
    metricHistory: MetricDataPoint[];
    metricsLoading: boolean;
    metricsPeriod: MetricsPeriod;
    onPeriodChange: (period: MetricsPeriod) => void;
    theme: string;
}

// ==========================================
// Component
// ==========================================

export const DeviceMetricsCharts: React.FC<DeviceMetricsChartsProps> = React.memo(
    function DeviceMetricsCharts({
        metricHistory,
        metricsLoading,
        metricsPeriod,
        onPeriodChange,
        theme,
    }) {
        return (
            <Tile className="chart-tile tile--bordered tile--purple">
                <div className="chart-tile__header">
                    <h2>Performance</h2>
                    <ContentSwitcher
                        size="sm"
                        selectedIndex={PERIOD_OPTIONS.findIndex(p => p.key === metricsPeriod)}
                        onChange={(e: { index?: number }) => {
                            if (e.index != null) {
                                const selected = PERIOD_OPTIONS[e.index];
                                if (selected) onPeriodChange(selected.key);
                            }
                        }}
                    >
                        {PERIOD_OPTIONS.map(opt => (
                            <Switch key={opt.key} name={opt.key} text={opt.label} />
                        ))}
                    </ContentSwitcher>
                </div>
                <div className="chart-container">
                    {metricsLoading ? (
                        <SkeletonPlaceholder className="chart-container__skeleton" />
                    ) : metricHistory.length > 0 ? (
                        <LineChart
                            data={metricHistory}
                            options={{
                                title: '',
                                axes: {
                                    bottom: { mapsTo: 'date', scaleType: ScaleTypes.TIME },
                                    left: { mapsTo: 'value', title: 'Usage %' },
                                },
                                curve: 'curveMonotoneX',
                                height: '300px',
                                theme,
                            }}
                        />
                    ) : (
                        <div className="chart-container__empty">
                            No performance data available
                        </div>
                    )}
                </div>
            </Tile>
        );
    }
);
