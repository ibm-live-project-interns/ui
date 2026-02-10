/**
 * Chart Constants and Utilities
 *
 * Carbon Charts configurations and helpers.
 */

import { ScaleTypes } from '@carbon/charts';
import { SEVERITY_CONFIG } from './severity';
import type { SeverityDisplay } from '@/shared/types';

// ==========================================
// Chart Color Scale
// ==========================================

export const CHART_COLOR_SCALE: Record<SeverityDisplay, string> = {
    Critical: SEVERITY_CONFIG.critical.color,
    High: SEVERITY_CONFIG.high.color,
    Major: SEVERITY_CONFIG.major.color,
    Medium: SEVERITY_CONFIG.medium.color,
    Minor: SEVERITY_CONFIG.minor.color,
    Low: SEVERITY_CONFIG.low.color,
    Info: SEVERITY_CONFIG.info.color,
};

// ==========================================
// Chart Options Factory
// ==========================================

export interface ChartOptionsConfig {
    title: string;
    height?: string;
    theme: string;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    showTitle?: boolean;
}

export function createBaseChartOptions(config: ChartOptionsConfig) {
    const showTitle = config.showTitle !== false;
    return {
        ...(showTitle && { title: config.title }),
        height: config.height || '320px',
        color: { scale: CHART_COLOR_SCALE },
        legend: {
            position: config.legendPosition || 'top',
            alignment: 'center' as const,
        },
        toolbar: { enabled: true },
        theme: config.theme,
    };
}

export function createAreaChartOptions(config: ChartOptionsConfig) {
    return {
        ...createBaseChartOptions(config),
        axes: {
            left: { stacked: true, scaleType: ScaleTypes.LINEAR, mapsTo: 'value' },
            bottom: { scaleType: ScaleTypes.TIME, mapsTo: 'date' },
        },
        curve: 'curveMonotoneX',
        timeScale: { addSpaceOnEdges: 0 },
    };
}

export function createDonutChartOptions(config: ChartOptionsConfig) {
    return {
        ...createBaseChartOptions({ ...config, legendPosition: 'bottom' }),
        resizable: true,
        donut: { center: { label: 'Alerts' } },
    };
}
