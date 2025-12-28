/**
 * Alert KPI Row Component
 * 
 * Displays the 4 key metrics for an alert:
 * - Severity Level with priority tag
 * - AI Confidence with progress bar
 * - Time Elapsed since detection
 * - Similar Events count
 */

import { Tile, Tag, ProgressBar } from '@carbon/react';
import {
    IbmWatsonxCodeAssistant,
    Time,
    Renew,
} from '@carbon/icons-react';
import { SEVERITY_CONFIG, type Severity } from '@/constants';
import '@/styles/AlertDetailsPage.scss';

interface AlertKPIRowProps {
    severity: Severity;
    aiConfidence: number;
    timeElapsed: string;
    detectedAt: string;
    similarEvents: number;
    similarEventsPeriod?: string;
}

export function AlertKPIRow({
    severity,
    aiConfidence,
    timeElapsed,
    detectedAt,
    similarEvents,
    similarEventsPeriod = 'Last 30 days',
}: AlertKPIRowProps) {
    const config = SEVERITY_CONFIG[severity];
    const SeverityIcon = config.icon;

    return (
        <div className="alert-kpi-row">
            {/* Severity Level */}
            <Tile className="alert-kpi-tile alert-kpi-tile--severity" style={{ borderLeftColor: config.color }}>
                <div className="alert-kpi-icon" style={{ backgroundColor: config.backgroundColor }}>
                    <SeverityIcon size={24} style={{ color: config.color }} />
                </div>
                <div className="alert-kpi-content">
                    <span className="alert-kpi-label">Severity Level</span>
                    <h3 className="alert-kpi-value">{config.label}</h3>
                    <Tag type="cyan" size="sm">Priority 1</Tag>
                </div>
            </Tile>

            {/* AI Confidence */}
            <Tile className="alert-kpi-tile">
                <div className="alert-kpi-icon alert-kpi-icon--purple">
                    <IbmWatsonxCodeAssistant size={24} />
                </div>
                <div className="alert-kpi-content">
                    <span className="alert-kpi-label">AI Confidence</span>
                    <h3 className="alert-kpi-value">{aiConfidence}%</h3>
                    <ProgressBar
                        label={`${aiConfidence}%`}
                        value={aiConfidence}
                        max={100}
                        hideLabel
                        size="small"
                        className="alert-kpi-progress"
                    />
                </div>
            </Tile>

            {/* Time Elapsed */}
            <Tile className="alert-kpi-tile">
                <div className="alert-kpi-icon alert-kpi-icon--blue">
                    <Time size={24} />
                </div>
                <div className="alert-kpi-content">
                    <span className="alert-kpi-label">Time Elapsed</span>
                    <h3 className="alert-kpi-value">{timeElapsed}</h3>
                    <span className="alert-kpi-subtitle">Detected at {detectedAt}</span>
                </div>
            </Tile>

            {/* Similar Events */}
            <Tile className="alert-kpi-tile">
                <div className="alert-kpi-icon alert-kpi-icon--orange">
                    <Renew size={24} />
                </div>
                <div className="alert-kpi-content">
                    <span className="alert-kpi-label">Similar Events</span>
                    <h3 className="alert-kpi-value">{similarEvents}</h3>
                    <span className="alert-kpi-subtitle">{similarEventsPeriod}</span>
                </div>
            </Tile>
        </div>
    );
}

export default AlertKPIRow;
