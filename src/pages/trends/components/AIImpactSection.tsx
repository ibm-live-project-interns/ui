/**
 * AIImpactSection - AI impact over time line chart with AI metric cards.
 */

import React, { useMemo } from 'react';
import { Tile } from '@carbon/react';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import type { ChartDataPoint } from '@/shared/types/api.types';
import type { AIMetric } from '@/features/alerts/types';

interface AIImpactSectionProps {
    aiImpactOverTime: ChartDataPoint[];
    aiMetrics: AIMetric[];
    currentTheme: string;
}

export const AIImpactSection = React.memo(function AIImpactSection({
    aiImpactOverTime,
    aiMetrics,
    currentTheme,
}: AIImpactSectionProps) {
    const lineChartOptions = useMemo(
        () => ({
            axes: {
                left: { title: 'Value', mapsTo: 'value', includeZero: false },
                bottom: { title: 'Time', mapsTo: 'date', scaleType: ScaleTypes.TIME },
            },
            height: '100%',
            curve: 'curveMonotoneX' as const,
            theme: currentTheme,
            toolbar: { enabled: false },
            legend: { alignment: 'center' as const },
            points: { enabled: true, radius: 2 },
        }),
        [currentTheme]
    );

    return (
        <Tile className="ai-impact-tile">
            <div className="tile-header">
                <div>
                    <h3>AI Impact Over Time</h3>
                    <p className="tile-subtitle">Measuring LLM decoder effectiveness</p>
                </div>
            </div>
            <div className="chart-container">
                <ChartWrapper
                    ChartComponent={LineChart}
                    data={aiImpactOverTime}
                    options={lineChartOptions}
                    height="350px"
                />
            </div>
            <div className="impact-metrics">
                {aiMetrics && aiMetrics.length > 0 ? aiMetrics.map((metric) => (
                    <div key={metric.label} className="metric-card positive">
                        <span className="metric-label">{metric.label}</span>
                        <span className="metric-value">
                            {metric.id === 'ai-accuracy'
                                ? `${metric.value}%`
                                : metric.value}
                        </span>
                        {metric.description && (
                            <span className="metric-description u-metric-description">
                                {metric.description}
                            </span>
                        )}
                    </div>
                )) : (
                    <div className="u-empty-state-block">
                        No metrics available
                    </div>
                )}
            </div>
        </Tile>
    );
});

export default AIImpactSection;
