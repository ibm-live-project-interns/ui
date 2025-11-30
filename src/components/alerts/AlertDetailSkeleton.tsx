/**
 * AlertDetailSkeleton Component
 * Full page skeleton for AlertDetailPage loading state
 * Matches the new responsive layout
 */

import { Grid, Column, Tile, SkeletonText, SkeletonPlaceholder } from '@carbon/react';

export function AlertDetailSkeleton() {
  return (
    <div className="alert-detail-page">
      {/* Top Bar Skeleton */}
      <header className="alert-detail-page__topbar">
        <div className="skeleton-icon" style={{ width: 32, height: 32 }} />

        <div className="alert-detail-page__topbar-info">
          <SkeletonText width="160px" heading />
          <div className="alert-detail-page__tags">
            <div className="skeleton-tag" />
            <div className="skeleton-tag" />
          </div>
        </div>

        <div className="alert-detail-page__topbar-actions">
          <div className="skeleton-button" />
          <div className="skeleton-button skeleton-button--primary" />
        </div>
      </header>

      {/* Meta Bar Skeleton */}
      <div className="alert-detail-page__meta-bar">
        <SkeletonText width="80px" />
        <SkeletonText width="90px" />
        <SkeletonText width="60px" />
        <SkeletonText width="100px" />
      </div>

      {/* Content Grid Skeleton */}
      <Grid className="alert-detail-page__content" narrow>
        {/* Main Column */}
        <Column lg={10} md={8} sm={4}>
          {/* Explanation Panel Skeleton */}
          <Tile className="explanation-panel">
            <div className="explanation-panel__header">
              <div className="skeleton-icon" />
              <SkeletonText width="140px" heading />
              <div className="skeleton-badge" />
            </div>
            <div className="explanation-panel__content">
              <SkeletonText paragraph lineCount={4} />
            </div>
          </Tile>

          {/* Knowledge Insights Skeleton */}
          <Tile className="knowledge-insights">
            <div className="knowledge-insights__header">
              <div className="skeleton-icon" />
              <SkeletonText width="160px" heading />
              <div className="skeleton-badge" />
            </div>
            <SkeletonText width="280px" />
            <div style={{ marginTop: '1rem' }}>
              <SkeletonPlaceholder style={{ height: '72px', marginBottom: '0.5rem' }} />
            </div>
          </Tile>
        </Column>

        {/* Sidebar Column */}
        <Column lg={6} md={8} sm={4}>
          {/* Recommended Actions Skeleton */}
          <Tile className="recommended-actions">
            <div className="recommended-actions__title">
              <div className="skeleton-icon" />
              <SkeletonText width="180px" heading />
            </div>
            <div className="recommended-actions__skeleton">
              <SkeletonPlaceholder style={{ height: '52px', marginBottom: '0.5rem' }} />
              <SkeletonPlaceholder style={{ height: '52px', marginBottom: '0.5rem' }} />
              <SkeletonPlaceholder style={{ height: '52px' }} />
            </div>
          </Tile>

          {/* Source Info Skeleton */}
          <div className="alert-source-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <Tile className="alert-source-info__device">
              <div className="alert-source-info__title">
                <div className="skeleton-icon" />
                <SkeletonText width="140px" heading />
              </div>
              <SkeletonText paragraph lineCount={4} />
            </Tile>
            <Tile className="alert-source-info__log" style={{ marginTop: '1rem' }}>
              <div className="alert-source-info__title">
                <div className="skeleton-icon" />
                <SkeletonText width="100px" heading />
              </div>
              <SkeletonText width="80px" />
              <SkeletonPlaceholder style={{ height: '60px', marginTop: '1rem' }} />
            </Tile>
          </div>
        </Column>
      </Grid>
    </div>
  );
}
