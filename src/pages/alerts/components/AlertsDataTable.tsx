/**
 * AlertsDataTable - DataTable with bulk actions, custom cell rendering, and pagination
 * for the Priority Alerts page.
 *
 * Renders the full Carbon DataTable with:
 * - Row selection and batch actions (acknowledge, resolve, dismiss)
 * - Custom cell rendering: severity tags, timestamp, device info, AI summary, status, confidence bar
 * - Empty state when no rows match filters
 * - Pagination footer
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
    TableSelectAll,
    TableSelectRow,
    TableBatchActions,
    TableBatchAction,
    TableToolbar,
    TableToolbarContent,
    Button,
    Pagination,
    ProgressBar,
} from '@carbon/react';
import {
    Checkmark,
    View,
    Close,
    CheckmarkFilled,
    WarningAlt,
} from '@carbon/icons-react';

import { getSeverityTag } from '@/shared/constants/severity';
import { getStatusTag } from '@/shared/constants/status';
import { getDeviceIcon } from '@/shared/constants/devices';
import type { PriorityAlert } from '@/features/alerts/types/alert.types';
import type { BulkActionType } from '@/features/alerts/services/alertService';
import { DataTableWrapper, EmptyState } from '@/components';
import { ALERT_TABLE_HEADERS } from './types';
import type { AlertTableRow } from './types';

// ==========================================
// Props
// ==========================================

export interface AlertsDataTableProps {
    /** Pre-mapped table rows for Carbon DataTable */
    tableRows: AlertTableRow[];
    /** The paginated alerts corresponding to tableRows (for custom cell rendering) */
    paginatedAlerts: PriorityAlert[];
    /** Total number of filtered alerts (for pagination) */
    filteredCount: number;
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Rows per page */
    pageSize: number;
    /** Whether a bulk action is in progress */
    isBulkActing: boolean;
    /** Navigate to alert detail */
    onNavigateToAlert: (alertId: string) => void;
    /** Acknowledge a single alert */
    onAcknowledgeAlert: (alertId: string) => void;
    /** Perform a bulk action on selected alert IDs */
    onBulkAction: (action: BulkActionType, selectedIds: string[]) => void;
    /** Pagination change handler */
    onPaginationChange: (page: number, pageSize: number) => void;
}

// ==========================================
// Component
// ==========================================

