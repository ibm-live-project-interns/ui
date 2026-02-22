/**
 * RunbooksLoadingSkeleton - Skeleton loading state for the Runbooks page.
 * Renders placeholder KPI cards and card grid while data is being fetched.
 */

import React from 'react';
import { Tile, SkeletonText } from '@carbon/react';

import { PageHeader } from '@/components';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

export const RunbooksLoadingSkeleton = React.memo(function RunbooksLoadingSkeleton() {
    return (
        <PageLayout>
            <div className="runbooks-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: ROUTES.DASHBOARD },
                        { label: 'Runbooks', active: true },
                    ]}
                    title="Runbooks & Knowledge Base"
                    subtitle="Loading runbook data..."
                    showBorder
                />

                <div className="runbooks-page__content">
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                                <SkeletonText width="80%" />
                            </Tile>
                        ))}
                    </div>

                    <div className="runbooks-page__grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Tile key={i} className="runbooks-page__card-skeleton">
                                <SkeletonText width="70%" />
                                <SkeletonText width="40%" />
                                <SkeletonText width="90%" />
                                <SkeletonText width="60%" />
                            </Tile>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
});
