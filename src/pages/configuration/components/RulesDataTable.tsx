/**
 * Rules DataTable
 *
 * Expandable DataTable showing all threshold rules with toggle, name,
 * condition, severity, and overflow-menu actions. Shows a skeleton while loading.
 */

import React from 'react';
import {
  Button,
  Toggle,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  DataTableSkeleton,
  OverflowMenu,
  OverflowMenuItem,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
} from '@carbon/react';
import { Add, Upload } from '@carbon/icons-react';

import type { Rule } from '../types';
import { RULES_HEADERS, parseCondition, getSeverityTag } from '../types';

interface RulesDataTableProps {
  /** List of threshold rules */
  rules: Rule[];
  /** Whether data is still loading */
  loading: boolean;
  /** Callback when "New Rule" is clicked */
  onNewRule: () => void;
  /** Callback when "Edit rule" is clicked */
  onEditRule: (rule: Rule) => void;
  /** Callback when "Duplicate" is clicked */
  onDuplicateRule: (rule: Rule) => void;
  /** Callback when "Delete" is clicked */
  onDeleteRule: (rule: Rule) => void;
  /** Callback when a rule toggle is changed */
  onToggleRule: (id: string) => void;
  /** Callback for import button (placeholder) */
  onImport: () => void;
}

export const RulesDataTable = React.memo(function RulesDataTable({
  rules,
  loading,
  onNewRule,
  onEditRule,
  onDuplicateRule,
  onDeleteRule,
  onToggleRule,
  onImport,
}: RulesDataTableProps) {
  if (loading) {
    return (
      <DataTableSkeleton headers={RULES_HEADERS} columnCount={5} rowCount={5} showHeader showToolbar />
    );
  }

  return (
    <DataTable rows={rules} headers={RULES_HEADERS} isSortable>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
        <TableContainer title="Threshold Rules" description="Manage your alert threshold rules">
          <TableToolbar>
            <TableToolbarContent>
              <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
              <Button kind="secondary" size="md" renderIcon={Upload} onClick={onImport}>Import</Button>
              <Button kind="primary" size="md" renderIcon={Add} onClick={onNewRule}>New Rule</Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                <TableExpandHeader />
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
                const rule = rules.find((r) => r.id === row.id);
                if (!rule) return null;
                const { key: _rowKey, ...rowProps } = getRowProps({ row });
                return (
                  <React.Fragment key={row.id}>
                    <TableExpandRow {...rowProps}>
                      <TableCell>
                        <Toggle
                          id={`toggle-${rule.id}`}
                          size="sm"
                          toggled={rule.enabled}
                          onToggle={() => onToggleRule(rule.id)}
                          labelA="Disabled" labelB="Enabled" hideLabel
                          aria-label={`Toggle rule ${rule.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="threshold-rules__rule-name">
                          <span className="threshold-rules__rule-name-text">{rule.name}</span>
                          <span className="threshold-rules__rule-description-text">{rule.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="threshold-rules__condition-code">{rule.condition}</div>
                      </TableCell>
                      <TableCell>{getSeverityTag(rule.severity)}</TableCell>
                      <TableCell>
                        <OverflowMenu flipped size="sm" ariaLabel="Actions">
                          <OverflowMenuItem itemText="Edit rule" onClick={() => onEditRule(rule)} />
                          <OverflowMenuItem itemText="Duplicate" onClick={() => onDuplicateRule(rule)} />
                          <OverflowMenuItem isDelete itemText="Delete" onClick={() => onDeleteRule(rule)} />
                        </OverflowMenu>
                      </TableCell>
                    </TableExpandRow>
                    <TableExpandedRow colSpan={headers.length + 1}>
                      {(() => {
                        const cond = parseCondition(rule.condition);
                        return (
                          <div className="threshold-rules__expanded-content">
                            <div className="threshold-rules__expanded-grid">
                              <div>
                                <label className="threshold-rules__expanded-label">Metric</label>
                                <div className="threshold-rules__expanded-value">
                                  {cond.metric}
                                </div>
                              </div>
                              <div>
                                <label className="threshold-rules__expanded-label">Operator / Threshold</label>
                                <div className="threshold-rules__expanded-value">
                                  {cond.operator} {cond.value}
                                </div>
                              </div>
                              <div>
                                <label className="threshold-rules__expanded-label">Severity</label>
                                <div className="threshold-rules__expanded-severity">
                                  {getSeverityTag(rule.severity)}
                                </div>
                              </div>
                            </div>
                            <div className="threshold-rules__expanded-actions">
                              <Button kind="ghost" size="sm" onClick={() => onEditRule(rule)}>Edit Rule</Button>
                            </div>
                          </div>
                        );
                      })()}
                    </TableExpandedRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
});
