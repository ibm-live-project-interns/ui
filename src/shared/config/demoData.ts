/**
 * Demo Data for Dashboard
 *
 * Provides fallback demo data when API calls fail or return empty results.
 * Used for development and demo purposes.
 */

import type { SummaryAlert, NoisyDevice } from '@/features/alerts/types/alert.types';

// Alert Summary Demo Data - NO LONGER USED, keeping for reference only
// All data should come from the database via API
export const alertSummary = {
    activeCount: 0,
    criticalCount: 0,
    majorCount: 0,
    minorCount: 0,
    warningCount: 0,
    infoCount: 0,
    resolvedToday: 0,
    mttr: '0m',
};

// Severity Distribution for Donut Chart - empty by default
export const severityDistribution: { group: string; value: number }[] = [];

// Recent Alerts Demo Data - empty by default
export const recentAlerts: SummaryAlert[] = [];

// Noisy Devices Demo Data - empty by default
export const noisyDevices: NoisyDevice[] = [];

// AI Metrics Demo Data - empty by default
export interface DemoAIMetric {
    name: string;
    value: number;
    trend: 'positive' | 'negative';
    change: string;
}

export const aiMetrics: DemoAIMetric[] = [];

/**
 * Generate alerts over time data for charts
 */
export function getDemoAlertsOverTime(period: '24h' | '7d' | '30d' = '24h') {
    const data: { date: string; group: string; value: number }[] = [];
    const severities = ['Critical', 'Major', 'Minor', 'Warning'];

    let points: number;
    let dateFormat: (i: number) => string;

    const now = new Date();

    switch (period) {
        case '24h':
            points = 24;
            dateFormat = (i) => {
                const d = new Date(now);
                d.setHours(d.getHours() - (23 - i));
                return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            };
            break;
        case '7d':
            points = 7;
            dateFormat = (i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - i));
                return d.toLocaleDateString('en-US', { weekday: 'short' });
            };
            break;
        case '30d':
            points = 30;
            dateFormat = (i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (29 - i));
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            };
            break;
    }

    for (let i = 0; i < points; i++) {
        const dateLabel = dateFormat(i);
        severities.forEach(severity => {
            const baseValue = severity === 'Critical' ? 3 :
                             severity === 'Major' ? 8 :
                             severity === 'Minor' ? 15 : 12;
            const variation = Math.floor(Math.random() * 5) - 2;
            data.push({
                date: dateLabel,
                group: severity,
                value: Math.max(0, baseValue + variation)
            });
        });
    }

    return data;
}

// Combined demoData export for convenience
export const demoData = {
    alertSummary,
    severityDistribution,
    recentAlerts,
    noisyDevices,
    aiMetrics,
};

export default demoData;
