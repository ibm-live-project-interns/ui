/**
 * Copyright IBM Corp. 2026
 *
 * AlertTicker Component
 * Displays a scrolling ticker of critical alerts with click-to-navigate functionality
 */

import { useNavigate } from 'react-router-dom';
import { Warning } from '@carbon/icons-react';
import './AlertTicker.scss';

export interface CriticalAlert {
    id: string;
    timestamp: string;
    message: string;
    deviceName?: string;
    severity?: 'critical' | 'high' | 'major';
}

export interface AlertTickerProps {
    /** Array of critical alerts to display */
    alerts: CriticalAlert[];
    /** Callback when an alert is clicked */
    onAlertClick?: (alertId: string) => void;
    /** Animation speed in seconds (default: 30) */
    speed?: number;
    /** Whether the ticker is paused */
    paused?: boolean;
    /** Custom class name */
    className?: string;
}

/**
 * AlertTicker - Scrolling banner for critical alerts
 *
 * @example
 * ```tsx
 * <AlertTicker
 *   alerts={criticalAlerts}
 *   onAlertClick={(id) => navigate(`/alerts/${id}`)}
 *   speed={25}
 * />
 * ```
 */
export function AlertTicker({
    alerts,
    onAlertClick,
    speed = 30,
    paused = false,
    className = '',
}: AlertTickerProps) {
    const navigate = useNavigate();

    const handleAlertClick = (alertId: string) => {
        if (onAlertClick) {
            onAlertClick(alertId);
        } else {
            navigate(`/alerts/${alertId}`);
        }
    };

    if (alerts.length === 0) {
        return (
            <div className={`alert-ticker alert-ticker--empty ${className}`}>
                <div className="alert-ticker__badge alert-ticker__badge--success">
                    <span>ALL CLEAR</span>
                </div>
                <div className="alert-ticker__message">
                    No critical alerts at this time
                </div>
            </div>
        );
    }

    return (
        <div className={`alert-ticker ${paused ? 'alert-ticker--paused' : ''} ${className}`}>
            <div className="alert-ticker__badge">
                <Warning size={14} />
                <span>CRITICAL</span>
            </div>
            <div className="alert-ticker__container">
                <div
                    className="alert-ticker__content"
                    style={{ animationDuration: `${speed}s` }}
                >
                    {/* Duplicate alerts for seamless loop */}
                    {[...alerts, ...alerts].map((alert, index) => (
                        <button
                            key={`${alert.id}-${index}`}
                            className="alert-ticker__item"
                            onClick={() => handleAlertClick(alert.id)}
                            type="button"
                        >
                            <span className={`alert-ticker__time ${alert.severity === 'major' ? 'alert-ticker__time--major' : ''}`}>
                                [{typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp as any)?.relative || 'Now'}]
                            </span>
                            {alert.deviceName && (
                                <span className="alert-ticker__device">
                                    {alert.deviceName}:
                                </span>
                            )}
                            <span className="alert-ticker__text">
                                {alert.message}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AlertTicker;
