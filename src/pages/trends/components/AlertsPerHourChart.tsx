/**
 * AlertsPerHourChart - Stacked bar chart showing alerts per hour by severity.
 */

import React, { useMemo } from 'react';
import { Tile } from '@carbon/react';
import { StackedBarChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { SEVERITY_CONFIG } from '@/shared/constants/severity';
import type { ChartDataPoint } from '@/shared/types/api.types';

interface AlertsPerHourChartProps {
    alertsOverTime: ChartDataPoint[];
    currentTheme: string;
}

export const AlertsPerHourChart = React.memo(function AlertsPerHourChart({ alertsOverTime, currentTheme }: AlertsPerHourChartProps) {
    const processedData = useMemo(() => {
        if (!alertsOverTime) return [];
        return alertsOverTime.map(d => ({
            ...d,
            hour: d.date ? new Date(d.date).getHours() + ':00' : '00:00'
        }));
    }, [alertsOverTime]);

    const stackedBarOptions = useMemo(
        () => ({
            axes: {
                left: { mapsTo: 'value', stacked: true },
                bottom: { mapsTo: 'hour', scaleType: ScaleTypes.LABELS },
            },
            height: '100%',
            color: {
                scale: {
                    Critical: SEVERITY_CONFIG.critical.color,
                    Major: SEVERITY_CONFIG.major.color,
                    Minor: SEVERITY_CONFIG.minor.color,
                    Info: SEVERITY_CONFIG.info.color,
                },
            },
            theme: currentTheme,
            toolbar: { enabled: false },
            legend: { alignment: 'center' as const, position: 'top' as const },
        }),
        [currentTheme]
    );

    return (
        <Tile className="alerts-chart-tile">
            <div className="chart-header">
                <div className="chart-title-group">
                    <h3>Alerts Per Hour (Last 24 Hours)</h3>
                    <p className="chart-subtitle">Real-time alert volume tracking with severity breakdown</p>
                </div>
            </div>
            <div className="chart-container">
                <ChartWrapper
                    ChartComponent={StackedBarChart}
                    data={processedData}
                    options={stackedBarOptions}
                    height="400px"
                />
            </div>
        </Tile>
    );
});

export default AlertsPerHourChart;
