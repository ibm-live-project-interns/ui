/**
 * Post-Mortem DataTable
 *
 * Expandable DataTable for post-mortem reports with category/status tags,
 * alert link cells, and inline PostMortemDetail expansion.
 */

import React, { useMemo, useCallback } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  Tag,
  Tile,
  Pagination,
} from '@carbon/react';
import { WarningAlt } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/ui';
import type { PostMortem } from '@/shared/services';

import { PostMortemDetail } from './PostMortemDetail';
import {
  TABLE_HEADERS,
  formatDate,
  getStatusTagType,
  getStatusLabel,
  getCategoryTagType,
} from './postmortem.types';

interface PostMortemTableProps {
  /** The currently paginated slice of post-mortems */
  paginated: PostMortem[];
  /** Total number of post-mortems after search/filter */
  totalFiltered: number;
  /** Current page number (1-based) */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Current search query (used for empty state message) */
  searchQuery: string;
  /** Pagination change handler */
  onPageChange: (args: { page: number; pageSize: number }) => void;
}

export const PostMortemTable = React.memo(function PostMortemTable({
  paginated,
  totalFiltered,
  page,
  pageSize,
  searchQuery,
  onPageChange,
}: PostMortemTableProps) {
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      paginated.map((pm) => ({
        id: String(pm.id),
        title: pm.title || 'Untitled',
        alert_id: pm.alert_id > 0 ? String(pm.alert_id) : '--',
        root_cause_category: pm.root_cause_category || 'unknown',
        status: pm.status || 'draft',
        created_by: pm.created_by || '--',
        created_at: formatDate(pm.created_at),
      })),
    [paginated]
  );

  const handleAlertClick = useCallback(
    (alertId: string) => {
      if (alertId && alertId !== '--') {
        navigate(`/alerts/${alertId}`);
      }
    },
    [navigate]
  );

  if (paginated.length === 0) {
    return (
      <EmptyState
        title="No post-mortems found"
        description={
          searchQuery
            ? `No post-mortems match "${searchQuery}". Try a different search term.`
            : 'No post-mortem reports have been created yet. Post-mortems are created from resolved alerts.'
        }
        icon={WarningAlt}
      />
    );
  }

  return (
    <>
      <Tile className="post-mortems-page__table-tile">
        <DataTable rows={rows} headers={TABLE_HEADERS}>
          {({
            rows: tableRows,
            headers: tHeaders,
            getTableProps,
            getHeaderProps,
            getRowProps,
            getExpandHeaderProps,
          }) => (
            <TableContainer aria-label="Post-mortem reports with root cause and action items">
              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    <TableExpandHeader enableToggle {...getExpandHeaderProps()} />
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
                  {tableRows.map((row) => {
                    const pm = paginated.find((p) => String(p.id) === row.id);
                    const { key: rowKey, ...rowProps } = getRowProps({ row });
                    return (
                      <React.Fragment key={row.id}>
                        <TableExpandRow key={rowKey} {...rowProps}>
                          {row.cells.map((cell) => {
                            if (cell.info.header === 'alert_id') {
                              const alertId = cell.value as string;
                              return (
                                <TableCell key={cell.id}>
                                  {alertId !== '--' ? (
                                    <button
                                      className="post-mortems-page__alert-link"
                                      onClick={() => handleAlertClick(alertId)}
                                      title={`View Alert ${alertId}`}
                                    >
                                      {alertId}
                                    </button>
                                  ) : (
                                    '--'
                                  )}
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'root_cause_category' && pm) {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag
                                    type={getCategoryTagType(pm.root_cause_category)}
                                    size="sm"
                                    className="post-mortems-page__category-tag"
                                  >
                                    {pm.root_cause_category || 'unknown'}
                                  </Tag>
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'status' && pm) {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag
                                    type={getStatusTagType(pm.status)}
                                    size="sm"
                                    className="post-mortems-page__status-tag"
                                  >
                                    {getStatusLabel(pm.status)}
                                  </Tag>
                                </TableCell>
                              );
                            }
                            return <TableCell key={cell.id}>{cell.value}</TableCell>;
                          })}
                        </TableExpandRow>
                        {row.isExpanded && pm && (
                          <TableExpandedRow colSpan={TABLE_HEADERS.length + 1}>
                            <PostMortemDetail postMortem={pm} />
                          </TableExpandedRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Tile>

      <Pagination
        totalItems={totalFiltered}
        pageSize={pageSize}
        page={page}
        pageSizes={[10, 25, 50]}
        onChange={onPageChange}
      />
    </>
  );
});
