/**
 * Copyright IBM Corp. 2026
 *
 * Incident Table Component
 * Renders the incident log DataTable with expandable rows showing
 * analysis and resolution detail panels.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
  Pagination,
  Tag,
  Button,
} from '@carbon/react';
import { DocumentView } from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

export interface ResolvedIncident {
  id: string;
  date: string;
  summary: string;
  rootCause: string;
  rootCauseCategory: string;
  duration: string;
  durationMinutes: number;
  severity: string;
  analysis: string;
  resolution: string;
  resolvedAt: string;
  timestamp: string;
}

interface IncidentTableProps {
  /** The paginated set of incidents to display */
  paginatedIncidents: ResolvedIncident[];
  /** Total count of search-filtered incidents (for pagination) */
  totalFilteredCount: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of rows per page */
  pageSize: number;
  /** Callback when page or page size changes */
  onPaginationChange: (page: number, pageSize: number) => void;
}

// ==========================================
// Helpers
// ==========================================

const TABLE_HEADERS = [
  { key: 'id', header: 'ID' },
  { key: 'date', header: 'Date/Time' },
  { key: 'summary', header: 'Incident Summary' },
  { key: 'rootCauseCategory', header: 'Root Cause' },
  { key: 'duration', header: 'Duration' },
  { key: 'report', header: 'Report' },
];

function getRootCauseTagType(category: string): 'red' | 'magenta' | 'blue' | 'green' | 'purple' | 'gray' | 'teal' {
  switch (category) {
    case 'Hardware Failure': return 'red';
    case 'Config Drift': return 'magenta';
    case 'Capacity': return 'blue';
    case 'Upstream': return 'green';
    case 'Software Bug': return 'purple';
    case 'Human Error': return 'teal';
    default: return 'gray';
  }
}

// ==========================================
// Component
// ==========================================

export const IncidentTable = React.memo(function IncidentTable({
  paginatedIncidents,
  totalFilteredCount,
  currentPage,
  pageSize,
  onPaginationChange,
}: IncidentTableProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      paginatedIncidents.map((inc) => ({
        id: inc.id,
        date: inc.date,
        summary: inc.summary,
        rootCauseCategory: inc.rootCauseCategory,
        duration: inc.duration,
        report: '',
      })),
    [paginatedIncidents]
  );

  return (
    <Tile className="incident-history-page__table-tile">
      <div className="table-header">
        <div className="table-header__left">
          <h3>Incident Log</h3>
        </div>
      </div>

      <DataTable rows={tableRows} headers={TABLE_HEADERS}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getExpandHeaderProps,
        }) => (
          <TableContainer aria-label="Resolved incidents with root cause and duration">
            <Table {...getTableProps()} size="md">
              <TableHead>
                <TableRow>
                  <TableExpandHeader
                    {...getExpandHeaderProps()}
                    aria-label="Expand row"
                  />
                  {headers.map((header) => {
                    const { key: _key, ...headerProps } = getHeaderProps({ header });
                    return (
                      <TableHeader {...headerProps} key={header.key}>
                        {header.header}
                      </TableHeader>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const incident = paginatedIncidents.find((inc) => inc.id === row.id);
                  if (!incident) return null;
                  const { key: _rowKey, ...rowProps } = getRowProps({ row });

                  return (
                    <React.Fragment key={row.id}>
                      <TableExpandRow {...rowProps}>
                        <TableCell className="incident-id-cell">
                          <span
                            className="incident-id u-link-text"
                            role="link"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/alerts/${incident.id}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.stopPropagation();
                                navigate(`/alerts/${incident.id}`);
                              }
                            }}
                          >
                            {incident.id}
                          </span>
                        </TableCell>
                        <TableCell className="incident-date-cell">
                          {incident.date}
                        </TableCell>
                        <TableCell className="incident-summary-cell">
                          <span className="incident-summary-text">{incident.summary}</span>
                        </TableCell>
                        <TableCell>
                          <Tag type={getRootCauseTagType(incident.rootCauseCategory)} size="sm">
                            {incident.rootCauseCategory}
                          </Tag>
                        </TableCell>
                        <TableCell>{incident.duration}</TableCell>
                        <TableCell>
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={DocumentView}
                            iconDescription="View Report"
                            onClick={() => {
                              const expandBtn = document.querySelector(
                                `tr[data-row-id="${row.id}"] .cds--table-expand__button`
                              ) as HTMLButtonElement;
                              if (expandBtn && !row.isExpanded) expandBtn.click();
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableExpandRow>
                      <TableExpandedRow colSpan={headers.length + 1}>
                        <div className="incident-expanded-content">
                          <div className="incident-expanded-row">
                            <span className="incident-expanded-label">Analysis:</span>
                            <p className="incident-expanded-text">{incident.analysis}</p>
                          </div>
                          <div className="incident-expanded-row">
                            <span className="incident-expanded-label">Resolution:</span>
                            <p className="incident-expanded-text">{incident.resolution}</p>
                          </div>
                        </div>
                      </TableExpandedRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <Pagination
        totalItems={totalFilteredCount}
        pageSize={pageSize}
        pageSizes={[5, 10, 20, 50]}
        page={currentPage}
        onChange={({ page, pageSize: newPageSize }) => {
          onPaginationChange(page, newPageSize);
        }}
      />
    </Tile>
  );
});
