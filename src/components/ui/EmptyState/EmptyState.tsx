/**
 * Copyright IBM Corp. 2026
 *
 * EmptyState Component
 * Displays a standardized empty state with icon, title, description, and optional action.
 * Used across pages when no data is available (e.g., no alerts, no tickets, no search results).
 */

import React from 'react';
import { Button } from '@carbon/react';
import './EmptyState.scss';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateAction {
    /** Button label text */
    label: string;
    /** Click handler for the action button */
    onClick: () => void;
}

export interface EmptyStateProps {
    /** Carbon icon component to display in the muted circle */
    icon?: React.ComponentType<{ size: number }>;
    /** Primary heading text (e.g., "No alerts found") */
    title: string;
    /** Secondary description text (e.g., "Try adjusting your filters") */
    description?: string;
    /** Optional action button rendered below the description */
    action?: EmptyStateAction;
    /** Size variant controlling padding and icon scale */
    size?: EmptyStateSize;
    /** Additional CSS class name */
    className?: string;
}

const ICON_SIZES: Record<EmptyStateSize, number> = {
    sm: 24,
    md: 32,
    lg: 48,
};

/**
 * EmptyState - Standardized empty/no-data display
 *
 * Features:
 * - Icon rendered inside a muted circular background
 * - Title and optional description with Carbon typography
 * - Optional tertiary action button
 * - Three size variants (sm, md, lg) for different contexts
 * - Follows IBM Carbon g100 theme tokens
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    size = 'md',
    className = '',
}: EmptyStateProps) {
    const iconSize = ICON_SIZES[size];

    return (
        <div
            className={`empty-state empty-state--${size} ${className}`.trim()}
            role="status"
            aria-label={title}
        >
            {Icon && (
                <div className="empty-state__icon-container">
                    <Icon size={iconSize} />
                </div>
            )}

            <h3 className="empty-state__title">{title}</h3>

            {description && (
                <p className="empty-state__description">{description}</p>
            )}

            {action && (
                <Button
                    kind="tertiary"
                    size={size === 'lg' ? 'md' : 'sm'}
                    onClick={action.onClick}
                    className="empty-state__action"
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

export default EmptyState;
