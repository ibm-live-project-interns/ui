/**
 * Copyright IBM Corp. 2026
 *
 * DeviceDetailsSkeleton - Loading skeleton for the Device Details page.
 * Displays placeholder tiles, KPI cards, and chart while data is loading.
 */

import React from 'react';
import {
    Tile,
    SkeletonText,
    SkeletonPlaceholder,
} from '@carbon/react';

import { PageHeader, KPICard } from '@/components/ui';
import { PageLayout } from '@/components/layout';

export const DeviceDetailsSkeleton: React.FC = React.memo(function DeviceDetailsSkeleton() {
    return (
        <PageLayout>
            <div className="device-details-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Devices', href: '/devices' },
                        { label: 'Loading...', active: true },
                    ]}
                    title="Loading Device..."
                    showBorder
                />
                <div className="device-details-page__content">
                    {/* KPI Skeletons */}
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <KPICard key={i} label="Loading" value="--" loading />
                        ))}
                    </div>

                    {/* Details Grid Skeletons */}
                    <div className="details-grid">
                        <Tile className="info-tile tile--bordered">
                            <SkeletonText heading width="50%" />
                            <div className="info-rows">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="info-row info-row--skeleton">
                                        <SkeletonText width="30%" />
                                        <SkeletonText width="40%" />
                                    </div>
                                ))}
                            </div>
                        </Tile>
                        <Tile className="chart-tile tile--bordered">
                            <SkeletonText heading width="40%" />
                            <SkeletonPlaceholder className="device-details-page__skeleton-chart" />
                        </Tile>
                    </div>

                    <Tile className="incidents-tile tile--bordered">
                        <SkeletonText heading width="20%" className="mb-4" />
                        <SkeletonPlaceholder className="device-details-page__skeleton-table" />
                    </Tile>
                </div>
            </div>
        </PageLayout>
    );
});
