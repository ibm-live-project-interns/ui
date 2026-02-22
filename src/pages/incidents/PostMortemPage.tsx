/**
 * Copyright IBM Corp. 2026
 *
 * Post-Mortem List Page
 *
 * Displays all post-mortem reports with search, filters, expandable row detail,
 * and status/category tags. Uses real API data from GET /post-mortems.
 *
 * Route: /incidents/post-mortems
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Renew,
  DocumentTasks,
  Catalog,
  CheckmarkFilled,
  Edit,
} from '@carbon/icons-react';

// Shared components
import { KPICard, PageHeader, FilterBar } from '@/components/ui';
import { PageLayout } from '@/components/layout';
import type { KPICardProps } from '@/components/ui/KPICard';
import type { FilterOption } from '@/components/ui/FilterBar';

// Hooks
import { useFetchData, usePaginatedSearch } from '@/shared/hooks';

// Services and config
import { postMortemService } from '@/shared/services';
import type { PostMortem } from '@/shared/services';
import { ROUTES } from '@/shared/constants/routes';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';

// Child components
import { PostMortemSkeleton } from './components/PostMortemSkeleton';
import { PostMortemTable } from './components/PostMortemTable';
import { STATUS_OPTIONS, CATEGORY_OPTIONS } from './components/postmortem.types';

// Styles
import '@/styles/pages/_post-mortems.scss';

// ==========================================
// Component
// ==========================================

export function PostMortemPage() {
  const { addToast } = useToast();

  // ----- Data Fetching -----
  const {
    data: apiData,
    isLoading,
    refetch,
  } = useFetchData(
    async () => {
      return await postMortemService.list({ limit: 200 });
    },
    [],
    {
      onError: (err) => {
        logger.error('Failed to fetch post-mortems', err);
        addToast('error', 'Failed to load post-mortems');
      },
    }
  );

  const allPostMortems = apiData?.post_mortems ?? [];

  // ----- Dropdown Filter State -----
  const [statusFilter, setStatusFilter] = useState<FilterOption>(STATUS_OPTIONS[0]);
  const [categoryFilter, setCategoryFilter] = useState<FilterOption>(CATEGORY_OPTIONS[0]);

  // Apply dropdown filters before pagination
  const dropdownFiltered = useMemo(() => {
    let result = allPostMortems;
    if (statusFilter.id !== 'all') {
      result = result.filter((pm) => pm.status === statusFilter.id);
    }
    if (categoryFilter.id !== 'all') {
      result = result.filter((pm) => pm.root_cause_category === categoryFilter.id);
    }
    return result;
  }, [allPostMortems, statusFilter, categoryFilter]);

  // ----- Client-side search + pagination on the dropdown-filtered set -----
  const {
    searchQuery,
    setSearchQuery,
    paginated,
    totalFiltered,
    page,
    pageSize,
    onPageChange,
  } = usePaginatedSearch<PostMortem>(dropdownFiltered, ['title', 'root_cause', 'root_cause_category', 'created_by'], 10);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(STATUS_OPTIONS[0]);
    setCategoryFilter(CATEGORY_OPTIONS[0]);
  }, [setSearchQuery]);

  // ----- KPIs -----
  const kpiData = useMemo((): KPICardProps[] => {
    const total = allPostMortems.length;
    const drafts = allPostMortems.filter((pm) => pm.status === 'draft').length;
    const inReview = allPostMortems.filter((pm) => pm.status === 'in-review').length;
    const published = allPostMortems.filter((pm) => pm.status === 'published').length;

    return [
      {
        id: 'total',
        label: 'Total Post-Mortems',
        value: total,
        icon: DocumentTasks,
        iconColor: 'var(--cds-interactive, #0f62fe)',
        severity: 'info' as const,
        subtitle: 'All post-mortem reports',
      },
      {
        id: 'draft',
        label: 'Draft',
        value: drafts,
        icon: Edit,
        iconColor: 'var(--cds-text-helper, #8d8d8d)',
        severity: drafts > 0 ? ('major' as const) : ('success' as const),
        subtitle: 'Awaiting completion',
      },
      {
        id: 'in-review',
        label: 'In Review',
        value: inReview,
        icon: Catalog,
        iconColor: 'var(--cds-interactive, #0043ce)',
        severity: 'info' as const,
        subtitle: 'Under team review',
      },
      {
        id: 'published',
        label: 'Published',
        value: published,
        icon: CheckmarkFilled,
        iconColor: 'var(--cds-support-success, #198038)',
        severity: 'success' as const,
        subtitle: 'Finalized and shared',
      },
    ];
  }, [allPostMortems]);

  // ----- Loading State -----
  if (isLoading && allPostMortems.length === 0) {
    return <PostMortemSkeleton />;
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <PageLayout className="post-mortems-page">
      {/* Page Header */}
      <PageHeader
        title="Post-Mortems"
        subtitle="Review incident post-mortem reports, root cause analyses, and action items."
        showBreadcrumbs
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Incident History', href: ROUTES.INCIDENT_HISTORY },
          { label: 'Post-Mortems', active: true },
        ]}
        showBorder
        actions={[
          {
            label: 'Refresh',
            onClick: refetch,
            variant: 'secondary',
            icon: Renew,
          },
        ]}
      />

      <div className="post-mortems-page__content">
        {/* KPI Row */}
        <div className="kpi-row">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchEnabled
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search post-mortems..."
          dropdowns={[
            {
              id: 'status-filter',
              label: 'Status',
              options: STATUS_OPTIONS,
              selectedItem: statusFilter,
              onChange: (item: FilterOption) => setStatusFilter(item),
            },
            {
              id: 'category-filter',
              label: 'Category',
              options: CATEGORY_OPTIONS,
              selectedItem: categoryFilter,
              onChange: (item: FilterOption) => setCategoryFilter(item),
            },
          ]}
          totalCount={allPostMortems.length}
          filteredCount={totalFiltered}
          itemLabel="post-mortems"
          onClearAll={handleClearAll}
        />

        {/* DataTable with expandable rows */}
        <PostMortemTable
          paginated={paginated}
          totalFiltered={totalFiltered}
          page={page}
          pageSize={pageSize}
          searchQuery={searchQuery}
          onPageChange={onPageChange}
        />
      </div>
    </PageLayout>
  );
}

export default PostMortemPage;
