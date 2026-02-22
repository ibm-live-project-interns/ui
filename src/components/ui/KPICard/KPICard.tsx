/**
 * Copyright IBM Corp. 2026
 *
 * KPICard Component
 * Displays a KPI metric with trend indicator, colored icon, and severity accent.
 */

import React from 'react';
import { Tile, SkeletonText } from '@carbon/react';
import { ArrowUp, ArrowDown, Subtract } from '@carbon/icons-react';
import './KPICard.scss';

export type KPISeverity = 'critical' | 'major' | 'warning' | 'minor' | 'info' | 'success' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface KPITrend {
    /** Direction of the trend */
    direction: TrendDirection;
    /** Display value (e.g., "12%", "-5%", "+3 new") */
    value: string;
    /** Whether this trend is positive for the metric */
    isPositive: boolean;
}

export interface KPICardProps {
    /** Unique identifier */
    id?: string;
    /** KPI label/title */
    label: string;
    /** Primary value to display */
    value: string | number;
    /** Icon to display in top-right */
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    /** Icon color - applies directly to the icon (e.g., 'var(--cds-interactive, #0f62fe)', 'var(--cds-support-error, #da1e28)') */
    iconColor?: string;
    /** Trend indicator */
    trend?: KPITrend;
    /** Severity determines the accent color */
    severity?: KPISeverity;
    /** Optional subtitle text */
    subtitle?: string;
    /** Optional badge/tag */
    badge?: {
        text: string;
        type?: 'default' | 'success' | 'warning' | 'error';
    };
    /** Click handler */
    onClick?: () => void;
    /** Additional class name */
    className?: string;
    /** Loading state - shows Carbon skeleton */
    loading?: boolean;
}

/**
 * KPICard - Displays a KPI metric with severity-based styling
 *
 * Features:
 * - Bottom border accent colored by severity
 * - Colored icon support via iconColor prop
 * - Trend indicators with up/down arrows
 * - Carbon skeleton loading state
 * - Optional badge display
 */
export const KPICard = React.memo(function KPICard({
    id,
    label,
    value,
    icon: Icon,
    iconColor,
    trend,
    severity = 'neutral',
    subtitle,
    badge,
    onClick,
    className = '',
    loading = false,
}: KPICardProps) {
    const TrendIcon = trend?.direction === 'up'
        ? ArrowUp
        : trend?.direction === 'down'
            ? ArrowDown
            : Subtract;

    const trendClass = trend
        ? trend.isPositive
            ? 'kpi-card__trend--positive'
            : 'kpi-card__trend--negative'
        : '';

    // Loading state with Carbon skeleton components
    if (loading) {
        return (
            <Tile className={`kpi-card kpi-card--${severity} ${className}`}>
                <div className="kpi-card__header">
                    <SkeletonText width="60%" />
                </div>
                <SkeletonText heading width="40%" />
                <SkeletonText width="50%" />
            </Tile>
        );
    }

    // Keyboard accessibility: trigger click on Enter/Space
    const handleKeyDown = onClick
        ? (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            }
        }
        : undefined;

    return (
        <Tile
            id={id}
            className={`kpi-card kpi-card--${severity} ${onClick ? 'kpi-card--clickable' : ''} ${className}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={onClick ? `${label}: ${value}` : undefined}
        >
            {Icon && (
                <span
                    className="kpi-card__icon"
                    style={iconColor ? { color: iconColor } : undefined}
                    aria-hidden="true"
                >
                    <Icon size={20} />
                </span>
            )}

            <div className="kpi-card__header">
                <span className="kpi-card__label">{label}</span>
            </div>

            <div className="kpi-card__value-row" aria-live="polite" aria-atomic="true">
                <span className="kpi-card__value">{value}</span>
                {badge && (
                    <span className={`kpi-card__badge kpi-card__badge--${badge.type || 'default'}`}>
                        {badge.text}
                    </span>
                )}
            </div>

            {subtitle && (
                <span className="kpi-card__subtitle">{subtitle}</span>
            )}

            {trend && (
                <div className={`kpi-card__trend ${trendClass}`}>
                    <TrendIcon size={12} />
                    <span>{trend.value}</span>
                </div>
            )}
        </Tile>
    );
});

export default KPICard;
