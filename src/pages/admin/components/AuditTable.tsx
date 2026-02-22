/**
 * AuditTable - DataTable with custom cell rendering for the Audit Log page.
 * Renders audit log entries with action tags, result tags, clickable resource links.
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
    Pagination,
} from '@carbon/react';
import { Activity } from '@carbon/icons-react';
import { DataTableWrapper, EmptyState } from '@/components';

import type { AuditLogEntry } from './audit-log.types';
import {
    formatTimestamp,
    formatDetails,
    getActionTag,
    getResourceLabel,
    getResourceLink,
    getResultTag,
} from './audit-log.types';

interface AuditTableProps {
    auditLogs: AuditLogEntry[];
    totalLogs: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

const HEADERS = [
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'username', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'resource', header: 'Resource' },
    { key: 'details', header: 'Details' },
    { key: 'ip_address', header: 'IP Address' },
    { key: 'result', header: 'Result' },
];

export const AuditTable = React.memo(function AuditTable({
    auditLogs,
    totalLogs,
    currentPage,
    pageSize,
    onPageChange,
    hasActiveFilters,
    onClearFilters,
}: AuditTableProps) {
    const navigate = useNavigate();

    // Transform audit logs to DataTable-compatible rows (primitive values)
    const tableRows = useMemo(() =>
        auditLogs.map((log) => ({
            id: String(log.id),
            timestamp: formatTimestamp(log.created_at),
            username: log.username,
            action: log.action,
            resource: `${getResourceLabel(log.resource)}${log.resource_id ? ` #${log.resource_id}` : ''}`,
            details: formatDetails(log.details),
            ip_address: log.ip_address || '--',
            result: log.result,
        })),
        [auditLogs]
    );

    return (
        <DataTableWrapper
            title="Activity Log"
            showFilter={false}
            showRefresh={false}
        >
            <DataTable rows={tableRows} headers={HEADERS}>
                {({ rows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                    <TableContainer aria-label="Audit log entries with user actions and timestamps">
                        <Table {...getTableProps()}>
                            <TableHead>
                                <TableRow>
                                    {tableHeaders.map((header) => {
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
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={HEADERS.length}>
                                            <EmptyState
                                                icon={Activity}
                                                title={hasActiveFilters
                                                    ? 'No matching entries'
                                                    : 'No audit log entries'}
                                                description={hasActiveFilters
                                                    ? 'No audit log entries match the current filters. Try adjusting your search or filter criteria.'
                                                    : 'No audit log entries have been recorded yet.'}
                                                size="sm"
                                                action={hasActiveFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => {
                                        const log = auditLogs.find((l) => String(l.id) === row.id);
                                        if (!log) return null;
                                        const { key: rowKey, ...rowProps } = getRowProps({ row });

                                        return (
                                            <TableRow key={rowKey} {...rowProps}>
                                                <TableCell>
                                                    <div className="audit-log-page__timestamp">
                                                        {formatTimestamp(log.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="audit-log-page__user">
                                                        <span className="audit-log-page__username">
                                                            {log.username}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getActionTag(log.action)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="audit-log-page__resource">
                                                        <span className="audit-log-page__resource-type">
                                                            {getResourceLabel(log.resource)}
                                                        </span>
                                                        {log.resource_id && (() => {
                                                            const link = getResourceLink(log.resource, log.resource_id);
                                                            return link ? (
                                                                <span
                                                                    className="audit-log-page__resource-id u-link-text"
                                                                    role="link"
                                                                    tabIndex={0}
                                                                    onClick={() => navigate(link)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(link); }}
                                                                >
                                                                    #{log.resource_id}
                                                                </span>
                                                            ) : (
                                                                <span className="audit-log-page__resource-id">
                                                                    #{log.resource_id}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className="audit-log-page__details"
                                                        title={formatDetails(log.details)}
                                                    >
                                                        {formatDetails(log.details)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="audit-log-page__ip">
                                                        {log.ip_address || '--'}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    {getResultTag(log.result)}
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

            <Pagination
                totalItems={totalLogs}
                pageSize={pageSize}
                pageSizes={[10, 25, 50, 100]}
                page={currentPage}
                onChange={({ page, pageSize: newPageSize }: { page: number; pageSize: number }) => {
                    onPageChange(page, newPageSize);
                }}
            />
        </DataTableWrapper>
    );
});

export default AuditTable;