export const AlertsDataTable = React.memo(function AlertsDataTable({
    tableRows,
    paginatedAlerts,
    filteredCount,
    currentPage,
    pageSize,
    isBulkActing,
    onNavigateToAlert,
    onAcknowledgeAlert,
    onBulkAction,
    onPaginationChange,
}: AlertsDataTableProps) {
    return (
        <DataTableWrapper
            title="Priority Alerts"
            showFilter={false}
            showRefresh={false}
        >
            <DataTable rows={tableRows} headers={ALERT_TABLE_HEADERS}>
                {({
                    rows,
                    headers: dtHeaders,
                    getTableProps,
                    getHeaderProps,
                    getRowProps,
                    getSelectionProps,
                    getToolbarProps,
                    getBatchActionProps,
                    selectedRows,
                }) => {
                    const batchActionProps = getBatchActionProps();
                    const selectedIds = selectedRows.map((r: { id: string }) => r.id);

                    return (
                        <TableContainer aria-label="Priority alerts with severity, device, and status">
                            <TableToolbar {...getToolbarProps()}>
                                <TableBatchActions {...batchActionProps}>
                                    <TableBatchAction
                                        tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                        renderIcon={Checkmark}
                                        onClick={() => onBulkAction('acknowledge', selectedIds)}
                                        disabled={isBulkActing}
                                    >
                                        Acknowledge Selected
                                    </TableBatchAction>
                                    <TableBatchAction
                                        tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                        renderIcon={CheckmarkFilled}
                                        onClick={() => onBulkAction('resolve', selectedIds)}
                                        disabled={isBulkActing}
                                    >
                                        Resolve Selected
                                    </TableBatchAction>
                                    <TableBatchAction
                                        tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                        renderIcon={Close}
                                        onClick={() => onBulkAction('dismiss', selectedIds)}
                                        disabled={isBulkActing}
                                    >
                                        Dismiss Selected
                                    </TableBatchAction>
                                </TableBatchActions>
                                <TableToolbarContent>
                                    {/* Toolbar content area - left empty, filter is above */}
                                </TableToolbarContent>
                            </TableToolbar>
                            <Table {...getTableProps()}>
                                <TableHead>
                                    <TableRow>
                                        <TableSelectAll {...getSelectionProps()} />
                                        {dtHeaders.map((header) => {
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
                                            <TableCell colSpan={ALERT_TABLE_HEADERS.length + 1}>
                                                <EmptyState
                                                    icon={WarningAlt}
                                                    title="No alerts found"
                                                    description="No alerts match the current filters. Try adjusting your search criteria or clearing filters."
                                                    size="sm"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : rows.map((row) => {
                                        const alert = paginatedAlerts.find((a) => a.id === row.id);
                                        if (!alert) return null;
                                        const { key: rowKey, ...rowProps } = getRowProps({ row });

                                        return (
                                            <TableRow key={rowKey} {...rowProps}>
                                                <TableSelectRow {...getSelectionProps({ row })} />
                                                <TableCell>
                                                    {getSeverityTag(alert.severity)}
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className="timestamp-cell u-clickable"
                                                        onClick={() => onNavigateToAlert(alert.id)}
                                                        role="link"
                                                        tabIndex={0}
                                                        aria-label={`View alert ${alert.id} details`}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') onNavigateToAlert(alert.id);
                                                        }}
                                                    >
                                                        <div className="timestamp-relative">
                                                            {(() => {
                                                                const v = typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative ?? alert.timestamp?.absolute ?? 'N/A';
                                                                return typeof v === 'object' ? JSON.stringify(v) : v;
                                                            })()}
                                                        </div>
                                                        <div className="timestamp-absolute">
                                                            {(() => {
                                                                const v = typeof alert.timestamp === 'string' ? '' : alert.timestamp?.absolute || '';
                                                                return typeof v === 'object' ? JSON.stringify(v) : v;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="device-cell">
                                                        {getDeviceIcon(alert.device?.icon || 'server')}
                                                        <div className="device-info">
                                                            <div className="device-name">{alert.device?.name || 'Unknown'}</div>
                                                            <div className="device-ip">{alert.device?.ip || ''}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="summary-cell">
                                                        <div className="summary-title">{alert.aiTitle}</div>
                                                        <div className="summary-text">{alert.aiSummary}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusTag(alert.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="confidence-cell">
                                                        <ProgressBar
                                                            label={`${alert.confidence}% confidence`}
                                                            value={alert.confidence}
                                                            max={100}
                                                            hideLabel
                                                            size="small"
                                                        />
                                                        <span className="confidence-value">{alert.confidence}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                    <div className="actions-cell">
                                                        <Button
                                                            kind="ghost"
                                                            size="sm"
                                                            renderIcon={View}
                                                            hasIconOnly
                                                            iconDescription="View Details"
                                                            onClick={() => onNavigateToAlert(alert.id)}
                                                        />
                                                        <Button
                                                            kind="ghost"
                                                            size="sm"
                                                            renderIcon={Checkmark}
                                                            hasIconOnly
                                                            iconDescription="Acknowledge"
                                                            onClick={() => onAcknowledgeAlert(alert.id)}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    );
                }}
            </DataTable>

            <Pagination
                totalItems={filteredCount}
                pageSize={pageSize}
                pageSizes={[10, 20, 50, 100]}
                page={currentPage}
                onChange={({ page, pageSize }: { page: number; pageSize: number }) => {
                    onPaginationChange(page, pageSize);
                }}
            />
        </DataTableWrapper>
    );
});
