/**
 * Copyright IBM Corp. 2026
 *
 * ViolationsTable - SLA violations detail table with expandable rows.
 * Shows alert ID, severity, device, expected/actual/excess times, and expanded details.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Tile,
  Button,
} from '@carbon/react';
import { Checkmark } from '@carbon/icons-react';

import { getSeverityTag, SEVERITY_CONFIG } from '@/shared/constants/severity';
import type { Severity } from '@/shared/types/common.types';

import '@/styles/pages/_violations-table.scss';

// ==========================================
// Types
// ==========================================

export interface SLAViolation {
  alert_id: string;
  title: string;
  severity: string;
  device: string;
  source_ip: string;
  category: string;
  timestamp: string;
  resolved_at: string;
  expected_minutes: number;
  expected_display: string;
  actual_minutes: number;
  actual_display: string;
  excess_minutes: number;
  excess_display: string;
  description: string;
  ai_summary: string;
  resolved_by: string;
}

// ==========================================
// Props
// ==========================================

export interface ViolationsTableProps {
  violations: SLAViolation[];
  selectedPeriodText: string;
  violationsPage: number;
  violationsPageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

// ==========================================
// Constants
// ==========================================

const VIOLATION_HEADERS = [
  { key: 'alert_id', header: 'Alert ID' },
  { key: 'severity', header: 'Severity' },
  { key: 'device', header: 'Device' },
  { key: 'expected', header: 'Expected Time' },
  { key: 'actual', header: 'Actual Time' },
  { key: 'excess', header: 'Excess' },
];

// ==========================================
// Component
// ==========================================

export const ViolationsTable = React.memo(function ViolationsTable({
  violations,
  selectedPeriodText,
  violationsPage,
  violationsPageSize,
  onPageChange,
}: ViolationsTableProps) {
  const navigate = useNavigate();

  const paginatedViolations = useMemo(() => {
    const start = (violationsPage - 1) * violationsPageSize;
    return violations.slice(start, start + violationsPageSize);
  }, [violations, violationsPage, violationsPageSize]);

  const violationTableRows = useMemo(() => {
    return paginatedViolations.map((v) => ({
      id: v.alert_id,
      alert_id: v.alert_id,
      severity: v.severity,
      device: v.device,
      expected: v.expected_display,
      actual: v.actual_display,
      excess: v.excess_display,
    }));
  }, [paginatedViolations]);

  // Violations summary (right column)
  const violationsSummary = useMemo(() => {
    if (violations.length === 0) return null;

    const bySev: Record<string, number> = {};
    violations.forEach((v) => {
      bySev[v.severity] = (bySev[v.severity] || 0) + 1;
    });
    const sorted = Object.entries(bySev).sort((a, b) => b[1] - a[1]);

    const worstOffender = violations.reduce((max, v) =>
      v.excess_minutes > max.excess_minutes ? v : max
    );

    return { sorted, worstOffender };
  }, [violations]);

  return (
    <>
      {/* Two-column: Summary + Violations Quick View */}
      <div className="violations-table__grid">
        {/* Violations Quick Summary */}
        <Tile className="violations-table__summary-tile">
          <div className="violations-table__section-header">
            <h3 className="violations-table__section-title">
              Violations Summary
            </h3>
            <p className="violations-table__section-subtitle">
              {violations.length} SLA violations in the {selectedPeriodText.toLowerCase()}
            </p>
          </div>

          {violations.length === 0 ? (
            <div className="violations-table__empty-state">
              <Checkmark size={48} className="violations-table__empty-icon" />
              <h4 className="violations-table__empty-title">
                All SLAs Met
              </h4>
              <p className="violations-table__empty-description">
                No SLA violations were recorded during this period. All alerts were resolved within their severity-based SLA thresholds.
              </p>
            </div>
          ) : (
            <div className="violations-table__severity-list">
              {/* Top violation severities */}
              {violationsSummary?.sorted.map(([sev, count]) => (
                <div
                  key={sev}
                  className="violations-table__severity-row"
                  style={{ '--severity-color': SEVERITY_CONFIG[sev as Severity]?.color || 'var(--cds-border-subtle)' } as React.CSSProperties}
                >
                  <div className="violations-table__severity-info">
                    {getSeverityTag(sev as Severity)}
                    <span className="violations-table__severity-label">
                      violations
                    </span>
                  </div>
                  <span className="violations-table__severity-count">
                    {count}
                  </span>
                </div>
              ))}

              {/* Worst offender */}
              {violationsSummary?.worstOffender && (
                <div className="violations-table__worst-offender">
                  <span className="violations-table__worst-label">Longest breach: </span>
                  <span className="violations-table__worst-value">
                    {violationsSummary.worstOffender.excess_display}
                  </span>
                  <span className="violations-table__worst-connector"> over SLA on </span>
                  <span className="violations-table__worst-device">
                    {violationsSummary.worstOffender.device}
                  </span>
                </div>
              )}
            </div>
          )}
        </Tile>
      </div>

      {/* SLA Violations Detail Table */}
      {violations.length > 0 && (
        <Tile className="violations-table__detail-tile">
          <div className="violations-table__section-header">
            <h3 className="violations-table__section-title">
              SLA Violations Detail
            </h3>
            <p className="violations-table__section-subtitle">
              Alerts where resolution time exceeded SLA threshold
            </p>
          </div>

          <DataTable rows={violationTableRows} headers={VIOLATION_HEADERS}>
            {({
              rows,
              headers,
              getTableProps,
              getHeaderProps,
              getRowProps,
              getExpandHeaderProps,
            }) => (
              <TableContainer aria-label="SLA violations with severity, device, and resolution times">
                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      <TableExpandHeader {...getExpandHeaderProps()} />
                      {headers.map((header) => {
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
                      const violation = paginatedViolations.find(
                        (v) => v.alert_id === row.id
                      );
                      if (!violation) return null;
                      const { key: rowKey, ...rowProps } = getRowProps({ row });

                      return (
                        <React.Fragment key={row.id}>
                          <TableExpandRow key={rowKey} {...rowProps}>
                            <TableCell>
                              <Button
                                kind="ghost"
                                size="sm"
                                className="violations-table__alert-link"
                                onClick={() => navigate(`/alerts/${violation.alert_id}`)}
                              >
                                {violation.alert_id}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {getSeverityTag(violation.severity as Severity)}
                            </TableCell>
                            <TableCell>
                              <span className="violations-table__device-text">{violation.device}</span>
                            </TableCell>
                            <TableCell>
                              <Tag type="gray" size="sm">
                                {violation.expected_display}
                              </Tag>
                            </TableCell>
                            <TableCell>
                              <span className="violations-table__actual-time">
                                {violation.actual_display}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Tag type="red" size="sm">
                                +{violation.excess_display}
                              </Tag>
                            </TableCell>
                          </TableExpandRow>

                          <TableExpandedRow colSpan={VIOLATION_HEADERS.length + 1}>
                            <div className="violations-table__expanded-grid">
                              <div>
                                <div className="violations-table__detail-label">
                                  Title
                                </div>
                                <div className="violations-table__detail-value violations-table__detail-value--bold">
                                  {violation.title}
                                </div>
                              </div>
                              <div>
                                <div className="violations-table__detail-label">
                                  Category
                                </div>
                                <div className="violations-table__detail-value">
                                  {violation.category || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="violations-table__detail-label">
                                  Description
                                </div>
                                <div className="violations-table__detail-value">
                                  {violation.description || violation.ai_summary || 'No description available'}
                                </div>
                              </div>
                              <div>
                                <div className="violations-table__detail-label">
                                  Resolved By
                                </div>
                                <div className="violations-table__detail-value">
                                  {violation.resolved_by || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="violations-table__detail-label">
                                  Alert Timestamp
                                </div>
                                <div className="violations-table__detail-value">
                                  {violation.timestamp ? new Date(violation.timestamp).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="violations-table__detail-label">
                                  Resolved At
                                </div>
                                <div className="violations-table__detail-value">
                                  {violation.resolved_at ? new Date(violation.resolved_at).toLocaleString() : 'N/A'}
                                </div>
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
            totalItems={violations.length}
            pageSize={violationsPageSize}
            pageSizes={[10, 20, 50]}
            page={violationsPage}
            onChange={({ page, pageSize }: { page: number; pageSize: number }) => {
              onPageChange(page, pageSize);
            }}
          />
        </Tile>
      )}
    </>
  );
});
