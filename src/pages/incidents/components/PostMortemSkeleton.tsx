/**
 * Post-Mortem Page Loading Skeleton
 *
 * Rendered while post-mortem data is being fetched.
 */

import React from 'react';
import { Tile, SkeletonText, DataTableSkeleton } from '@carbon/react';

import { PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

export const PostMortemSkeleton = React.memo(function PostMortemSkeleton() {
  return (
    <PageLayout className="post-mortems-page">
      <PageHeader
        title="Post-Mortems"
        subtitle="Loading post-mortem reports..."
        showBreadcrumbs
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Incident History', href: ROUTES.INCIDENT_HISTORY },
          { label: 'Post-Mortems', active: true },
        ]}
        showBorder
      />
      <div className="post-mortems-page__content">
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i} className="kpi-card-skeleton">
              <SkeletonText width="60%" />
              <SkeletonText heading width="40%" />
              <SkeletonText width="80%" />
            </Tile>
          ))}
        </div>
        <DataTableSkeleton columnCount={6} rowCount={5} showHeader={false} showToolbar={false} />
      </div>
    </PageLayout>
  );
});
