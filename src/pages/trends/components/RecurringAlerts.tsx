/**
 * RecurringAlerts - Top recurring alert types tile with severity filter popover.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Button, Popover, PopoverContent } from '@carbon/react';
import { Filter } from '@carbon/icons-react';
import { SEVERITY_CONFIG, getSeverityIcon, SEVERITY_FILTER_OPTIONS } from '@/shared/constants/severity';
import type { Severity } from '@/shared/types/common.types';
import type { RecurringAlert } from '@/features/alerts/services/alertService';

interface RecurringAlertsProps {
    recurringAlerts: RecurringAlert[];
}

export const RecurringAlerts = React.memo(function RecurringAlerts({ recurringAlerts }: RecurringAlertsProps) {
    const navigate = useNavigate();
    const [severityFilter, setSeverityFilter] = useState(SEVERITY_FILTER_OPTIONS[0]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filteredAlerts = useMemo(() => {
        if (!recurringAlerts || recurringAlerts.length === 0) return [];
        if (severityFilter.id === 'all') return recurringAlerts;
        return recurringAlerts.filter(alert => alert.severity === severityFilter.id);
    }, [recurringAlerts, severityFilter]);

    return (
        <Tile className="recurring-alerts-tile">
            <div className="tile-header">
                <div>
                    <h3>Top Recurring Alert Types</h3>
                    <p className="tile-subtitle">Most frequent network events detected</p>
                </div>
                <Popover
                    open={isFilterOpen}
                    align="bottom-right"
                    caret={false}
                    dropShadow
                    onRequestClose={() => setIsFilterOpen(false)}
                >
                    <Button
                        kind={severityFilter.id !== 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        renderIcon={Filter}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        {severityFilter.id !== 'all' ? severityFilter.text : 'Filter'}
                    </Button>
                    <PopoverContent>
                        <div className="filter-popover-simple">
                            <div className="filter-popover-simple__header">
                                <span>Filter by Severity</span>
                                {severityFilter.id !== 'all' && (
                                    <Button
                                        kind="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSeverityFilter(SEVERITY_FILTER_OPTIONS[0]);
                                            setIsFilterOpen(false);
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="filter-popover-simple__options">
                                {SEVERITY_FILTER_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        className={`filter-option ${severityFilter.id === option.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setSeverityFilter(option);
                                            setIsFilterOpen(false);
                                        }}
                                    >
                                        {option.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="recurring-alerts-list">
                {(!filteredAlerts || filteredAlerts.length === 0) ? (
                    <div className="recurring-alerts-empty">
                        {severityFilter.id !== 'all'
                            ? `No ${severityFilter.text.toLowerCase()} recurring alerts detected.`
                            : 'No recurring alerts detected in this period.'}
                    </div>
                ) : (
                    filteredAlerts.map((alert) => {
                        const severity = (alert.severity || 'info') as Severity;
                        return (
                            <div key={alert.id} className="recurring-alert-row">
                                <div className={`alert-severity-icon ${severity}`}>
                                    {getSeverityIcon(severity, 20)}
                                </div>
                                <div className="alert-info">
                                    <div className="alert-name-row">
                                        <span
                                            className="alert-name alert-name--link"
                                            role="link"
                                            tabIndex={0}
                                            onClick={() => navigate(`/alerts?search=${encodeURIComponent(alert.name)}`)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/alerts?search=${encodeURIComponent(alert.name)}`); }}
                                        >
                                            {alert.name}
                                        </span>
                                        <span className="alert-count">{alert.count} occurrences</span>
                                    </div>
                                    <div className="alert-resolution">
                                        Avg resolution: <span className="resolution-time">{alert.avgResolution}</span>
                                    </div>
                                </div>
                                <div className="alert-progress-bar">
                                    <div
                                        className={`progress-fill progress-fill--${severity}`}
                                        style={{ '--bar-width': `${alert.percentage}%` } as React.CSSProperties}
                                    ></div>
                                </div>
                            </div>
                        );
                    }))
                }
            </div>
        </Tile>
    );
});

export default RecurringAlerts;
