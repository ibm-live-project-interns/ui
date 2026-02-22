/**
 * AIInsightsPanel - Grid of AI-generated insight cards with action buttons.
 */

import React from 'react';
import { Tile, Button, Tag } from '@carbon/react';
import {
    IbmWatsonxCodeAssistant,
    ArrowRight,
    ChartLineSmooth,
    Light,
    Checkmark,
    WarningAlt,
} from '@carbon/icons-react';
import type { AIInsight } from '@/features/alerts/services/alertService';

// Insight type display configuration
interface InsightConfig {
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    iconColor: string;
}

const INSIGHT_CONFIG: Record<string, InsightConfig> = {
    pattern: {
        label: 'Pattern Detected',
        icon: ChartLineSmooth,
        iconColor: 'var(--cds-link-primary)',
    },
    optimization: {
        label: 'Optimization',
        icon: Checkmark,
        iconColor: 'var(--cds-support-success)',
    },
    recommendation: {
        label: 'Recommendation',
        icon: Light,
        iconColor: 'var(--cds-support-warning)',
    },
    trend: {
        label: 'Trend Analysis',
        icon: ChartLineSmooth,
        iconColor: 'var(--cds-link-primary)',
    },
    anomaly: {
        label: 'Anomaly Detected',
        icon: WarningAlt,
        iconColor: 'var(--cds-support-error)',
    },
};

const DEFAULT_INSIGHT_CONFIG: InsightConfig = {
    label: 'Insight',
    icon: Light,
    iconColor: 'var(--cds-text-secondary)',
};

interface AIInsightsPanelProps {
    insights: AIInsight[];
    lastFetchTime: Date | null;
    onInsightAction: (insight: AIInsight) => void;
}

export const AIInsightsPanel = React.memo(function AIInsightsPanel({
    insights,
    lastFetchTime,
    onInsightAction,
}: AIInsightsPanelProps) {
    return (
        <Tile className="ai-insights-section">
            <div className="ai-insights-header">
                <div className="ai-insights-title-group">
                    <div className="ai-insights-icon">
                        <IbmWatsonxCodeAssistant size={24} aria-label="AI insights" />
                    </div>
                    <div className="ai-insights-title-content">
                        <h3>AI-Generated Insights</h3>
                        <p className="ai-insights-subtitle">Automated pattern detection and recommendations</p>
                    </div>
                </div>
                <Tag type="blue" size="md">
                    {lastFetchTime
                        ? `Updated ${(() => {
                            const diffMs = Date.now() - lastFetchTime.getTime();
                            const diffSec = Math.floor(diffMs / 1000);
                            if (diffSec < 60) return 'just now';
                            const diffMin = Math.floor(diffSec / 60);
                            if (diffMin < 60) return `${diffMin}m ago`;
                            return `${Math.floor(diffMin / 60)}h ago`;
                        })()}`
                        : 'Loading...'}
                </Tag>
            </div>

            <div className="ai-insights-grid">
                {(!insights || insights.length === 0) ? (
                    <div className="u-empty-state-block">
                        No new AI insights available at this time.
                    </div>
                ) : (
                    insights.map((insight) => {
                        const config = INSIGHT_CONFIG[insight.type] || DEFAULT_INSIGHT_CONFIG;
                        const IconComponent = config.icon;
                        return (
                            <div key={insight.id} className="ai-insight-card">
                                <div className="ai-insight-card-header">
                                    <span className="ai-insight-card__icon" style={{ '--icon-color': config.iconColor } as React.CSSProperties}>
                                        <IconComponent size={20} aria-label={config.label} />
                                    </span>
                                    <span className="ai-insight-card-label">{config.label}</span>
                                </div>
                                <p className="ai-insight-card-description">{insight.description}</p>
                                <Button
                                    kind="ghost"
                                    size="sm"
                                    renderIcon={ArrowRight}
                                    className="ai-insight-card-action"
                                    onClick={() => onInsightAction(insight)}
                                >
                                    {insight.action}
                                </Button>
                            </div>
                        );
                    })
                )}
            </div>
        </Tile>
    );
});

export default AIInsightsPanel;
