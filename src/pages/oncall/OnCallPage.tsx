/**
 * Copyright IBM Corp. 2026
 *
 * On-Call Schedule Page
 *
 * Full CRUD management for on-call schedules and overrides.
 * Uses Carbon Tabs for Schedule / Overrides / History views.
 *
 * Endpoints:
 *   GET    /on-call/schedules     - list schedules
 *   POST   /on-call/schedules     - create schedule
 *   PUT    /on-call/schedules/:id - update schedule
 *   DELETE /on-call/schedules/:id - delete schedule
 *   POST   /on-call/overrides     - create override
 *   DELETE /on-call/overrides/:id - delete override
 *   GET    /on-call/current       - current on-call person
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Tile,
  SkeletonText,
  DataTableSkeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@carbon/react';
import { Renew, UserMultiple, Time, CalendarHeatMap, EventSchedule } from '@carbon/icons-react';

import { KPICard, PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout';
import type { KPICardProps } from '@/components/ui/KPICard';
import { useFetchData, usePaginatedSearch, useFormModal } from '@/shared/hooks';
import { onCallService } from '@/shared/services';
import type { OnCallSchedule, CreateScheduleRequest, CreateOverrideRequest } from '@/shared/services';
import { ROUTES } from '@/shared/constants/routes';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';

// Child components
import { ScheduleTab } from './components/ScheduleTab';
import { OverridesTab } from './components/OverridesTab';
import { HistoryTab } from './components/HistoryTab';
import { WeeklyOverview } from './components/WeeklyOverview';
import { ScheduleFormModal, OverrideFormModal, DeleteConfirmModal } from './components/OnCallModals';

// Types, constants, and helpers
import {
  formatShortDate,
  getWeekDays,
  isScheduleOnDay,
  toRFC3339,
  INITIAL_SCHEDULE,
  INITIAL_OVERRIDE,
} from './components/types';
import type { ScheduleFormValues, OverrideFormValues } from './components/types';

import '@/styles/pages/_on-call.scss';

export function OnCallPage() {
  const { addToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'schedule' | 'override'; id: number } | null>(null);

  // -- Data Fetching --
  const {
    data: schedulesData,
    isLoading: schedulesLoading,
    refetch: refetchSchedules,
  } = useFetchData(
    async () => {
      const [schedulesRes, currentRes] = await Promise.all([
        onCallService.getSchedules({ limit: 200 }),
        onCallService.getCurrentOnCall(),
      ]);
      return { schedulesRes, currentRes };
    },
    [],
    {
      onError: (err) => {
        logger.error('Failed to fetch on-call data', err);
        addToast('error', 'Failed to load on-call data');
      },
    }
  );

  const allSchedules = schedulesData?.schedulesRes?.schedules ?? [];
  const currentOnCall = schedulesData?.currentRes?.on_call ?? [];
  const totalSchedules = schedulesData?.schedulesRes?.total ?? 0;

  // -- Derived Data --
  const now = new Date();

  const activeSchedules = useMemo(
    () => allSchedules.filter((s) => new Date(s.end_time) >= now),
    [allSchedules]
  );

  const pastSchedules = useMemo(
    () => allSchedules.filter((s) => new Date(s.end_time) < now),
    [allSchedules]
  );

  const weekDays = useMemo(() => getWeekDays(), []);

  const historyPagination = usePaginatedSearch<OnCallSchedule>(
    pastSchedules,
    ['username', 'rotation_type', 'created_by'],
    10
  );

  // -- KPIs --
  const kpiData = useMemo((): KPICardProps[] => {
    const currentName = currentOnCall.length > 0
      ? currentOnCall[0]?.name || 'Unknown'
      : activeSchedules.find((s) => s.is_primary)?.username || 'Not assigned';

    const nextRotation = activeSchedules
      .filter((s) => new Date(s.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

    const coveredDays = weekDays.filter((day) =>
      activeSchedules.some((s) => isScheduleOnDay(s, day.date))
    ).length;
    const coveragePct = Math.round((coveredDays / 7) * 100);

    return [
      {
        id: 'current-oncall', label: 'Current On-Call', value: currentName,
        icon: UserMultiple, iconColor: 'var(--cds-support-success, #24a148)', severity: 'success' as const,
        subtitle: currentOnCall.length > 0
          ? `${currentOnCall.length} person${currentOnCall.length !== 1 ? 's' : ''} active`
          : 'Based on schedule',
      },
      {
        id: 'next-rotation', label: 'Next Rotation',
        value: nextRotation ? formatShortDate(nextRotation.start_time) : 'N/A',
        icon: EventSchedule, iconColor: 'var(--cds-interactive, #0f62fe)', severity: 'info' as const,
        subtitle: nextRotation?.username || 'No upcoming rotation',
      },
      {
        id: 'total-schedules', label: 'Active Schedules', value: activeSchedules.length,
        icon: Time, iconColor: 'var(--cds-support-info, #a56eff)', severity: 'info' as const,
        subtitle: `${totalSchedules} total`,
      },
      {
        id: 'coverage', label: 'Weekly Coverage', value: `${coveragePct}%`,
        icon: CalendarHeatMap,
        iconColor: coveragePct >= 100 ? 'var(--cds-support-success, #198038)' : coveragePct >= 70 ? 'var(--cds-support-warning, #ff832b)' : 'var(--cds-support-error, #da1e28)',
        severity: (coveragePct >= 100 ? 'success' : coveragePct >= 70 ? 'major' : 'critical') as 'success' | 'major' | 'critical',
        subtitle: `${coveredDays}/7 days covered`,
      },
    ];
  }, [currentOnCall, activeSchedules, totalSchedules, weekDays]);

  // -- Schedule Form Modal --
  const scheduleModal = useFormModal<ScheduleFormValues>(INITIAL_SCHEDULE);

  const handleCreateSchedule = useCallback(async () => {
    const { values } = scheduleModal;
    if (!values.username.trim()) { addToast('error', 'Username is required'); return; }
    if (!values.startDate || !values.endDate) { addToast('error', 'Start and end dates are required'); return; }

    const startTimeRFC = toRFC3339(values.startDate, values.startTime);
    const endTimeRFC = toRFC3339(values.endDate, values.endTime);
    if (!startTimeRFC || !endTimeRFC) { addToast('error', 'Invalid date format'); return; }

    scheduleModal.setSubmitting(true);
    try {
      const payload: CreateScheduleRequest = {
        username: values.username.trim(),
        start_time: startTimeRFC,
        end_time: endTimeRFC,
        rotation_type: values.rotation_type || 'weekly',
        is_primary: values.is_primary,
      };
      if (values.id > 0) {
        await onCallService.updateSchedule(values.id, payload);
        addToast('success', 'Schedule updated successfully');
      } else {
        await onCallService.createSchedule(payload);
        addToast('success', 'Schedule created successfully');
      }
      scheduleModal.close();
      refetchSchedules();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to save schedule');
      logger.error('Schedule save failed', err);
    } finally {
      scheduleModal.setSubmitting(false);
    }
  }, [scheduleModal, addToast, refetchSchedules]);

  // -- Override Form Modal --
  const overrideModal = useFormModal<OverrideFormValues>(INITIAL_OVERRIDE);

  const handleCreateOverride = useCallback(async () => {
    const { values } = overrideModal;
    if (!values.schedule_id) { addToast('error', 'Please select a schedule'); return; }
    if (!values.startDate || !values.endDate) { addToast('error', 'Start and end dates are required'); return; }

    const startTimeRFC = toRFC3339(values.startDate, values.startTime);
    const endTimeRFC = toRFC3339(values.endDate, values.endTime);
    if (!startTimeRFC || !endTimeRFC) { addToast('error', 'Invalid date format'); return; }

    overrideModal.setSubmitting(true);
    try {
      const payload: CreateOverrideRequest = {
        schedule_id: parseInt(values.schedule_id, 10),
        start_time: startTimeRFC,
        end_time: endTimeRFC,
        reason: values.reason?.trim() || '',
      };
      await onCallService.createOverride(payload);
      addToast('success', 'Override created successfully');
      overrideModal.close();
      refetchSchedules();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create override');
      logger.error('Override creation failed', err);
    } finally {
      overrideModal.setSubmitting(false);
    }
  }, [overrideModal, addToast, refetchSchedules]);

  // -- Delete Handler --
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'schedule') {
        await onCallService.deleteSchedule(deleteTarget.id);
        addToast('success', 'Schedule deleted successfully');
      } else {
        await onCallService.deleteOverride(deleteTarget.id);
        addToast('success', 'Override deleted successfully');
      }
      setDeleteTarget(null);
      refetchSchedules();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Delete failed');
      logger.error('Delete failed', err);
    }
  }, [deleteTarget, addToast, refetchSchedules]);

  // -- Loading State --
  if (schedulesLoading && allSchedules.length === 0) {
    return (
      <PageLayout className="oncall-page">
        <PageHeader
          title="On-Call Schedule"
          subtitle="Loading on-call data..."
          showBreadcrumbs
          breadcrumbs={[
            { label: 'Home', href: ROUTES.DASHBOARD },
            { label: 'On-Call Schedule', active: true },
          ]}
          showBorder
        />
        <div className="oncall-page__content">
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
  }

  // -- Render --
  return (
    <PageLayout className="oncall-page">
      <PageHeader
        title="On-Call Schedule"
        subtitle="Manage on-call rotations, schedule overrides, and view history."
        showBreadcrumbs
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'On-Call Schedule', active: true },
        ]}
        showBorder
        actions={[{ label: 'Refresh', onClick: refetchSchedules, variant: 'secondary', icon: Renew }]}
      />

      <div className="oncall-page__content">
        <div className="kpi-row">
          {kpiData.map((kpi) => <KPICard key={kpi.id} {...kpi} />)}
        </div>

        <WeeklyOverview weekDays={weekDays} activeSchedules={activeSchedules} />

        <div className="oncall-page__tabs">
          <Tabs>
            <TabList aria-label="On-call views">
              <Tab>Schedule ({activeSchedules.length})</Tab>
              <Tab>Overrides</Tab>
              <Tab>History ({pastSchedules.length})</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <ScheduleTab
                  activeSchedules={activeSchedules}
                  onAddSchedule={() => scheduleModal.open()}
                  onDeleteSchedule={(id) => setDeleteTarget({ type: 'schedule', id })}
                />
              </TabPanel>
              <TabPanel>
                <OverridesTab
                  hasActiveSchedules={activeSchedules.length > 0}
                  onAddOverride={() => overrideModal.open()}
                />
              </TabPanel>
              <TabPanel>
                <HistoryTab pastSchedules={pastSchedules} pagination={historyPagination} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>

      <ScheduleFormModal modal={scheduleModal} onSubmit={handleCreateSchedule} />
      <OverrideFormModal modal={overrideModal} activeSchedules={activeSchedules} onSubmit={handleCreateOverride} />
      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}

export default OnCallPage;
