/**
 * AlertCardSkeleton Component
 * Custom skeleton loading state that matches AlertCard layout
 * Uses Carbon's SkeletonText component for consistent loading states
 */

import { Tile, SkeletonText } from '@carbon/react';

interface AlertCardSkeletonProps {
  compact?: boolean;
}

/**
 * @description Loading skeleton for AlertCard component
 * Provides visual placeholder while alert data is being fetched
 */
export function AlertCardSkeleton({ compact = false }: AlertCardSkeletonProps) {
  if (compact) {
    return (
      <Tile className="alert-card alert-card--compact alert-card--skeleton">
        <div className="alert-card__header">
          <div className="skeleton-icon" />
          <SkeletonText width="120px" />
          <div className="skeleton-tag" />
        </div>
        <SkeletonText paragraph lineCount={2} />
        <SkeletonText width="80px" />
      </Tile>
    );
  }

  return (
    <Tile className="alert-card alert-card--skeleton">
      <div className="alert-card__header">
        <div className="alert-card__title-row">
          <div className="skeleton-icon" />
          <SkeletonText width="150px" />
        </div>
        <div className="alert-card__tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>

      <div className="alert-card__explanation">
        <SkeletonText paragraph lineCount={3} />
      </div>

      <div className="alert-card__footer">
        <div className="alert-card__meta">
          <SkeletonText width="80px" />
          <SkeletonText width="100px" />
        </div>
        <SkeletonText width="60px" />
      </div>
    </Tile>
  );
}
