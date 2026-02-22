/**
 * Copyright IBM Corp. 2026
 *
 * ComplianceBySeverityTable - SLA compliance breakdown per severity level.
 * Shows severity tag, SLA target, met/violated counts, and progress bar.
 */

import React, { useMemo } from 'react';
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
  ProgressBar,
} from '@carbon/react';

import { getSeverityTag } from '@/shared/constants/severity';
import type { Severity } from '@/shared/types/common.types';

import '@/styles/pages/_compliance-table.scss';

// ==========================================
// Types
// ==========================================

export interface SeverityBreakdown {
  severity: string;
  sla_target: string;
  total: number;
  met: number;
  violated: number;
  compliance_percent: number;
}

// ==========================================
// Props
// ==========================================

export interface ComplianceBySeverityTableProps {
  bySeverity: SeverityBreakdown[];
}

// ==========================================
// Constants
// ==========================================

const SEVERITY_TABLE_HEADERS = [
  { key: 'severity', header: 'Severity' },
  { key: 'sla_target', header: 'SLA Target' },
  { key: 'met', header: 'Met' },
  { key: 'violated', header: 'Violated' },
  { key: 'compliance', header: 'Compliance %' },
];

// ==========================================
// Component
// ==========================================

export const ComplianceBySeverityTable = React.memo(function ComplianceBySeverityTable({
  bySeverity,
}: ComplianceBySeverityTableProps) {
  const severityTableRows = useMemo(() => {
    return bySeverity
      .filter((s) => s.total > 0)
      .map((s) => ({
        id: s.severity,
        severity: s.severity,
        sla_target: s.sla_target,
        met: s.met,
        violated: s.violated,
        compliance: s.compliance_percent,
      }));
  }, [bySeverity]);

  return (
    <Tile className="compliance-tile">
      <div className="compliance-tile__header">
        <h3 className="compliance-tile__title">
          Compliance by Severity
        </h3>
        <p className="compliance-tile__description">
          SLA performance breakdown per severity level
        </p>
      </div>

      <DataTable rows={severityTableRows} headers={SEVERITY_TABLE_HEADERS}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer aria-label="SLA compliance breakdown by severity level">
            <Table {...getTableProps()} size="lg">
              <TableHead>
                <TableRow>
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
                  const sevData = bySeverity.find(
                    (s) => s.severity === row.id
                  );
                  if (!sevData) return null;
                  const { key: rowKey, ...rowProps } = getRowProps({ row });

                  return (
                    <TableRow key={rowKey} {...rowProps}>
                      <TableCell>
                        {getSeverityTag(sevData.severity as Severity)}
                      </TableCell>
                      <TableCell>
                        <Tag type="gray" size="sm">
                          {sevData.sla_target}
                        </Tag>
                      </TableCell>
                      <TableCell>
                        <span className="compliance-table__met-value">
                          {sevData.met}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`compliance-table__violated-value ${sevData.violated > 0 ? 'compliance-table__violated-value--active' : ''}`}>
                          {sevData.violated}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="compliance-table__compliance-cell">
                          <ProgressBar
                            label={`${sevData.compliance_percent}%`}
                            value={sevData.compliance_percent}
                            max={100}
                            hideLabel
                            size="small"
                          />
                          <span
                            className={`compliance-table__percent-label compliance-table__percent-label--${sevData.compliance_percent >= 99.9 ? 'excellent' : sevData.compliance_percent >= 95 ? 'good' : sevData.compliance_percent >= 90 ? 'fair' : 'poor'}`}
                          >
                            {sevData.compliance_percent}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {severityTableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={SEVERITY_TABLE_HEADERS.length}>
                      <div className="compliance-table__empty-row">
                        No severity data available
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </Tile>
  );
});
