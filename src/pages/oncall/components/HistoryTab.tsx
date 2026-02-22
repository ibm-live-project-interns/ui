/**
 * Copyright IBM Corp. 2026
 *
 * HistoryTab - Past on-call schedule history for On-Call page.
 * Displays paginated DataTable of completed schedules.
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
  Pagination,
} from '@carbon/react';

import { EmptyState } from '@/components/ui';
import type { OnCallSchedule } from '@/shared/services';
import type { UsePaginatedSearchResult } from '@/shared/hooks';

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

export interface HistoryTabProps {
  pastSchedules: OnCallSchedule[];
  pagination: UsePaginatedSearchResult<OnCallSchedule>;
}

// ==========================================
// Constants
// ==========================================

const HISTORY_HEADERS = [
  { key: 'username', header: 'On-Call Person' },
  { key: 'start_time', header: 'Start' },
  { key: 'end_time', header: 'End' },
  { key: 'rotation_type', header: 'Rotation' },
  { key: 'is_primary', header: 'Role' },
];

// ==========================================
// Component
// ==========================================

export const HistoryTab = React.memo(function HistoryTab({
  pastSchedules,
  pagination,
}: HistoryTabProps) {
  const historyRows = pagination.paginated.map((s) => ({
    id: String(s.id),
    username: s.username,
    start_time: formatDateTime(s.start_time),
    end_time: formatDateTime(s.end_time),
    rotation_type: s.rotation_type,
    is_primary: s.is_primary ? 'Primary' : 'Secondary',
  }));

  if (pastSchedules.length === 0) {
    return (
      <div className="oncall-page__section">
        <EmptyState
          title="No past schedules"
          description="Past on-call schedules will appear here once their end time has passed."
        />
      </div>
    );
  }

  return (
    <div className="oncall-page__section">
      <Tile className="oncall-page__table-tile">
        <DataTable rows={historyRows} headers={HISTORY_HEADERS}>
          {({ rows, headers: tHeaders, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer aria-label="On-call activity history">
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
                    const schedule = pastSchedules.find(
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
                          return <TableCell key={cell.id}>{cell.value}</TableCell>;
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
      <Pagination
        totalItems={pagination.totalFiltered}
        pageSize={pagination.pageSize}
        page={pagination.page}
        pageSizes={[10, 25, 50]}
        onChange={pagination.onPageChange}
      />
    </div>
  );
});
