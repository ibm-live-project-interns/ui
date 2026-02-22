/**
 * ConnectionsTable
 *
 * Displays network connections in a Carbon DataTable with pagination,
 * utilization progress bars, and status tags. Shows EmptyState when
 * no connections match filters. Extracted from TopologyPage.
 */

import React, { useState, useMemo } from 'react';
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
    Pagination,
    ProgressBar,
} from '@carbon/react';
import { ArrowRight, ConnectionSignal } from '@carbon/icons-react';

import { DataTableWrapper, EmptyState } from '@/components';
import type { TopologyNode, TopologyEdge } from '../types';
import {
    CONNECTION_HEADERS,
    STATUS_TAG_TYPES,
    getStatusIcon,
    getNodeLabel,
} from '../types';

interface ConnectionsTableProps {
    edges: TopologyEdge[];
    nodes: TopologyNode[];
    hasActiveFilters: boolean;
}

export const ConnectionsTable = React.memo(function ConnectionsTable({ edges, nodes, hasActiveFilters }: ConnectionsTableProps) {
    const [connPage, setConnPage] = useState(1);
    const [connPageSize, setConnPageSize] = useState(10);

    // Sort edges by utilization descending to show overloaded links first
    const sortedEdges = useMemo(() => {
        return [...edges].sort((a, b) => b.utilization - a.utilization);
    }, [edges]);

    // Paginate connections
    const paginatedEdges = useMemo(() => {
        const start = (connPage - 1) * connPageSize;
        return sortedEdges.slice(start, start + connPageSize);
    }, [sortedEdges, connPage, connPageSize]);

    // Connection table rows (must have primitive values for DataTable)
    const connectionRows = useMemo(() =>
        paginatedEdges.map((edge, index) => ({
            id: `${edge.source}-${edge.target}-${index}`,
            source: getNodeLabel(edge.source, nodes),
            target: getNodeLabel(edge.target, nodes),
            bandwidth: edge.bandwidth,
            utilization: edge.utilization,
            status: edge.status,
        })),
        [paginatedEdges, nodes]
    );

    return (
        <section className="topology-page__connections" aria-label="Network connections">
            <DataTableWrapper title="Connections" showFilter={false} showRefresh={false}>
                {sortedEdges.length === 0 ? (
                    <EmptyState
                        size="sm"
                        icon={ConnectionSignal}
                        title={hasActiveFilters ? 'No connections match filters' : 'No connections found'}
                        description={
                            hasActiveFilters
                                ? 'Try adjusting your filters to see connections.'
                                : 'No network connections are available. Ensure the backend is running.'
                        }
                    />
                ) : (
                    <>
                        <DataTable rows={connectionRows} headers={CONNECTION_HEADERS}>
                            {({ rows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                                <TableContainer aria-label="Network topology connections">
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
                                            {rows.map((row) => {
                                                const rowIndex = connectionRows.findIndex((r) => r.id === row.id);
                                                const rowData = rowIndex >= 0 ? connectionRows[rowIndex] : null;
                                                const edgeData = rowIndex >= 0 ? paginatedEdges[rowIndex] : null;
                                                const { key: rowKey, ...rowProps } = getRowProps({ row });

                                                return (
                                                    <TableRow key={rowKey} {...rowProps}>
                                                        <TableCell>
                                                            <div className="topology-page__conn-endpoint">
                                                                {rowData?.source || '--'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="topology-page__conn-endpoint">
                                                                <ArrowRight size={12} className="u-icon-inline" />
                                                                {rowData?.target || '--'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {edgeData?.bandwidth || '--'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {edgeData ? (
                                                                <div className="topology-page__utilization-cell">
                                                                    <ProgressBar
                                                                        value={edgeData.utilization}
                                                                        max={100}
                                                                        size="small"
                                                                        label=""
                                                                        hideLabel
                                                                        status={edgeData.utilization >= 80 ? 'error' : 'active'}
                                                                    />
                                                                    <span
                                                                        className={`topology-page__utilization-value topology-page__utilization-value--${edgeData.utilization >= 80 ? 'critical' : edgeData.utilization >= 60 ? 'warning' : 'normal'}`}
                                                                    >
                                                                        {edgeData.utilization.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            ) : '--'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {edgeData ? (
                                                                <Tag
                                                                    type={STATUS_TAG_TYPES[edgeData.status] || 'warm-gray'}
                                                                    size="sm"
                                                                    renderIcon={getStatusIcon(edgeData.status)}
                                                                >
                                                                    {edgeData.status.charAt(0).toUpperCase() + edgeData.status.slice(1)}
                                                                </Tag>
                                                            ) : '--'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </DataTable>

                        <Pagination
                            totalItems={sortedEdges.length}
                            pageSize={connPageSize}
                            pageSizes={[10, 25, 50]}
                            page={connPage}
                            onChange={({ page, pageSize: newPageSize }: { page: number; pageSize: number }) => {
                                setConnPage(page);
                                setConnPageSize(newPageSize);
                            }}
                        />
                    </>
                )}
            </DataTableWrapper>
        </section>
    );
});
