/**
 * AI-Generated Explanation Component
 *
 * Displays the AI analysis of the alert including:
 * - Summary explanation
 * - Root Cause Analysis with checkmarks
 * - Business Impact warning
 * - Recommended Actions (numbered list)
 */

import React from 'react';
import { Tile, OrderedList, ListItem } from '@carbon/react';
import {
    IbmWatsonxCodeAssistant,
    CheckmarkFilled,
    WarningFilled,
    CircleFilled,
} from '@carbon/icons-react';
import '@/styles/pages/_alert-details.scss';

interface RootCauseItem {
    text: string;
    confirmed: boolean;
}

interface AIExplanationProps {
    summary: string;
    rootCauseAnalysis: RootCauseItem[];
    businessImpact: {
        level: 'high' | 'medium' | 'low';
        description: string;
    };
    recommendedActions: string[];
}

export const AIExplanation = React.memo(function AIExplanation({
    summary,
    rootCauseAnalysis,
    businessImpact,
    recommendedActions,
}: AIExplanationProps) {
    return (
        <Tile className="ai-explanation">
            {/* Header */}
            <div className="ai-explanation__header">
                <div className="ai-explanation__icon">
                    <IbmWatsonxCodeAssistant size={24} />
                </div>
                <h4 className="ai-explanation__title">AI-Generated Explanation</h4>
            </div>

            {/* Summary */}
            <div className="ai-explanation__section">
                <h5 className="ai-explanation__section-title">Summary</h5>
                <p className="ai-explanation__summary">{summary}</p>
            </div>

            {/* Root Cause Analysis */}
            <div className="ai-explanation__section">
                <h5 className="ai-explanation__section-title">Root Cause Analysis</h5>
                <ul className="ai-explanation__root-cause-list">
                    {rootCauseAnalysis.map((item, index) => (
                        <li key={index} className="ai-explanation__root-cause-item">
                            {item.confirmed ? (
                                <CheckmarkFilled size={16} className="ai-explanation__icon--success" />
                            ) : (
                                <CircleFilled size={16} className="ai-explanation__icon--warning" />
                            )}
                            <span>{item.text}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Business Impact */}
            <div className="ai-explanation__section">
                <h5 className="ai-explanation__section-title ai-explanation__section-title--impact">
                    Business Impact
                </h5>
                <div className={`ai-explanation__impact-box ai-explanation__impact-box--${businessImpact.level}`}>
                    <WarningFilled size={16} className={`ai-explanation__impact-icon ai-explanation__impact-icon--${businessImpact.level}`} />
                    <span>
                        <strong>{businessImpact.level.charAt(0).toUpperCase() + businessImpact.level.slice(1)}</strong>
                        {' - '}
                        {businessImpact.description}
                    </span>
                </div>
            </div>

            {/* Recommended Actions */}
            <div className="ai-explanation__section">
                <h5 className="ai-explanation__section-title ai-explanation__section-title--actions">
                    Recommended Actions
                </h5>
                <OrderedList className="ai-explanation__actions-list">
                    {recommendedActions.map((action, index) => (
                        <ListItem key={index} className="ai-explanation__action-item">
                            <div className="ai-explanation__action-number">{index + 1}</div>
                            <span>{action}</span>
                        </ListItem>
                    ))}
                </OrderedList>
            </div>
        </Tile>
    );
});

export default AIExplanation;
