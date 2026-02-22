/**
 * AlertDistribution - Donut chart showing alert distribution by time of day,
 * plus peak/quietest hour cards.
 */

import React, { useMemo } from 'react';
import { Tile } from '@carbon/react';
import { DonutChart } from '@carbon/charts-react';
import ChartWrapper from '@/components/ui/ChartWrapper';
import type { AlertDistribution as AlertDistributionData } from '@/features/alerts/services/alertService';
import type { ChartDataPoint } from '@/shared/types/api.types';

interface AlertDistributionProps {
    detailsDistribution: AlertDistributionData[];
    alertsOverTime: ChartDataPoint[];
    currentTheme: string;
}

export const AlertDistribution = React.memo(function AlertDistribution({
    detailsDistribution,
    alertsOverTime,
    currentTheme,
}: AlertDistributionProps) {
    const donutOptions = useMemo(
        () => ({
            resizable: true,
            donut: { center: { label: 'Total' }, alignment: 'center' as const },
            legend: { alignment: 'center' as const, position: 'bottom' as const },
            theme: currentTheme,
            toolbar: { enabled: false },
        }),
        [currentTheme]
    );

    // Compute peak and quietest hours from real alert data
    const { peakHour, quietestHour } = useMemo(() => {
        const fallback = { peakHour: '', quietestHour: '' };

        if (alertsOverTime && alertsOverTime.length > 0) {
            const hourCounts = new Map<number, number>();
            for (const point of alertsOverTime) {
                const d = point.date instanceof Date ? point.date : new Date(point.date);
                if (isNaN(d.getTime())) continue;
                const hour = d.getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + (point.value || 0));
            }

            if (hourCounts.size > 0) {
                let maxHour = 0, maxCount = -1;
                let minHour = 0, minCount = Infinity;
                for (const [hour, count] of hourCounts) {
                    if (count > maxCount) { maxCount = count; maxHour = hour; }
                    if (count < minCount) { minCount = count; minHour = hour; }
                }
                const fmt = (h: number) => `${String(h).padStart(2, '0')}:00 - ${String((h + 1) % 24).padStart(2, '0')}:00`;
                return { peakHour: fmt(maxHour), quietestHour: fmt(minHour) };
            }
        }

        if (detailsDistribution && detailsDistribution.length > 0) {
            let peakGroup = detailsDistribution[0];
            let quietGroup = detailsDistribution[0];
            for (const item of detailsDistribution) {
                if (item.value > peakGroup.value) peakGroup = item;
                if (item.value < quietGroup.value) quietGroup = item;
            }
            return { peakHour: peakGroup.group, quietestHour: quietGroup.group };
        }

        return fallback;
    }, [alertsOverTime, detailsDistribution]);

    return (
        <Tile className="distribution-tile">
            <div className="tile-header">
                <div>
                    <h3>Alert Distribution by Time of Day</h3>
                    <p className="tile-subtitle">Peak hours and patterns analysis</p>
                </div>
            </div>
            <div className="chart-container">
                <ChartWrapper
                    ChartComponent={DonutChart}
                    data={detailsDistribution}
                    options={donutOptions}
                    height="400px"
                />
            </div>
            {(peakHour || quietestHour) && (
                <div className="time-highlights">
                    {peakHour && (
                        <div className="time-card">
                            <span className="time-label">Peak Hour</span>
                            <span className="time-value">{peakHour}</span>
                        </div>
                    )}
                    {quietestHour && (
                        <div className="time-card">
                            <span className="time-label">Quietest Hour</span>
                            <span className="time-value">{quietestHour}</span>
                        </div>
                    )}
                </div>
            )}
        </Tile>
    );
});

export default AlertDistribution;
