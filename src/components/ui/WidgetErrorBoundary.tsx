/**
 * WidgetErrorBoundary
 *
 * Lightweight React error boundary that catches render errors in child
 * components and displays a fallback message instead of crashing the
 * entire parent tree.  Designed for dashboard widget slots where one
 * failing widget should not take down the whole tab panel.
 */

import React from 'react';
import { logger } from '@/shared/utils/logger';

interface WidgetErrorBoundaryProps {
    /** Label shown in the fallback when the widget crashes */
    widgetName?: string;
    children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class WidgetErrorBoundary extends React.Component<
    WidgetErrorBoundaryProps,
    WidgetErrorBoundaryState
> {
    constructor(props: WidgetErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        logger.error(`Widget "${this.props.widgetName || 'Unknown'}" crashed`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="widget-error-boundary">
                    <span className="widget-error-boundary__title">
                        {this.props.widgetName || 'Widget'} unavailable
                    </span>
                    <span className="widget-error-boundary__message">
                        This component encountered an error and could not render.
                    </span>
                </div>
            );
        }

        return this.props.children;
    }
}

export default WidgetErrorBoundary;
