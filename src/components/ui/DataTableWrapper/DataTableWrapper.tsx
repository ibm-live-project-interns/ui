import React from 'react';
import { Search, Button } from '@carbon/react';
import { Filter, Renew } from '@carbon/icons-react';
import './DataTableWrapper.scss';

export interface DataTableWrapperAction {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
}

export interface DataTableWrapperProps {
    title: string;
    children: React.ReactNode;
    onSearch?: (value: string) => void;
    searchPlaceholder?: string;
    searchValue?: string;
    actions?: DataTableWrapperAction[];
    showFilter?: boolean;
    onFilter?: () => void;
    showRefresh?: boolean;
    onRefresh?: () => void;
    className?: string;
}

/**
 * DataTableWrapper - A reusable wrapper component for Carbon DataTable
 * Provides consistent styling and layout for tables across the application.
 * 
 * Features:
 * - Title + actions on same line
 * - Search bar
 * - Optional filter/refresh buttons
 * - Consistent dark theme styling
 */
export const DataTableWrapper = React.memo(function DataTableWrapper({
    title,
    children,
    onSearch,
    searchPlaceholder = 'Search...',
    searchValue,
    actions = [],
    showFilter = true,
    onFilter,
    showRefresh = true,
    onRefresh,
    className = '',
}: DataTableWrapperProps) {
    return (
        <div className={`data-table-wrapper ${className}`}>
            <div className="data-table-wrapper__header">
                <h3 className="data-table-wrapper__title">{title}</h3>
                <div className="data-table-wrapper__actions">
                    {onSearch && (
                        <Search
                            placeholder={searchPlaceholder}
                            labelText="Search"
                            closeButtonLabelText="Clear search"
                            onChange={(e) => onSearch(e.target.value)}
                            value={searchValue}
                            size="sm"
                            className="data-table-wrapper__search"
                        />
                    )}
                    {showFilter && (
                        <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            renderIcon={Filter}
                            iconDescription="Filter"
                            onClick={onFilter}
                            className="data-table-wrapper__icon-btn"
                        />
                    )}
                    {showRefresh && (
                        <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            renderIcon={Renew}
                            iconDescription="Refresh"
                            onClick={onRefresh}
                            className="data-table-wrapper__icon-btn"
                        />
                    )}
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            renderIcon={action.icon}
                            iconDescription={action.label}
                            onClick={action.onClick}
                            className="data-table-wrapper__icon-btn"
                        />
                    ))}
                </div>
            </div>
            <div className="data-table-wrapper__content" aria-live="polite">
                {children}
            </div>
        </div>
    );
});

export default DataTableWrapper;

