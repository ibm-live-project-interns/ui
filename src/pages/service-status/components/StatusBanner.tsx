/**
 * Overall Status Banner
 *
 * Displays the overall system health status with an icon, title, subtitle,
 * last-refresh timestamp, and a healthy-count tag.
 */

import React from 'react';
import { Tag } from '@carbon/react';

import { RelativeTime } from '@/components';
import { getOverallStatusConfig } from './serviceStatus.types';

interface StatusBannerProps {
  /** Overall status string from the API */
  overallStatus: string;
  /** Total count of services */
  totalServices: number;
  /** Count of operational services */
  operationalCount: number;
  /** Timestamp of last successful refresh */
  lastRefresh: Date | null;
}

export const StatusBanner = React.memo(function StatusBanner({
  overallStatus,
  totalServices,
  operationalCount,
  lastRefresh,
}: StatusBannerProps) {
  const config = getOverallStatusConfig(overallStatus);
  const StatusIcon = config.icon;

  return (
    <div
      className={`service-status-page__banner service-status-page__banner--${overallStatus}`}
      role="status"
      aria-live="polite"
    >
      <StatusIcon size={32} className={`banner-icon banner-icon--${overallStatus}`} />
      <div className="banner-content">
        <h2 className="banner-title">{config.title}</h2>
        <p className="banner-subtitle">{config.subtitle}</p>
      </div>
      <div className="banner-actions">
        {lastRefresh && (
          <span className="last-refresh">
            <span className="live-pulse" />
            Updated <RelativeTime timestamp={lastRefresh} refreshInterval={5000} />
          </span>
        )}
        <Tag
          type={overallStatus === 'operational' ? 'green' : overallStatus === 'degraded' ? 'warm-gray' : 'red'}
          size="sm"
        >
          {operationalCount}/{totalServices} Healthy
        </Tag>
      </div>
    </div>
  );
});
