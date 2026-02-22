/**
 * Copyright IBM Corp. 2026
 *
 * WidgetSkeleton - Loading placeholder for dashboard widgets.
 * Shows Carbon skeleton components that match the typical widget layout.
 */

import { memo } from 'react';
import { Tile, SkeletonText, SkeletonPlaceholder } from '@carbon/react';

interface WidgetSkeletonProps {
  /** Height variant for different widget sizes */
  variant?: 'kpi' | 'chart' | 'table' | 'compact';
  className?: string;
}

export const WidgetSkeleton = memo(function WidgetSkeleton({ variant = 'chart', className }: WidgetSkeletonProps) {
  if (variant === 'kpi') {
    return (
      <div className={`widget widget--skeleton ${className || ''}`}>
        <div className="widget-skeleton__kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <Tile key={i} className="widget-skeleton__kpi-tile">
              <SkeletonText width="60%" />
              <SkeletonText heading width="40%" />
              <SkeletonText width="80%" />
            </Tile>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Tile className={`widget widget--skeleton ${className || ''} widget-skeleton__tile`}>
        <SkeletonText heading width="50%" />
        <SkeletonText width="80%" className="widget-skeleton__skeleton-gap" />
        <SkeletonText width="60%" />
      </Tile>
    );
  }

  if (variant === 'table') {
    return (
      <Tile className={`widget widget--skeleton ${className || ''} widget-skeleton__tile`}>
        <SkeletonText heading width="30%" />
        <SkeletonPlaceholder className="widget-skeleton__placeholder widget-skeleton__placeholder--table" />
      </Tile>
    );
  }

  // Default: chart skeleton
  return (
    <Tile className={`widget widget--skeleton ${className || ''} widget-skeleton__tile`}>
      <SkeletonText heading width="40%" />
      <SkeletonPlaceholder className="widget-skeleton__placeholder widget-skeleton__placeholder--chart" />
    </Tile>
  );
});
