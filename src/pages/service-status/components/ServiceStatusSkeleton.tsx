/**
 * Service Status Page Loading Skeleton
 *
 * Rendered while initial service status data is being fetched.
 */

import React from 'react';
import { SkeletonPlaceholder } from '@carbon/react';

import { PageHeader } from '@/components';
import { KPICard } from '@/components/ui/KPICard';
import { PageLayout } from '@/components/layout';
import { ROUTES } from '@/shared/constants/routes';

export const ServiceStatusSkeleton = React.memo(function ServiceStatusSkeleton() {
  return (
    <PageLayout>
      <div className="service-status-page">
        <PageHeader
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.DASHBOARD },
            { label: 'Service Status', active: true },
          ]}
          title="Service Status"
          subtitle="Real-time health monitoring for all platform services."
          showBorder
        />

        <div className="u-section-padding">
          <SkeletonPlaceholder className="service-status-page__skeleton-banner" />

          <div className="kpi-row">
            {[1, 2, 3, 4].map((i) => (
              <KPICard key={i} label="" value="" loading />
            ))}
          </div>

          <div className="service-status-page__skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SkeletonPlaceholder key={i} className="skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
});
