/**
 * Copyright IBM Corp. 2026
 *
 * FilterBar Component
 * Reusable filter toolbar with search, dropdowns, quick-filter tags, and results summary.
 * Encapsulates the common filter pattern used across pages (alerts, tickets, devices, etc.).
 */

import React, { useMemo } from 'react';
import { Search, Dropdown, Tag, Button } from '@carbon/react';
import { Close } from '@carbon/icons-react';
import './FilterBar.scss';

export interface FilterOption {
    id: string;
    text: string;
}

export interface DropdownFilterConfig {
    id: string;
    label: string;
    options: FilterOption[];
    selectedItem: FilterOption;
    onChange: (item: FilterOption) => void;
}

export interface FilterBarProps {
    /** Whether the search input is shown */
    searchEnabled?: boolean;
    /** Placeholder text for the search input */
    searchPlaceholder?: string;
    /** Current search value (controlled) */
    searchValue?: string;
    /** Callback when search value changes */
    onSearchChange?: (value: string) => void;

    /** Array of dropdown filter configurations */
    dropdowns?: DropdownFilterConfig[];

    /** Labels for quick-filter tags */
    quickFilters?: string[];
    /** Currently active quick-filter labels */
    activeQuickFilters?: string[];
    /** Callback when a quick-filter tag is toggled */
    onQuickFilterToggle?: (filter: string) => void;

    /** Callback to reset all filters */
    onClearAll?: () => void;

    /** Total item count before filtering */
    totalCount?: number;
    /** Item count after filtering */
    filteredCount?: number;
    /** Noun for the results summary (e.g. "alerts", "tickets") */
    itemLabel?: string;

    /** Additional CSS class name */
    className?: string;
}

/**
 * FilterBar - Shared filter toolbar following IBM Carbon patterns
 *
 * Features:
 * - Optional search input (Carbon Search, size lg)
 * - Configurable dropdown filters (Carbon Dropdown, size lg)
 * - Clickable quick-filter tags with active state
 * - Clear-all button with active filter count badge
 * - Results summary line
 */
export const FilterBar = React.memo(function FilterBar({
    searchEnabled = false,
    searchPlaceholder = 'Search...',
    searchValue = '',
    onSearchChange,
    dropdowns = [],
    quickFilters = [],
    activeQuickFilters = [],
    onQuickFilterToggle,
    onClearAll,
    totalCount,
    filteredCount,
    itemLabel = 'results',
    className = '',
}: FilterBarProps) {
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchEnabled && searchValue.trim().length > 0) count += 1;
        for (const dd of dropdowns) {
            if (dd.options.length > 0 && dd.selectedItem.id !== dd.options[0].id) count += 1;
        }
        count += activeQuickFilters.length;
        return count;
    }, [searchEnabled, searchValue, dropdowns, activeQuickFilters]);

    const hasActiveFilters = activeFilterCount > 0;
    const showResultsSummary =
        totalCount !== undefined && filteredCount !== undefined && hasActiveFilters;

    return (
        <div className={`filter-bar ${className}`.trim()} role="search" aria-label={`Filter ${itemLabel}`}>
            {/* Primary row: search + dropdowns + clear */}
            <div className="filter-bar__primary">
                {searchEnabled && (
                    <Search
                        className="filter-bar__search"
                        size="lg"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onSearchChange?.(e.target.value)
                        }
                        onClear={() => onSearchChange?.('')}
                        labelText="Filter search"
                    />
                )}

                {dropdowns.length > 0 && (
                    <div className="filter-bar__dropdowns">
                        {dropdowns.map((dd) => (
                            <Dropdown
                                key={dd.id}
                                id={dd.id}
                                titleText={dd.label}
                                hideLabel
                                label={dd.label}
                                size="lg"
                                items={dd.options}
                                itemToString={(item: FilterOption | null) => item?.text ?? ''}
                                selectedItem={dd.selectedItem}
                                onChange={({ selectedItem }: { selectedItem: FilterOption | null }) =>
                                    dd.onChange(selectedItem ?? dd.options[0])
                                }
                            />
                        ))}
                    </div>
                )}

                {hasActiveFilters && onClearAll && (
                    <Button
                        className="filter-bar__clear"
                        kind="ghost"
                        size="lg"
                        renderIcon={Close}
                        onClick={onClearAll}
                    >
                        Clear ({activeFilterCount})
                    </Button>
                )}
            </div>

            {/* Quick-filter tags row */}
            {quickFilters.length > 0 && (
                <div className="filter-bar__quick-filters" role="group" aria-label="Quick filters">
                    <span className="filter-bar__quick-filters-label">Quick filters:</span>
                    {quickFilters.map((label) => {
                        const isActive = activeQuickFilters.includes(label);
                        return (
                            <Tag
                                key={label}
                                type={isActive ? 'blue' : 'gray'}
                                size="md"
                                onClick={() => onQuickFilterToggle?.(label)}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onQuickFilterToggle?.(label);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={isActive}
                                className="filter-bar__tag"
                            >
                                {label}
                            </Tag>
                        );
                    })}
                </div>
            )}

            {/* Results summary */}
            {showResultsSummary && (
                <p className="filter-bar__results-summary" aria-live="polite" aria-atomic="true">
                    Showing {filteredCount} of {totalCount} {itemLabel}
                </p>
            )}
        </div>
    );
});

export default FilterBar;
