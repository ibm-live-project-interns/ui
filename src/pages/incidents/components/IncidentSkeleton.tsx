/**
 * Copyright IBM Corp. 2026
 *
 * IncidentSkeleton - Loading skeleton for the Incident History page.
 * Displays placeholder tiles, charts, and tables while data is loading.
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
import { ROUTES } from '@/shared/constants/routes';

export const IncidentSkeleton = React.memo(function IncidentSkeleton() {
  return (
    <PageLayout>
      <div className="incident-history-page">
        <PageHeader
          title="Incident History & Resolution"
          subtitle="Loading historical incident data..."
          showBreadcrumbs
          breadcrumbs={[
            { label: 'Home', href: ROUTES.DASHBOARD },
            { label: 'Trends', href: ROUTES.TRENDS },
            { label: 'Incident History', active: true },
          ]}
          showBorder
        />

        <div className="incident-history-page__content">
          <div className="kpi-row">
            {[1, 2, 3, 4].map((i) => (
              <Tile key={i} className="kpi-card-skeleton">
                <SkeletonText width="60%" />
                <SkeletonText heading width="40%" />
                <SkeletonText width="80%" />
              </Tile>
            ))}
          </div>

          <div className="incident-history-page__split-layout">
            <div className="incident-history-page__left-column">
              <Tile>
                <SkeletonPlaceholder className="u-skeleton-placeholder u-skeleton-placeholder--280" />
              </Tile>
              <DataTableSkeleton columnCount={6} rowCount={5} showHeader={false} showToolbar={false} />
            </div>
            <div className="incident-history-page__right-column">
              <Tile>
                <SkeletonPlaceholder className="u-skeleton-placeholder u-skeleton-placeholder--260" />
              </Tile>
              <Tile>
                <SkeletonText width="80%" />
                <SkeletonText width="60%" />
                <SkeletonText width="70%" />
              </Tile>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
});
