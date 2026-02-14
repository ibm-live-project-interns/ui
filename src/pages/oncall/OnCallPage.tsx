/**
 * Copyright IBM Corp. 2026
 *
 * On-Call Schedule Page
 * Displays who is currently on call, the weekly rotation schedule,
 * and any upcoming schedule overrides.
 *
 * Endpoints:
 *   GET /api/v1/on-call/current  - Currently on-call personnel
 *   GET /api/v1/on-call/schedule - Weekly schedule + overrides
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  Tile,
  SkeletonText,
  DataTableSkeleton,
} from '@carbon/react';
import {
  Phone,
  Email,
  Time,
  UserMultiple,
  CalendarHeatMap,
  Renew,
  WarningAlt,
  Checkmark,
  CircleFilled,
  EventSchedule,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';

// Config
import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { ROUTES } from '@/shared/constants/routes';

// ==========================================
// Types
// ==========================================

interface OnCallPerson {
  id: number;
  name: string;
  role: string;
  team: string;
  email: string;
  phone: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  status: string;
  avatar_url?: string;
}

interface ScheduleEntry {
  day: string;
  date: string;
  primary_oncall: string;
  primary_team: string;
  secondary_oncall: string;
  secondary_team: string;
  shift_hours: string;
  is_today: boolean;
}

interface ScheduleOverride {
  id: number;
  original_person: string;
  replace_person: string;
  date: string;
  reason: string;
  status: string;
  requested_by: string;
  created_at: string;
}

interface CurrentOnCallResponse {
  on_call: OnCallPerson[];
  total: number;
  timestamp: string;
}

interface ScheduleResponse {
  schedule: ScheduleEntry[];
  overrides: ScheduleOverride[];
  week_of: string;
}

// ==========================================
// On-Call API Service (inline, following AuditLogPage pattern)
// ==========================================

class OnCallService extends HttpService {
  constructor() {
    const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
    const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
    super(apiPath, 'OnCallService');
  }

  async getCurrentOnCall(): Promise<CurrentOnCallResponse> {
    try {
      return await this.get<CurrentOnCallResponse>('/on-call/current');
    } catch (error) {
      console.warn('[OnCallService] GET /on-call/current not available:', error);
      return { on_call: [], total: 0, timestamp: new Date().toISOString() };
    }
  }

  async getSchedule(): Promise<ScheduleResponse> {
    try {
      return await this.get<ScheduleResponse>('/on-call/schedule');
    } catch (error) {
      console.warn('[OnCallService] GET /on-call/schedule not available:', error);
      return { schedule: [], overrides: [], week_of: '' };
    }
  }
}

const onCallService = new OnCallService();

// ==========================================
// Helper Functions
// ==========================================

/**
 * Format an ISO timestamp to a friendly time display (e.g., "06:00 AM").
 */
function formatShiftTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--';
  }
}

/**
 * Format a date string (YYYY-MM-DD) to a short display (e.g., "Feb 10").
 */
function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Compute remaining hours in the current shift.
 */
function computeShiftRemaining(endTime: string): string {
  try {
    const end = new Date(endTime);
    const now = new Date();
    if (isNaN(end.getTime())) return '--';
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 'Shift ended';
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  } catch {
    return '--';
  }
}

/**
 * Get the tag type for an override status.
 */
function getOverrideStatusTag(status: string): 'green' | 'blue' | 'red' | 'gray' {
  switch (status) {
    case 'approved': return 'green';
    case 'pending': return 'blue';
    case 'rejected': return 'red';
    default: return 'gray';
  }
}

// ==========================================
// Component
// ==========================================

