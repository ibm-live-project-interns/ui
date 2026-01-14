/**
 * Alert KPI Row Component
 * 
 * Displays the 4 key metrics for an alert using the unified KPICard component:
 * - Severity Level with priority tag
 * - AI Confidence with progress bar
 * - Time Elapsed since detection
 * - Similar Events count
 */

import {
    IbmWatsonxCodeAssistant,
    Time,
    Renew,
} from '@carbon/icons-react';
import { SEVERITY_CONFIG, type Severity } from '@/constants';
import { KPICard } from '@/components/shared/KPICard';
import type { KPICardData, KPIColor } from '@/components/shared/KPICard';
import '@/styles/KPICard.scss';

interface AlertKPIRowProps {
    severity: Severity;
    aiConfidence: number;
    timeElapsed: string;
    detectedAt: string;
    similarEvents: number;
    similarEventsPeriod?: string;
}

// Map severity to KPI color
const severityColorMap: Record<Severity, KPIColor> = {
    critical: 'red',
    major: 'orange',
    minor: 'yellow',
    info: 'blue',
};

export function AlertKPIRow({
    severity,
    aiConfidence,
    timeElapsed,
    detectedAt,
    similarEvents,
    similarEventsPeriod = 'Last 30 days',
}: AlertKPIRowProps) {
    const config = SEVERITY_CONFIG[severity];
    const color = severityColorMap[severity];

    // Build KPI cards data
    const kpiCards: KPICardData[] = [
        {
            id: 'severity',
            label: 'Severity Level',
            value: config.label,
            subtitle: 'Priority 1',
            IconComponent: config.icon,
            color,
            borderColor: color,
            badge: {
                text: 'Priority 1',
                type: 'cyan',
            },
        },
        {
            id: 'ai-confidence',
            label: 'AI Confidence',
            value: `${aiConfidence}%`,
            IconComponent: IbmWatsonxCodeAssistant,
            color: 'purple',
            progress: {
                value: aiConfidence,
                max: 100,
            },
        },
        {
            id: 'time-elapsed',
            label: 'Time Elapsed',
            value: timeElapsed,
            subtitle: `Detected at ${detectedAt}`,
            IconComponent: Time,
            color: 'blue',
        },
        {
            id: 'similar-events',
            label: 'Similar Events',
            value: similarEvents,
            subtitle: similarEventsPeriod,
            IconComponent: Renew,
            color: 'orange',
        },
    ];

    return (
        <div className="kpi-row">
            {kpiCards.map((card) => (
                <KPICard
                    key={card.id}
                    {...card}
                    variant={card.id === 'severity' ? 'bordered' : 'default'}
                />
            ))}
        </div>
    );
}

export default AlertKPIRow;
