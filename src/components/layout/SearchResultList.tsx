/**
 * SearchResultList Component
 *
 * Renders grouped search results for the GlobalSearch modal.
 * Extracted from GlobalSearch to reduce component size.
 *
 * Features:
 * - Results grouped by category (Pages, Alerts, Tickets, Devices)
 * - Category headers with icons and counts
 * - Severity tags on alert results
 * - Keyboard navigation highlighting (selectedIndex)
 * - Accessible: role="option", aria-selected
 */

import React from 'react';
import { Tag } from '@carbon/react';
import {
    ArrowRight,
    Warning,
    Ticket,
    Devices as DevicesIcon,
    Application,
} from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

export interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: 'alert' | 'ticket' | 'device' | 'page';
    url: string;
    severity?: string;
    status?: string;
}

interface SearchResultListProps {
    results: SearchResult[];
    selectedIndex: number;
    onResultClick: (url: string) => void;
}

// ==========================================
// Category Config
// ==========================================

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    page: { label: 'Pages', icon: <Application size={16} /> },
    alert: { label: 'Alerts', icon: <Warning size={16} /> },
    ticket: { label: 'Tickets', icon: <Ticket size={16} /> },
    device: { label: 'Devices', icon: <DevicesIcon size={16} /> },
};

/** Ordered category keys for consistent display order */
const CATEGORY_ORDER = ['page', 'alert', 'ticket', 'device'];

// ==========================================
// Helpers
// ==========================================

/** Map severity to Carbon Tag type */
function severityToTagType(severity?: string): 'red' | 'magenta' | 'orange' | 'blue' | 'gray' | 'teal' {
    switch (severity?.toLowerCase()) {
        case 'critical': return 'red';
        case 'high':
        case 'major': return 'magenta';
        case 'medium':
        case 'warning': return 'orange';
        case 'low':
        case 'info': return 'blue';
        default: return 'gray';
    }
}

// ==========================================
// Component
// ==========================================

const SearchResultList = React.memo(function SearchResultList({
    results,
    selectedIndex,
    onResultClick,
}: SearchResultListProps) {
    // Group results by category
    const groupedResults = results.reduce<Record<string, SearchResult[]>>((groups, result) => {
        if (!groups[result.category]) {
            groups[result.category] = [];
        }
        groups[result.category].push(result);
        return groups;
    }, {});

    // Filter to only categories that have results, in display order
    const orderedCategories = CATEGORY_ORDER.filter(cat => groupedResults[cat]?.length > 0);

    // Track flat index across all categories for keyboard navigation
    let flatIndex = -1;

    return (
        <>
            {orderedCategories.map(category => {
                const categoryResults = groupedResults[category];
                const config = CATEGORY_CONFIG[category];

                return (
                    <div key={category} className="global-search-category">
                        <div className="global-search-category-header">
                            {config.icon}
                            <span>{config.label}</span>
                            <span className="global-search-category-count">{categoryResults.length}</span>
                        </div>
                        {categoryResults.map((result) => {
                            flatIndex++;
                            const currentIndex = flatIndex;
                            const isSelected = currentIndex === selectedIndex;

                            return (
                                <button
                                    key={result.id}
                                    className={`global-search-result-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => onResultClick(result.url)}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-label={`Navigate to ${result.title}`}
                                >
                                    <div className="global-search-result-content">
                                        <span className="global-search-result-title">{result.title}</span>
                                        <span className="global-search-result-subtitle">{result.subtitle}</span>
                                    </div>
                                    <div className="global-search-result-meta">
                                        {result.severity && (
                                            <Tag type={severityToTagType(result.severity)} size="sm">
                                                {result.severity}
                                            </Tag>
                                        )}
                                        <ArrowRight size={16} className="global-search-result-arrow" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
});

export { SearchResultList };
export default SearchResultList;
