// Reusable KPI Row Component
// Used across Dashboard, Priority Alerts, and other pages

import { Tile, Tag, ProgressBar } from '@carbon/react';
import {
    WarningFilled,
    WarningAlt,
    InformationFilled,
    ErrorFilled,
    Notification,
    CheckmarkFilled,
    ArrowUp,
    ArrowDown,
    Time,
    Repeat,
    Activity,
    Power,
} from '@carbon/icons-react';
import type { ReactNode } from 'react';
import '@/styles/components/_kpi-card.scss';

// ==========================================
// Types
// ==========================================

export type KPIVariant = 'dashboard' | 'priority-alerts' | 'alert-detail' | 'device-status' | 'metrics';
export type KPIColor = 'blue' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'teal' | 'gray';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface KPITileData {
    id: string;
    label: string;
    value: string | number;
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    color?: KPIColor;
    trend?: {
        direction: TrendDirection;
        text: string;
        positive?: boolean; // Is this trend good or bad?
    };
    tag?: {
        text: string;
        type: 'red' | 'green' | 'blue' | 'teal' | 'cyan' | 'gray' | 'magenta' | 'purple';
    };
    progress?: {
        value: number;
        max: number;
    };
    borderColor?: string; // For left border accent
}

export interface KPIRowProps {
    tiles: KPITileData[];
    variant?: KPIVariant;
    className?: string;
}

// ==========================================
// Preset Icons by Name (for convenience)
// ==========================================

export const KPI_ICONS = {
    notification: Notification,
    warning: WarningFilled,
    warningAlt: WarningAlt,
    error: ErrorFilled,
    info: InformationFilled,
    checkmark: CheckmarkFilled,
    time: Time,
    repeat: Repeat,
    arrowDown: ArrowDown,
    activity: Activity,
    power: Power,
};

// ==========================================
// KPI Tile Component
// ==========================================

function KPITile({ tile, variant }: { tile: KPITileData; variant: KPIVariant }) {
    const renderTrend = () => {
        if (!tile.trend) return null;

        const isPositive = tile.trend.positive ?? tile.trend.direction === 'down';
        const TrendIcon = tile.trend.direction === 'up' ? ArrowUp : tile.trend.direction === 'down' ? ArrowDown : null;

        return (
            <span className={`kpi-trend ${isPositive ? 'positive' : tile.trend.direction === 'stable' ? 'neutral' : 'negative'}`}>
                {TrendIcon && <TrendIcon size={14} />}
                {tile.trend.text}
            </span>
        );
    };

    const renderTag = () => {
        if (!tile.tag) return null;
        return (
            <Tag type={tile.tag.type} size="sm" className="kpi-tag">
                {tile.tag.text}
            </Tag>
        );
    };

    const renderProgress = () => {
        if (!tile.progress) return null;
        return (
            <ProgressBar
                label={`${tile.progress.value}%`}
                value={tile.progress.value}
                max={tile.progress.max}
                hideLabel
                size="small"
                className="kpi-progress"
            />
        );
    };

    // Determine class based on variant
    const tileClass = `kpi-tile kpi-tile--${variant} ${tile.color ? `kpi-tile--${tile.color}` : ''}`;

    return (
        <Tile
            className={tileClass}
            style={tile.borderColor ? { borderLeftColor: tile.borderColor } : undefined}
        >
            {/* Icon */}
            {tile.icon && (
                <div className={`kpi-icon ${tile.color ? `kpi-icon--${tile.color}` : ''}`}>
                    {tile.icon}
                </div>
            )}

            {/* Content - varies by variant */}
            {variant === 'dashboard' ? (
                <div className="kpi-content">
                    <span className="kpi-label">{tile.label}</span>
                    <h2 className="kpi-value">{tile.value}</h2>
                    <span className="kpi-title">{tile.title}</span>
                    {renderTrend()}
                </div>
            ) : variant === 'priority-alerts' ? (
                <>
                    <div className="kpi-value-large">{tile.value}</div>
                    <div className="kpi-details">
                        <div className="kpi-label">{tile.label}</div>
                        <div className="kpi-subtitle">{tile.subtitle}</div>
                    </div>
                </>
            ) : variant === 'alert-detail' ? (
                <div className="kpi-content">
                    <span className="kpi-label">{tile.label}</span>
                    <h2 className="kpi-value">{tile.value}</h2>
                    {renderTag()}
                    {renderProgress()}
                    <span className="kpi-subtitle">{tile.subtitle}</span>
                </div>
            ) : variant === 'device-status' ? (
                <div className="kpi-content">
                    {renderTag()}
                    <span className="kpi-label">{tile.label}</span>
                    <h2 className="kpi-value">{tile.value}</h2>
                    <span className="kpi-subtitle">{tile.subtitle}</span>
                </div>
            ) : (
                // metrics variant
                <div className="kpi-content">
                    {renderTag()}
                    <span className="kpi-label">{tile.label}</span>
                    <h2 className="kpi-value">{tile.value}</h2>
                    <span className="kpi-subtitle">{tile.subtitle}</span>
                    {renderProgress()}
                    <span className="kpi-footnote">{tile.title}</span>
                </div>
            )}
        </Tile>
    );
}

// ==========================================
// KPI Row Component
// ==========================================

export function KPIRow({ tiles, variant = 'dashboard', className = '' }: KPIRowProps) {
    return (
        <div className={`kpi-row kpi-row--${variant} ${className}`}>
            {tiles.map((tile) => (
                <KPITile key={tile.id} tile={tile} variant={variant} />
            ))}
        </div>
    );
}

export default KPIRow;
