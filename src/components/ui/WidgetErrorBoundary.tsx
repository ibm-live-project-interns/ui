/**
 * WidgetErrorBoundary
 *
 * Lightweight React error boundary that catches render errors in child
 * components and displays a fallback message instead of crashing the
 * entire parent tree.  Designed for dashboard widget slots where one
 * failing widget should not take down the whole tab panel.
 */

import React from 'react';

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
        console.error(
            `[WidgetErrorBoundary] ${this.props.widgetName || 'Widget'} crashed:`,
            error,
            errorInfo,
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '1.5rem',
                        background: 'var(--cds-layer-01, #161616)',
                        borderRadius: '4px',
                        border: '1px solid var(--cds-border-subtle-01, #393939)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textAlign: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--cds-text-primary, #f4f4f4)',
                        }}
                    >
                        {this.props.widgetName || 'Widget'} unavailable
                    </span>
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--cds-text-secondary, #c6c6c6)',
                        }}
                    >
                        This component encountered an error and could not render.
                    </span>
                </div>
            );
        }

        return this.props.children;
    }
}

export default WidgetErrorBoundary;
