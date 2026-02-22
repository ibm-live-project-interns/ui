/**
 * Copyright IBM Corp. 2026
 *
 * ReportCard - Renders a single report type card with download/navigate actions.
 * Used by the Reports Hub page.
 */

import React from 'react';
import { Tile, Button, InlineLoading } from '@carbon/react';
import { Download, ArrowRight } from '@carbon/icons-react';
import type { ReportType } from './useReportsHub';
import { getLastGenerated, formatTimestamp } from './useReportsHub';

interface ReportCardProps {
    report: ReportType;
    isDownloading: boolean;
    refreshKey: number;
    onAction: (report: ReportType) => void;
}

export const ReportCard = React.memo(function ReportCard({
    report,
    isDownloading,
    refreshKey,
    onAction,
}: ReportCardProps) {
    const Icon = report.icon;
    const lastGen = getLastGenerated(report.id);

    return (
        <Tile key={`${report.id}-${refreshKey}`} className="reports-hub__card">
            <div className="reports-hub__card-header">
                <span
                    className="reports-hub__card-icon"
                    style={{ '--icon-color': report.iconColor } as React.CSSProperties}
                >
                    <Icon size={24} />
                </span>
                <div className="reports-hub__card-title-group">
                    <h4 className="reports-hub__card-title">{report.name}</h4>
                    {lastGen && (
                        <span className="reports-hub__card-timestamp">
                            Last generated: {formatTimestamp(lastGen)}
                        </span>
                    )}
                    {!lastGen && (
                        <span className="reports-hub__card-timestamp reports-hub__card-timestamp--never">
                            Never generated
                        </span>
                    )}
                </div>
            </div>

            <p className="reports-hub__card-description">{report.description}</p>

            <div className="reports-hub__card-footer">
                {report.action === 'download' ? (
                    <Button
                        kind="primary"
                        size="md"
                        renderIcon={isDownloading ? undefined : Download}
                        iconDescription="Download CSV"
                        onClick={() => onAction(report)}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <InlineLoading description="Generating..." />
                        ) : (
                            'Generate CSV'
                        )}
                    </Button>
                ) : (
                    <Button
                        kind="tertiary"
                        size="md"
                        renderIcon={ArrowRight}
                        iconDescription="Navigate to report"
                        onClick={() => onAction(report)}
                    >
                        View Report
                    </Button>
                )}
            </div>
        </Tile>
    );
});

export type { ReportCardProps };