export function OnCallPage() {
  // Data state
  const [currentOnCall, setCurrentOnCall] = useState<OnCallPerson[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [weekOf, setWeekOf] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // Data Fetching
  // ==========================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [currentResponse, scheduleResponse] = await Promise.all([
        onCallService.getCurrentOnCall(),
        onCallService.getSchedule(),
      ]);

      setCurrentOnCall(currentResponse.on_call || []);
      setSchedule(scheduleResponse.schedule || []);
      setOverrides(scheduleResponse.overrides || []);
      setWeekOf(scheduleResponse.week_of || '');
    } catch (error) {
      console.error('[OnCallPage] Failed to fetch on-call data:', error);
      setCurrentOnCall([]);
      setSchedule([]);
      setOverrides([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const doFetch = async () => {
      if (!isMounted) return;
      await fetchData();
    };
    doFetch();

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      if (isMounted) fetchData();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // ==========================================
  // KPI Calculations
  // ==========================================

  const kpiData = useMemo((): KPICardProps[] => {
    const activeCount = currentOnCall.filter((p) => p.status === 'active').length;
    const pendingOverrides = overrides.filter((o) => o.status === 'pending').length;
    const approvedOverrides = overrides.filter((o) => o.status === 'approved').length;

    // Find the current person's remaining shift time
    const firstPerson = currentOnCall[0];
    const shiftRemaining = firstPerson ? computeShiftRemaining(firstPerson.end_time) : 'N/A';

    return [
      {
        id: 'active-oncall',
        label: 'Currently On Call',
        value: activeCount,
        icon: UserMultiple,
        iconColor: '#24a148',
        severity: activeCount > 0 ? 'success' as const : 'major' as const,
        subtitle: `${activeCount} engineer${activeCount !== 1 ? 's' : ''} active`,
      },
      {
        id: 'shift-remaining',
        label: 'Shift Time Remaining',
        value: shiftRemaining,
        icon: Time,
        iconColor: '#0f62fe',
        severity: 'info' as const,
        subtitle: firstPerson?.shift_type || 'Current shift',
      },
      {
        id: 'pending-overrides',
        label: 'Pending Overrides',
        value: pendingOverrides,
        icon: WarningAlt,
        iconColor: pendingOverrides > 0 ? '#ff832b' : '#198038',
        severity: pendingOverrides > 0 ? 'major' as const : 'success' as const,
        subtitle: `${approvedOverrides} approved`,
      },
      // Calculate schedule coverage from actual data
      (() => {
        // Count how many of the 7 days in the schedule have assigned on-call
        const scheduledDays = schedule ? schedule.filter((e) => e.primary_oncall).length : 0;
        const totalDays = schedule ? Math.max(schedule.length, 7) : 7;
        const coveragePct = totalDays > 0 ? Math.round((scheduledDays / totalDays) * 100) : 0;
        const coverageStr = schedule ? `${coveragePct}%` : 'N/A';
        return {
          id: 'schedule-coverage',
          label: 'Schedule Coverage',
          value: coverageStr,
          icon: CalendarHeatMap,
          iconColor: coveragePct >= 100 ? '#198038' : coveragePct >= 70 ? '#ff832b' : '#da1e28',
          severity: (coveragePct >= 100 ? 'success' : coveragePct >= 70 ? 'major' : 'critical') as 'success' | 'major' | 'critical',
          subtitle: weekOf ? `Week of ${formatShortDate(weekOf)}` : 'This week',
        };
      })(),
    ];
  }, [currentOnCall, overrides, weekOf, schedule]);

  // ==========================================
  // Weekly Schedule DataTable
  // ==========================================

  const scheduleHeaders = [
    { key: 'day', header: 'Day' },
    { key: 'date', header: 'Date' },
    { key: 'primary', header: 'Primary On-Call' },
    { key: 'secondary', header: 'Secondary On-Call' },
    { key: 'team', header: 'Primary Team' },
    { key: 'shift_hours', header: 'Shift Hours' },
  ];

  const scheduleRows = useMemo(
    () =>
      schedule.map((entry) => ({
        id: entry.date,
        day: entry.day,
        date: entry.date,
        primary: entry.primary_oncall,
        secondary: entry.secondary_oncall,
        team: entry.primary_team,
        shift_hours: entry.shift_hours,
        is_today: entry.is_today,
      })),
    [schedule]
  );

  // ==========================================
  // Overrides DataTable
  // ==========================================

  const overrideHeaders = [
    { key: 'date', header: 'Date' },
    { key: 'original', header: 'Original' },
    { key: 'replacement', header: 'Replacement' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
  ];

  const overrideRows = useMemo(
    () =>
      overrides.map((override) => ({
        id: String(override.id),
        date: override.date,
        original: override.original_person,
        replacement: override.replace_person,
        reason: override.reason,
        status: override.status,
      })),
    [overrides]
  );

  // ==========================================
  // Loading State
  // ==========================================

  if (isLoading && currentOnCall.length === 0) {
    return (
      <div className="oncall-page">
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
          <DataTableSkeleton columnCount={6} rowCount={7} showHeader={false} showToolbar={false} />
        </div>
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="oncall-page">
      {/* Page Header */}
      <PageHeader
        title="On-Call Schedule"
        subtitle="View current on-call assignments, weekly rotation, and schedule overrides."
        showBreadcrumbs
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'On-Call Schedule', active: true },
        ]}
        showBorder
        actions={[
          {
            label: 'Refresh',
            onClick: fetchData,
            variant: 'secondary',
            icon: Renew,
          },
        ]}
      />

      <div className="oncall-page__content">
        {/* KPI Stats Row */}
        <div className="kpi-row">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </div>

        {/* Currently On Call Section */}
        <div className="oncall-page__section">
          <h3 className="oncall-page__section-title">
            <CircleFilled size={16} style={{ color: '#24a148' }} />
            Currently On Call
          </h3>
          <div className="oncall-page__people-grid">
            {currentOnCall.length === 0 ? (
              <Tile className="oncall-page__empty-tile">
                <p>No on-call personnel data available.</p>
              </Tile>
            ) : (
              currentOnCall.map((person) => (
                <Tile key={person.id} className="oncall-page__person-tile">
                  <div className="oncall-page__person-header">
                    <div className="oncall-page__person-info">
                      <div className="oncall-page__person-name-row">
                        <span
                          className="oncall-page__status-dot"
                          style={{
                            backgroundColor: person.status === 'active' ? '#24a148' : '#da1e28',
                          }}
                        />
                        <h4 className="oncall-page__person-name">{person.name}</h4>
                      </div>
                      <Tag
                        type="blue"
                        size="sm"
                        className="oncall-page__role-tag"
                      >
                        {person.role}
                      </Tag>
                    </div>
                  </div>

                  <div className="oncall-page__person-details">
                    <div className="oncall-page__detail-row">
                      <UserMultiple size={14} />
                      <span>{person.team}</span>
                    </div>
                    <div className="oncall-page__detail-row">
                      <Email size={14} />
                      <span>{person.email}</span>
                    </div>
                    <div className="oncall-page__detail-row">
                      <Phone size={14} />
                      <span>{person.phone}</span>
                    </div>
                  </div>

                  <div className="oncall-page__person-shift">
                    <div className="oncall-page__shift-label">
                      <EventSchedule size={14} />
                      <span>{person.shift_type}</span>
                    </div>
                    <div className="oncall-page__shift-times">
                      {formatShiftTime(person.start_time)} - {formatShiftTime(person.end_time)}
                    </div>
                    <div className="oncall-page__shift-remaining">
                      {computeShiftRemaining(person.end_time)}
                    </div>
                  </div>
                </Tile>
              ))
            )}
          </div>
        </div>

        {/* Weekly Schedule Section */}
        <div className="oncall-page__section">
          <h3 className="oncall-page__section-title">
            <CalendarHeatMap size={16} />
            Weekly Schedule
            {weekOf && (
              <span className="oncall-page__week-label">
                Week of {formatShortDate(weekOf)}
              </span>
            )}
          </h3>
          <Tile className="oncall-page__table-tile">
            <DataTable rows={scheduleRows} headers={scheduleHeaders}>
              {({ rows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer>
                  <Table {...getTableProps()} size="md">
                    <TableHead>
                      <TableRow>
                        {tableHeaders.map((header) => (
                          <TableHeader {...getHeaderProps({ header })} key={header.key}>
                            {header.header}
                          </TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={scheduleHeaders.length}>
                            <div style={{
                              textAlign: 'center',
                              padding: '2rem',
                              color: 'var(--cds-text-secondary, #c6c6c6)',
                            }}>
                              No schedule data available.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const entry = schedule.find((s) => s.date === row.id);
                          if (!entry) return null;

                          return (
                            <TableRow
                              {...getRowProps({ row })}
                              key={row.id}
                              className={entry.is_today ? 'oncall-page__today-row' : ''}
                            >
                              <TableCell>
                                <div className="oncall-page__day-cell">
                                  <span className="oncall-page__day-name">{entry.day}</span>
                                  {entry.is_today && (
                                    <Tag type="green" size="sm">Today</Tag>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatShortDate(entry.date)}
                              </TableCell>
                              <TableCell>
                                <div className="oncall-page__person-cell">
                                  <span className="oncall-page__cell-name">
                                    {entry.primary_oncall}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="oncall-page__person-cell">
                                  <span className="oncall-page__cell-name-secondary">
                                    {entry.secondary_oncall}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Tag type="teal" size="sm">
                                  {entry.primary_team}
                                </Tag>
                              </TableCell>
                              <TableCell>
                                <span className="oncall-page__shift-cell">
                                  {entry.shift_hours}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </Tile>
        </div>

        {/* Upcoming Overrides Section */}
        <div className="oncall-page__section">
          <h3 className="oncall-page__section-title">
            <WarningAlt size={16} />
            Upcoming Overrides
            {overrides.length > 0 && (
              <Tag type="purple" size="sm" style={{ marginLeft: '0.5rem' }}>
                {overrides.length}
              </Tag>
            )}
          </h3>
          {overrides.length === 0 ? (
            <Tile className="oncall-page__empty-tile">
              <Checkmark size={20} style={{ color: '#24a148' }} />
              <p>No upcoming schedule overrides.</p>
            </Tile>
          ) : (
            <Tile className="oncall-page__table-tile">
              <DataTable rows={overrideRows} headers={overrideHeaders}>
                {({ rows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                  <TableContainer>
                    <Table {...getTableProps()} size="md">
                      <TableHead>
                        <TableRow>
                          {tableHeaders.map((header) => (
                            <TableHeader {...getHeaderProps({ header })} key={header.key}>
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => {
                          const override = overrides.find((o) => String(o.id) === row.id);
                          if (!override) return null;

                          return (
                            <TableRow {...getRowProps({ row })} key={row.id}>
                              <TableCell>
                                {formatShortDate(override.date)}
                              </TableCell>
                              <TableCell>
                                {override.original_person}
                              </TableCell>
                              <TableCell>
                                {override.replace_person}
                              </TableCell>
                              <TableCell>
                                {override.reason}
                              </TableCell>
                              <TableCell>
                                <Tag
                                  type={getOverrideStatusTag(override.status)}
                                  size="sm"
                                >
                                  {override.status.charAt(0).toUpperCase() + override.status.slice(1)}
                                </Tag>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            </Tile>
          )}
        </div>
      </div>

      {/* Scoped Styles */}
      <style>{`
        .oncall-page {
          width: 100%;
        }

        .oncall-page .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1056px) {
          .oncall-page .kpi-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 672px) {
          .oncall-page .kpi-row {
            grid-template-columns: 1fr;
          }
        }

        .oncall-page .kpi-card-skeleton {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .oncall-page__content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .oncall-page__section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .oncall-page__section-title {
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.16px;
          color: var(--cds-text-primary, #f4f4f4);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          padding: 0;
        }

        .oncall-page__week-label {
          font-weight: 400;
          color: var(--cds-text-secondary, #c6c6c6);
          font-size: 0.75rem;
          margin-left: 0.25rem;
        }

        /* People Grid */
        .oncall-page__people-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 1056px) {
          .oncall-page__people-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 672px) {
          .oncall-page__people-grid {
            grid-template-columns: 1fr;
          }
        }

        .oncall-page__person-tile {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .oncall-page__person-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .oncall-page__person-info {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .oncall-page__person-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .oncall-page__status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .oncall-page__person-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--cds-text-primary, #f4f4f4);
          margin: 0;
        }

        .oncall-page__role-tag {
          align-self: flex-start;
        }

        .oncall-page__person-details {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .oncall-page__detail-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--cds-text-secondary, #c6c6c6);
        }

        .oncall-page__detail-row svg {
          flex-shrink: 0;
          fill: var(--cds-text-secondary, #c6c6c6);
        }

        .oncall-page__person-shift {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--cds-border-subtle-01, #393939);
        }

        .oncall-page__shift-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--cds-text-primary, #f4f4f4);
        }

        .oncall-page__shift-label svg {
          fill: var(--cds-text-secondary, #c6c6c6);
        }

        .oncall-page__shift-times {
          font-size: 0.75rem;
          color: var(--cds-text-secondary, #c6c6c6);
          padding-left: calc(14px + 0.375rem);
        }

        .oncall-page__shift-remaining {
          font-size: 0.6875rem;
          color: var(--cds-text-helper, #a8a8a8);
          font-style: italic;
          padding-left: calc(14px + 0.375rem);
        }

        /* Table Tile */
        .oncall-page__table-tile {
          padding: 0;
        }

        .oncall-page__table-tile .cds--data-table-container {
          padding: 0;
        }

        /* Highlight today's row */
        .oncall-page__today-row {
          background-color: var(--cds-layer-selected-01, rgba(15, 98, 254, 0.1)) !important;
          border-left: 3px solid var(--cds-interactive-01, #0f62fe);
        }

        .oncall-page__day-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .oncall-page__day-name {
          font-weight: 500;
          color: var(--cds-text-primary, #f4f4f4);
        }

        .oncall-page__person-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .oncall-page__cell-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--cds-text-primary, #f4f4f4);
        }

        .oncall-page__cell-name-secondary {
          font-weight: 400;
          font-size: 0.875rem;
          color: var(--cds-text-secondary, #c6c6c6);
        }

        .oncall-page__shift-cell {
          font-size: 0.75rem;
          font-family: 'IBM Plex Mono', monospace;
          color: var(--cds-text-secondary, #c6c6c6);
        }

        /* Empty State Tile */
        .oncall-page__empty-tile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          color: var(--cds-text-secondary, #c6c6c6);
          font-size: 0.875rem;
        }

        .oncall-page__empty-tile p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default OnCallPage;
