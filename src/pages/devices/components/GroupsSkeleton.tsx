/**
 * Copyright IBM Corp. 2026
 *
 * GroupsSkeleton - Loading skeleton for the Device Groups page.
 * Shows placeholder KPI cards and group card skeletons while data is loading.
 */

import React from 'react';
import { Tile, SkeletonText } from '@carbon/react';

import { PageHeader } from '@/components';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

// ==========================================
// Component
// ==========================================

export const GroupsSkeleton = React.memo(function GroupsSkeleton() {
    return (
        <PageLayout>
            <div className="device-groups-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: ROUTES.DASHBOARD },
                        { label: 'Device Groups', active: true },
                    ]}
                    title="Device Groups"
                    subtitle="Loading group data..."
                    showBorder
                />

                <div className="device-groups-page__content">
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                                <SkeletonText width="80%" />
                            </Tile>
                        ))}
                    </div>

                    <div className="device-groups-page__grid">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Tile key={i} className="device-groups-page__card-skeleton">
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
