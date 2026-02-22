/**
 * Copyright IBM Corp. 2026
 *
 * ScheduleTab - Schedule DataTable for On-Call page.
 * Displays active on-call schedules with rotation type, role, and delete actions.
 */

import React from 'react';
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
  Button,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

import { EmptyState } from '@/components/ui';
import type { OnCallSchedule } from '@/shared/services';

// ==========================================
// Helpers
// ==========================================

function formatDateTime(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
}

function getRotationTagType(rotation: string): 'blue' | 'teal' | 'purple' | 'cyan' {
  switch (rotation) {
    case 'daily': return 'cyan';
    case 'weekly': return 'blue';
    case 'biweekly': return 'teal';
    case 'monthly': return 'purple';
    default: return 'blue';
  }
}

// ==========================================
// Props
// ==========================================

export interface ScheduleTabProps {
  activeSchedules: OnCallSchedule[];
  onAddSchedule: () => void;
  onDeleteSchedule: (id: number) => void;
}

// ==========================================
// Constants
// ==========================================

const SCHEDULE_HEADERS = [
  { key: 'username', header: 'On-Call Person' },
  { key: 'start_time', header: 'Start' },
  { key: 'end_time', header: 'End' },
  { key: 'rotation_type', header: 'Rotation' },
  { key: 'is_primary', header: 'Role' },
  { key: 'created_by', header: 'Created By' },
  { key: 'actions', header: 'Actions' },
];

// ==========================================
// Component
// ==========================================

export const ScheduleTab = React.memo(function ScheduleTab({
  activeSchedules,
  onAddSchedule,
  onDeleteSchedule,
}: ScheduleTabProps) {
  const scheduleRows = activeSchedules.map((s) => ({
    id: String(s.id),
    username: s.username,
    start_time: formatDateTime(s.start_time),
    end_time: formatDateTime(s.end_time),
    rotation_type: s.rotation_type,
    is_primary: s.is_primary ? 'Primary' : 'Secondary',
    created_by: s.created_by || '--',
    actions: '',
  }));

  return (
    <div className="oncall-page__section">
      <div className="u-action-bar-right">
        <Button
          kind="primary"
          size="sm"
          renderIcon={Add}
          onClick={onAddSchedule}
        >
          Add Schedule
        </Button>
      </div>

      {activeSchedules.length === 0 ? (
        <EmptyState
          title="No active schedules"
          description="Create an on-call schedule to get started."
          action={{
            label: 'Add Schedule',
            onClick: onAddSchedule,
          }}
        />
      ) : (
        <Tile className="oncall-page__table-tile">
          <DataTable rows={scheduleRows} headers={SCHEDULE_HEADERS}>
            {({ rows, headers: tHeaders, getTableProps, getHeaderProps, getRowProps }) => (
              <TableContainer aria-label="On-call schedule with rotation details">
                <Table {...getTableProps()} size="md">
                  <TableHead>
                    <TableRow>
                      {tHeaders.map((header) => {
                        const { key: headerKey, ...headerProps } = getHeaderProps({ header });
                        return (
                          <TableHeader key={headerKey} {...headerProps}>
                            {header.header}
                          </TableHeader>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const schedule = activeSchedules.find(
                        (s) => String(s.id) === row.id
                      );
                      const { key: rowKey, ...rowProps } = getRowProps({ row });
                      return (
                        <TableRow key={rowKey} {...rowProps}>
                          {row.cells.map((cell) => {
                            if (cell.info.header === 'rotation_type' && schedule) {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag
                                    type={getRotationTagType(schedule.rotation_type)}
                                    size="sm"
                                  >
                                    {schedule.rotation_type}
                                  </Tag>
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'is_primary' && schedule) {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag type={schedule.is_primary ? 'green' : 'gray'} size="sm">
                                    {schedule.is_primary ? 'Primary' : 'Secondary'}
                                  </Tag>
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'actions' && schedule) {
                              return (
                                <TableCell key={cell.id}>
                                  <div className="oncall-page__action-cell">
                                    <Button
                                      kind="ghost"
                                      size="sm"
                                      hasIconOnly
                                      renderIcon={TrashCan}
                                      iconDescription="Delete schedule"
                                      onClick={() => onDeleteSchedule(schedule.id)}
                                    />
                                  </div>
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={cell.id}>{cell.value}</TableCell>
                            );
                          })}
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
  );
});
