/**
 * Copyright IBM Corp. 2026
 *
 * SLAReportsSkeleton - Loading skeleton displayed while SLA data is being fetched.
 */

import React from 'react';
import {
    Tile,
    SkeletonText,
    SkeletonPlaceholder,
    DataTableSkeleton,
} from '@carbon/react';

import { PageHeader } from '@/components';
import { PageLayout } from '@/components/layout';

export const SLAReportsSkeleton = React.memo(function SLAReportsSkeleton() {
    return (
        <PageLayout>
            <div className="sla-reports-page">
                <PageHeader
                    title="SLA Compliance Reports"
                    subtitle="Loading SLA data..."
                    showBreadcrumbs={false}
                    showBorder
                />
                <div className="kpi-row">
                    {[1, 2, 3, 4].map((i) => (
                        <Tile key={i}>
                            <SkeletonText width="60%" />
                            <SkeletonText heading width="40%" />
                            <SkeletonText width="80%" />
                        </Tile>
                    ))}
                </div>
                <Tile className="sla-reports-page__skeleton-tile">
                    <SkeletonPlaceholder className="sla-reports-page__skeleton-chart-placeholder" />
                </Tile>
                <DataTableSkeleton
                    columnCount={5}
                    rowCount={5}
                    showHeader
                    showToolbar={false}
                    className="sla-reports-page__skeleton-table"
                />
            </div>
        </PageLayout>
    );
});
