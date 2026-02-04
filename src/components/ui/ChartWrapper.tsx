/**
 * Copyright IBM Corp. 2026
 *
 * ChartWrapper Component
 * Encapsulates common chart logic, loading states, and empty states
 * Uses Carbon skeleton components for consistent loading appearance
 */

import React, { useMemo } from 'react';
import { SkeletonPlaceholder } from '@carbon/react';
import { ChartColumn } from '@carbon/icons-react';
import '@carbon/charts-react/styles.css';
import './ChartWrapper.scss';

interface ChartWrapperProps {
    /** The Carbon Charts component to render */
    ChartComponent: React.ComponentType<any>;
    /** Chart data array */
    data: any[];
    /** Chart options (Carbon Charts format) */
    options: any;
    /** Additional class name */
    className?: string;
    /** Chart height */
    height?: string;
    /** Loading state - shows Carbon skeleton */
    isLoading?: boolean;
    /** Empty state - shows message over skeleton background */
    isEmpty?: boolean;
    /** Custom empty message */
    emptyMessage?: string;
    /** Chart title (displayed above chart) */
    title?: string;
}

/**
 * ChartWrapper - Consistent chart rendering with loading and empty states
 *
 * Uses Carbon SkeletonPlaceholder for loading states and shows
 * a visual empty state with icon and message when no data is available.
 */
export function ChartWrapper({
    ChartComponent,
    data,
    options,
    className = '',
    height = '320px',
    isLoading = false,
    isEmpty = false,
    emptyMessage = 'No data available',
    title,
}: ChartWrapperProps) {

    // Memoize options to prevent unnecessary re-renders
    const chartOptions = useMemo(() => {
        const newOptions = { ...options };
        if (height) {
            newOptions.height = height;
        }
        return newOptions;
    }, [options, height]);

    // Validate and sanitize chart data, especially dates
    const sanitizedData = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return [];

        return data.filter(item => {
            if (!item) return false;
            // If item has a date field, validate it
            if (item.date !== undefined) {
                try {
                    const dateVal = item.date instanceof Date ? item.date : new Date(item.date);
                    if (isNaN(dateVal.getTime())) {
                        console.warn('[ChartWrapper] Filtering out item with invalid date:', item);
                        return false;
                    }
                } catch (e) {
                    console.warn('[ChartWrapper] Error parsing date:', item.date);
                    return false;
                }
            }
            // Validate value is a number
            if (item.value !== undefined && typeof item.value !== 'number') {
                console.warn('[ChartWrapper] Filtering out item with non-numeric value:', item);
                return false;
            }
            return true;
        }).map(item => {
            // Ensure dates are proper Date objects for time-scale charts
            if (item.date !== undefined) {
                try {
                    const dateVal = item.date instanceof Date ? item.date : new Date(item.date);
                    if (!isNaN(dateVal.getTime())) {
                        return { ...item, date: dateVal };
                    }
                } catch (e) {
                    // Keep original if parsing fails
                }
            }
            return item;
        });
    }, [data]);

    // Loading state with Carbon Charts native skeleton
    if (isLoading) {
        const loadingOptions = {
            ...chartOptions,
            skeleton: true,
            height: height // Ensure height is preserved
        };

        return (
            <div className={`chart-wrapper chart-wrapper--loading ${className}`}>
                {title && <h4 className="chart-wrapper__title">{title}</h4>}
                <ChartComponent data={[]} options={loadingOptions} />
            </div>
        );
    }

    // Empty state - show skeleton background with message overlay
    if (isEmpty || !sanitizedData || sanitizedData.length === 0) {
        return (
            <div className={`chart-wrapper chart-wrapper--empty ${className}`}>
                {title && <h4 className="chart-wrapper__title">{title}</h4>}
                <div className="chart-wrapper__empty-state" style={{ height }}>
                    <SkeletonPlaceholder
                        className="chart-wrapper__empty-skeleton"
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                    />
                    <div className="chart-wrapper__empty-overlay">
                        <ChartColumn size={32} className="chart-wrapper__empty-icon" />
                        <span className="chart-wrapper__empty-message">{emptyMessage}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Normal render with data
    return (
        <div className={`chart-wrapper ${className}`}>
            {title && <h4 className="chart-wrapper__title">{title}</h4>}
            <ChartComponent data={sanitizedData} options={chartOptions} />
        </div>
    );
}

export default ChartWrapper;
