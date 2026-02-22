/**
 * Copyright IBM Corp. 2026
 *
 * Incident History & Resolution Page
 * Historical analysis of resolved alerts, root causes, and post-mortem actions.
 * Fetches real data from alerts and tickets APIs, computes resolution metrics.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { logger } from '@/shared/utils/logger';
import { useFetchData, useThemeDetection } from '@/shared/hooks';
import { Download, CheckmarkOutline, Time, Policy, WarningAlt } from '@carbon/icons-react';
import { ScaleTypes } from '@carbon/charts';
import '@carbon/charts-react/styles.css';

import { KPICard, PageHeader, FilterBar, ComingSoonModal, useComingSoon } from '@/components';
import { PageLayout } from '@/components/layout';
import type { KPICardProps } from '@/components/ui/KPICard';
import type { DropdownFilterConfig } from '@/components/ui/FilterBar';

import { IncidentCharts, IncidentRightColumn } from './components/IncidentCharts';
import { IncidentTable } from './components/IncidentTable';
import { IncidentSkeleton } from './components/IncidentSkeleton';
import type { ResolvedIncident } from './components/IncidentTable';
import type { RootCauseDistribution, DurationChartData } from './components/IncidentCharts';

import {
  SLA_THRESHOLD_MINUTES, TIME_RANGE_OPTIONS, ROOT_CAUSE_COLORS,
  computeDuration, categorizeRootCause, formatDate, derivePreventionActions,
} from './components/types';
import type { TimeRangeOption } from './components/types';

import { alertDataService, ticketDataService } from '@/shared/services';
import type { DetailedAlert } from '@/features/alerts/types';
import { useToast } from '@/contexts';
import { ROUTES } from '@/shared/constants/routes';
import '@/styles/pages/_incident-history.scss';

export function IncidentHistoryPage() {
  const { addToast } = useToast();
  const { open: comingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

  const currentTheme = useThemeDetection();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeOption>(TIME_RANGE_OPTIONS[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data fetching via useFetchData
  const { data: rawIncidents, isLoading, refetch } = useFetchData(
    async (_signal) => {
      const [alertsResponse, ticketsResponse] = await Promise.all([
        alertDataService.getAlerts(),
        ticketDataService.getTickets(),
      ]);

      // getAlerts() returns PriorityAlert[] but transformAlert() actually produces DetailedAlert[]
      const allAlerts = (alertsResponse || []) as DetailedAlert[];
      const resolved = allAlerts.filter(
        (a) => a.status === 'resolved' || a.status === 'dismissed'
      );

      // Keep resolved tickets reference for future use
      void (ticketsResponse || []).filter(
        (t) => t.status === 'resolved' || t.status === 'closed'
      );

      const incidents: ResolvedIncident[] = resolved.map((alert: DetailedAlert) => {
        const timestampStr = typeof alert.timestamp === 'string'
          ? alert.timestamp
          : alert.timestamp?.absolute || new Date().toISOString();
        const resolvedAt = (alert as DetailedAlert & { resolvedAt?: string; resolved_at?: string });
        const resolvedAtStr = resolvedAt.resolvedAt || resolvedAt.resolved_at || null;
        const { text: durationText, minutes: durationMinutes } = resolvedAtStr
          ? computeDuration(timestampStr, resolvedAtStr)
          : { text: 'Unknown', minutes: 0 };
        const category = alert.category || ''
          || (alert.aiAnalysis?.rootCauses?.[0]) || alert.aiTitle || '';
        const rootCauseCategory = categorizeRootCause(category);

        return {
          id: alert.id || `INC-${Math.random().toString(36).slice(2, 8)}`,
          date: formatDate(timestampStr),
          summary: alert.aiTitle || alert.aiSummary || 'Resolved Incident',
          rootCause: category || rootCauseCategory,
          rootCauseCategory,
          duration: durationText,
          durationMinutes,
          severity: alert.severity || 'info',
          analysis: alert.aiAnalysis?.summary || alert.aiSummary || 'Analysis pending.',
          resolution: alert.aiAnalysis?.recommendedActions?.[0] || 'Resolved by operations team.',
          resolvedAt: resolvedAtStr,
          timestamp: timestampStr,
        };
      });

      incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return incidents;
    },
    [selectedTimeRange],
    {
      initialData: [] as ResolvedIncident[],
      onError: (err) => logger.error('Failed to fetch incident history data', err),
    }
  );

  // 60-second auto-refresh
  useEffect(() => {
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  // -- Derived data --

  const resolvedIncidents = rawIncidents ?? [];

  const filteredByTimeRange = useMemo(() => {
    const now = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[selectedTimeRange.id] || 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return resolvedIncidents.filter((inc) => {
      const d = new Date(inc.timestamp);
      return !isNaN(d.getTime()) && d >= cutoff;
    });
  }, [resolvedIncidents, selectedTimeRange]);

  const searchFilteredIncidents = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTimeRange;
    const query = searchQuery.toLowerCase();
    return filteredByTimeRange.filter(
      (inc) =>
        inc.summary.toLowerCase().includes(query) ||
        inc.rootCause.toLowerCase().includes(query) ||
        inc.rootCauseCategory.toLowerCase().includes(query) ||
        inc.id.toLowerCase().includes(query)
    );
  }, [filteredByTimeRange, searchQuery]);

  const kpiData: KPICardProps[] = useMemo(() => {
    const incidents = filteredByTimeRange;
    const total = incidents.length;
    const totalMin = incidents.reduce((sum, inc) => sum + inc.durationMinutes, 0);
    const mttr = total > 0 ? Math.round(totalMin / total) : 0;
    const withinSLA = incidents.filter((inc) => inc.durationMinutes <= SLA_THRESHOLD_MINUTES).length;
    const slaPct = total > 0 ? ((withinSLA / total) * 100).toFixed(1) : '0.0';
    const preventable = incidents.filter(
      (inc) => inc.rootCauseCategory === 'Config Drift' || inc.rootCauseCategory === 'Human Error'
    ).length;

    return [
      {
        id: 'resolved-incidents', label: 'Resolved Incidents', value: total,
        subtitle: 'In selected time period', icon: CheckmarkOutline, iconColor: 'var(--cds-support-success, #24a148)',
        severity: 'success' as const,
        trend: { direction: 'down' as const, value: `${total} total`, isPositive: true },
      },
      {
        id: 'mttr', label: 'Mean Time to Resolve', value: `${mttr}m`,
        subtitle: 'Average resolution time', icon: Time, iconColor: 'var(--cds-interactive, #0f62fe)',
        severity: 'info' as const,
        trend: { direction: (mttr < 45 ? 'down' : 'up') as 'down' | 'up', value: mttr < 45 ? 'Below target' : 'Above target', isPositive: mttr < 45 },
      },
      {
        id: 'sla-compliance', label: 'SLA Compliance', value: `${slaPct}%`,
        subtitle: `Target: ${SLA_THRESHOLD_MINUTES}m resolution`, icon: Policy,
        iconColor: parseFloat(slaPct) >= 99 ? 'var(--cds-support-success, #24a148)' : 'var(--cds-support-warning, #ff832b)',
        severity: (parseFloat(slaPct) >= 99 ? 'success' : 'major') as 'success' | 'major',
      },
      {
        id: 'preventable', label: 'Preventable Issues', value: preventable,
        subtitle: 'Config drift & human error', icon: WarningAlt, iconColor: 'var(--cds-support-warning, #ff832b)',
        severity: (preventable > 0 ? 'major' : 'success') as 'major' | 'success',
        badge: preventable > 0 ? { text: 'Needs Attention', type: 'warning' as const } : undefined,
      },
    ];
  }, [filteredByTimeRange]);

  const rootCauseDistribution: RootCauseDistribution[] = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByTimeRange.forEach((inc) => {
      counts[inc.rootCauseCategory] = (counts[inc.rootCauseCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([group, value]) => ({ group, value })).sort((a, b) => b.value - a.value);
  }, [filteredByTimeRange]);

  const durationChartData: DurationChartData[] = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return filteredByTimeRange.reduce<DurationChartData[]>((acc, inc) => {
      const date = new Date(inc.timestamp);
      if (isNaN(date.getTime())) return acc;
      const sev = inc.severity;
      const group = (sev === 'critical' || sev === 'high') ? 'Critical'
        : (sev === 'major' || sev === 'medium') ? 'Major' : 'Minor';
      acc.push({ group, key: dayNames[date.getDay()], value: inc.durationMinutes });
      return acc;
    }, []);
  }, [filteredByTimeRange]);

  const preventionActions = useMemo(() => derivePreventionActions(filteredByTimeRange), [filteredByTimeRange]);

  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchFilteredIncidents.slice(start, start + pageSize);
  }, [searchFilteredIncidents, currentPage, pageSize]);

  // -- FilterBar config --

  const filterDropdowns: DropdownFilterConfig[] = useMemo(() => [
    {
      id: 'time-range-filter', label: 'Time Range',
      options: TIME_RANGE_OPTIONS as unknown as Array<{ id: string; text: string }>,
      selectedItem: selectedTimeRange,
      onChange: (item) => setSelectedTimeRange(item || TIME_RANGE_OPTIONS[1]),
    },
  ], [selectedTimeRange]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTimeRange(TIME_RANGE_OPTIONS[1]);
    setCurrentPage(1);
  }, []);

  // -- Chart options --

  // Filter color scales to only include groups present in data (avoids Carbon Charts warnings)
  const barColorScale = useMemo(() => {
    const ALL_BAR_COLORS: Record<string, string> = { Critical: '#da1e28', Major: '#ff832b', Minor: '#0f62fe' };
    const presentGroups = new Set(durationChartData.map(d => d.group));
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(ALL_BAR_COLORS)) {
      if (presentGroups.has(k)) filtered[k] = v;
    }
    return Object.keys(filtered).length > 0 ? filtered : ALL_BAR_COLORS;
  }, [durationChartData]);

  const donutColorScale = useMemo(() => {
    const presentGroups = new Set(rootCauseDistribution.map(d => d.group));
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(ROOT_CAUSE_COLORS)) {
      if (presentGroups.has(k)) filtered[k] = v;
    }
    return Object.keys(filtered).length > 0 ? filtered : ROOT_CAUSE_COLORS;
  }, [rootCauseDistribution]);

  const barChartOptions = useMemo(() => ({
    axes: {
      left: { mapsTo: 'value', title: 'Duration (min)' },
      bottom: { mapsTo: 'key', scaleType: ScaleTypes.LABELS, title: 'Day' },
    },
    height: '280px',
    color: { scale: barColorScale },
    theme: currentTheme, toolbar: { enabled: false },
    legend: { alignment: 'center' as const, position: 'top' as const },
  }), [currentTheme, barColorScale]);

  const donutOptions = useMemo(() => ({
    resizable: true,
    donut: { center: { label: 'Total' }, alignment: 'center' as const },
    height: '260px',
    legend: { alignment: 'center' as const, position: 'bottom' as const },
    color: { scale: donutColorScale },
    theme: currentTheme, toolbar: { enabled: false },
  }), [currentTheme, donutColorScale]);

  // -- Handlers --

  const handleExport = useCallback(async () => {
    try { await alertDataService.exportReport('csv'); }
    catch (error) { logger.error('Incident history export failed', error); }
  }, []);

  const handlePreventionAction = useCallback((actionLabel: string) => {
    showComingSoon({
      name: actionLabel,
      description: `The "${actionLabel}" automation action is currently under development and will be available in a future release.`,
    });
  }, [showComingSoon]);

  const handlePaginationChange = useCallback((page: number, newPageSize: number) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  }, []);

  // -- Loading --

  if (isLoading && resolvedIncidents.length === 0) {
    return <IncidentSkeleton />;
  }

  // -- Render --

  return (
    <PageLayout>
    <div className="incident-history-page">
      <PageHeader
        title="Incident History & Resolution"
        subtitle="Historical analysis of resolved alerts, root causes, and post-mortem actions."
        showBreadcrumbs
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Trends', href: ROUTES.TRENDS },
          { label: 'Incident History', active: true },
        ]}
        showBorder
        actions={[{ label: 'Export Report', onClick: handleExport, variant: 'primary', icon: Download }]}
      />

      <div className="incident-history-page__content">
        <div className="kpi-row">
          {kpiData.map((kpi) => <KPICard key={kpi.id} {...kpi} />)}
        </div>

        <FilterBar
          searchEnabled
          searchPlaceholder="Filter by root cause, summary, or ID..."
          searchValue={searchQuery}
          onSearchChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
          dropdowns={filterDropdowns}
          onClearAll={clearAllFilters}
          totalCount={filteredByTimeRange.length}
          filteredCount={searchFilteredIncidents.length}
          itemLabel="incidents"
        />

        <div className="incident-history-page__split-layout">
          <div className="incident-history-page__left-column">
            <IncidentCharts
              durationChartData={durationChartData}
              barChartOptions={barChartOptions}
              rootCauseDistribution={rootCauseDistribution}
              donutOptions={donutOptions}
              preventionActions={preventionActions}
              isLoading={isLoading}
              onPreventionAction={handlePreventionAction}
            />
            <IncidentTable
              paginatedIncidents={paginatedIncidents}
              totalFilteredCount={searchFilteredIncidents.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
            />
          </div>
          <div className="incident-history-page__right-column">
            <IncidentRightColumn
              rootCauseDistribution={rootCauseDistribution}
              donutOptions={donutOptions}
              preventionActions={preventionActions}
              isLoading={isLoading}
              onPreventionAction={handlePreventionAction}
            />
          </div>
        </div>
      </div>
      {/* Coming Soon Modal */}
      <ComingSoonModal open={comingSoonOpen} onClose={hideComingSoon} feature={comingSoonFeature} />
    </div>
    </PageLayout>
  );
}

export default IncidentHistoryPage;
