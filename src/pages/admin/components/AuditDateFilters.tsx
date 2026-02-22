/**
 * AuditDateFilters - Date range picker row for the Audit Log page.
 * Provides start/end date pickers and a "Clear all" button.
 */

import React from 'react';
import {
    DatePicker,
    DatePickerInput,
    Button,
} from '@carbon/react';
import { Close } from '@carbon/icons-react';

interface AuditDateFiltersProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (dates: Date[]) => void;
    onEndDateChange: (dates: Date[]) => void;
    hasActiveFilters: boolean;
    onClearAll: () => void;
}

export const AuditDateFilters = React.memo(function AuditDateFilters({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    hasActiveFilters,
    onClearAll,
}: AuditDateFiltersProps) {
    return (
        <div className="audit-log-page__date-filters">
            <DatePicker
                datePickerType="single"
                onChange={onStartDateChange}
                value={startDate}
            >
                <DatePickerInput
                    id="start-date"
                    placeholder="mm/dd/yyyy"
                    labelText="From"
                    size="lg"
                />
            </DatePicker>

            <DatePicker
                datePickerType="single"
                onChange={onEndDateChange}
                value={endDate}
            >
                <DatePickerInput
                    id="end-date"
                    placeholder="mm/dd/yyyy"
                    labelText="To"
                    size="lg"
                />
            </DatePicker>

            {hasActiveFilters && (
                <Button
                    kind="ghost"
                    size="lg"
                    renderIcon={Close}
                    onClick={onClearAll}
                    className="audit-log-page__clear-filters"
                >
                    Clear all
                </Button>
            )}
        </div>
    );
});

export default AuditDateFilters;
