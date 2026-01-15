import React, { useMemo } from 'react';
import '@carbon/charts-react/styles.css';

interface ChartWrapperProps {
    ChartComponent: React.ComponentType<any>;
    data: any[];
    options: any;
    className?: string;
    height?: string; // Added height prop
    // Optional rendering checks
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
}

/**
 * ChartWrapper
 * Encapsulates common chart logic, styling, and ensures consistent rendering.
 * By default, this component assumes the chart title is handled externally (in the parent layout),
 * so it's a good place to enforce `options.title = null` if we want to be strict,
 * but for now it just renders the Carbon chart component with the provided data/options.
 */
export function ChartWrapper({
    ChartComponent,
    data,
    options,
    className = '',
    height = '320px', // Default height
    isLoading = false,
    isEmpty = false,
    emptyMessage = 'No data available',
}: ChartWrapperProps) {

    // Memoize options to prevent unnecessary re-renders and merge height/theme defaults
    const chartOptions = useMemo(() => {
        const newOptions = { ...options };
        if (height) {
            newOptions.height = height;
        }
        return newOptions;
    }, [options, height]);

    if (isLoading) {
        return <div className={`chart-wrapper chart-wrapper--loading ${className}`}>Loading...</div>;
    }

    if (isEmpty || !data || data.length === 0) {
        return (
            <div className={`chart-wrapper chart-wrapper--empty ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={`chart-wrapper ${className}`}>
            <ChartComponent data={data} options={chartOptions} />
        </div>
    );
}

export default ChartWrapper;
