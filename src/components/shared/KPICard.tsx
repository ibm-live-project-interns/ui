import type { CarbonIconType } from '@carbon/icons-react';
import { ArrowUp, ArrowDown, Subtract } from '@carbon/icons-react';
import { Tag, ProgressBar } from '@carbon/react';

// Export color type for use in other components
export type KPIColor = 'blue' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'teal' | 'cyan';

export interface KPICardProps {
    id?: string;
    label: string;
    value: string | number;
    subtitle?: string;
    footnote?: string;
    trend?: {
        sentiment: 'positive' | 'negative' | 'neutral';
        direction: 'up' | 'down' | 'flat';
        value: string;
    };
    IconComponent: CarbonIconType;
    color: KPIColor;
    borderColor?: KPIColor;
    borderedSeverity?: KPIColor;
    badge?: {
        text: string;
        type: 'red' | 'magenta' | 'purple' | 'blue' | 'green' | 'gray' | 'cyan';
    };
    progress?: {
        value: number;
        max: number;
    };
    variant?: 'default' | 'bordered';
}

// Export type alias for backward compatibility
export type KPICardData = KPICardProps;

export function KPICard({
    label, value, subtitle, footnote, trend, IconComponent,
    color, borderColor, borderedSeverity, badge, progress, variant = 'default'
}: KPICardProps) {
    const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
        if (direction === 'up') return <ArrowUp size={16} />;
        if (direction === 'down') return <ArrowDown size={16} />;
        return <Subtract size={16} />;
    };

    const borderStyle = borderedSeverity || borderColor || color;

    return (
        <div className={`kpi-card ${variant === 'bordered' ? 'kpi-card--bordered' : ''} kpi-card--border-${borderStyle}`}>
            {badge && (
                <div className="kpi-card__badge">
                    <Tag type={badge.type} size="sm">{badge.text}</Tag>
                </div>
            )}

            <div className={`kpi-card__icon kpi-card__icon--${color}`}>
                <div className="kpi-card__icon-outer">
                    <div className="kpi-card__icon-inner">
                        <IconComponent size={20} />
                    </div>
                </div>
            </div>

            <div className="kpi-card__content">
                <div className="kpi-card__label">{label}</div>
                <div className="kpi-card__value">{value}</div>
                {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
                {footnote && <div className="kpi-card__footnote">{footnote}</div>}
                {progress && (
                    <div className="kpi-card__progress">
                        <ProgressBar value={progress.value} max={progress.max} size="small" hideLabel label="" />
                    </div>
                )}
                {trend && (
                    <div className={`kpi-card__trend kpi-card__trend--${trend.sentiment}`}>
                        {getTrendIcon(trend.direction)}
                        <span>{trend.value}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
