/**
 * Historical Alerts Component
 *
 * Displays a list of similar past alerts with:
 * - Timestamp
 * - Alert title
 * - Resolution info
 * - Severity tag
 * - View All button
 */

import { Tile, Button, Tag } from '@carbon/react';
import { ArrowRight } from '@carbon/icons-react';
import { SEVERITY_CONFIG, type Severity } from '@/shared/constants/severity';
import '@/styles/pages/_alert-details.scss';

interface HistoricalAlertItem {
    id: string;
    timestamp: string;
    title: string;
    resolution: string;
    severity: Severity;
}

interface HistoricalAlertsProps {
    alerts: HistoricalAlertItem[];
    onViewAll?: () => void;
    maxDisplay?: number;
}

export function HistoricalAlerts({
    alerts,
    onViewAll,
    maxDisplay = 3,
}: HistoricalAlertsProps) {
    const displayedAlerts = alerts.slice(0, maxDisplay);

    return (
        <Tile className="historical-alerts">
            <div className="historical-alerts__header">
                <h4 className="historical-alerts__title">Similar Historical Alerts</h4>
            </div>

            <div className="historical-alerts__list">
                {displayedAlerts.map((alert) => {
                    const config = SEVERITY_CONFIG[alert.severity];
                    return (
                        <div key={alert.id} className="historical-alerts__item">
                            <div className="historical-alerts__item-header">
                                <span className="historical-alerts__timestamp">{typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp as any)?.relative || 'N/A'}</span>
                                <Tag type={config.tagType} size="sm">
                                    {config.label}
                                </Tag>
                            </div>
                            <p className="historical-alerts__item-title">{alert.title}</p>
                            <p className="historical-alerts__item-resolution">{alert.resolution}</p>
                        </div>
                    );
                })}
            </div>

            {alerts.length > maxDisplay && onViewAll && (
                <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={ArrowRight}
                    onClick={onViewAll}
                    className="historical-alerts__view-all"
                >
                    View All Historical Alerts
                </Button>
            )}
        </Tile>
    );
}

export default HistoricalAlerts;
