/**
 * Copyright IBM Corp. 2026
 *
 * Network Topology Page
 *
 * Thin shell that manages shared data fetching and filter state,
 * then delegates rendering to TopologyVisualization and ConnectionsTable
 * sub-components. Each sub-component is under 200 LOC.
 */

import { useState, useMemo } from 'react';
import {
    Tile,
    SkeletonText,
    DataTableSkeleton,
} from '@carbon/react';
import {
    Network_2 as Network2,
    Renew,
    ConnectionSignal,
    CheckmarkFilled,
    ErrorFilled,
} from '@carbon/icons-react';

import { KPICard, PageHeader, DataTableWrapper } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';
import { PageLayout } from '@/components/layout/PageLayout';
import { logger } from '@/shared/utils/logger';
import { useFetchData } from '@/shared/hooks';

import type { TopologyNode, TopologyEdge, FilterOption } from './types';
import {
    topologyService,
    LOCATION_FILTER_OPTIONS,
    TYPE_FILTER_OPTIONS,
    STATUS_FILTER_OPTIONS,
} from './types';
import { TopologyVisualization, ConnectionsTable } from './components';

import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_topology.scss';
import { InlineNotification } from '@carbon/react';

// ==========================================
// Main Component
// ==========================================

export function TopologyPage() {
    // Data fetching
    const { data: topoData, isLoading, error: topoError, refetch: fetchTopology } = useFetchData(
        async (_signal) => {
            const response = await topologyService.getTopology();
            return {
                nodes: (response.nodes || []) as TopologyNode[],
                edges: (response.edges || []) as TopologyEdge[],
                locations: (response.locations || []) as string[],
            };
        },
        [],
        { onError: (err) => logger.error('Failed to fetch topology', err) }
    );

    const nodes = topoData?.nodes ?? [];
    const edges = topoData?.edges ?? [];
    const locations = topoData?.locations ?? [];

    // Interaction state
    const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

    // Filter state
    const [selectedLocation, setSelectedLocation] = useState<FilterOption>(LOCATION_FILTER_OPTIONS[0]);
    const [selectedType, setSelectedType] = useState<FilterOption>(TYPE_FILTER_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState<FilterOption>(STATUS_FILTER_OPTIONS[0]);

    // Filtered nodes
    const filteredNodes = useMemo(() => {
        return nodes.filter((node) => {
            if (selectedLocation.id !== 'all' && node.location !== selectedLocation.id) return false;
            if (selectedType.id !== 'all' && node.type !== selectedType.id) return false;
            if (selectedStatus.id !== 'all' && node.status !== selectedStatus.id) return false;
            return true;
        });
    }, [nodes, selectedLocation, selectedType, selectedStatus]);

    // Group filtered nodes by location
    const nodesByLocation = useMemo(() => {
        const grouped: Record<string, TopologyNode[]> = {};
        for (const node of filteredNodes) {
            if (!grouped[node.location]) grouped[node.location] = [];
            grouped[node.location].push(node);
        }
        return grouped;
    }, [filteredNodes]);

    // Filtered edges (both endpoints must be in filteredNodes)
    const filteredEdgeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
    const filteredEdges = useMemo(() => {
        return edges.filter(
            (edge) => filteredEdgeNodeIds.has(edge.source) && filteredEdgeNodeIds.has(edge.target)
        );
    }, [edges, filteredEdgeNodeIds]);

    // KPI data
    const kpiData = useMemo((): KPICardProps[] => {
        const totalDevices = filteredNodes.length;
        const onlineDevices = filteredNodes.filter((n) => n.status === 'online').length;
        const offlineDevices = filteredNodes.filter((n) => n.status === 'offline').length;
        const activeConnections = filteredEdges.filter((e) => e.status === 'active').length;

        return [
            {
                id: 'total-devices',
                label: 'Total Devices',
                value: totalDevices,
                icon: Network2,
                iconColor: 'var(--cds-interactive, #0f62fe)',
                severity: 'info' as const,
                subtitle: `${locations.length} location${locations.length !== 1 ? 's' : ''}`,
            },
            {
                id: 'online-devices',
                label: 'Online',
                value: onlineDevices,
                icon: CheckmarkFilled,
                iconColor: 'var(--cds-support-success, #24a148)',
                severity: 'success' as const,
                subtitle: totalDevices > 0 ? `${Math.round((onlineDevices / totalDevices) * 100)}% of fleet` : 'No devices',
            },
            {
                id: 'offline-devices',
                label: 'Offline',
                value: offlineDevices,
                icon: ErrorFilled,
                iconColor: 'var(--cds-support-error, #da1e28)',
                severity: offlineDevices > 0 ? 'critical' as const : 'success' as const,
                subtitle: offlineDevices > 0 ? 'Requires attention' : 'All systems operational',
            },
            {
                id: 'active-connections',
                label: 'Active Connections',
                value: activeConnections,
                icon: ConnectionSignal,
                iconColor: 'var(--cds-support-info, #8a3ffc)',
                severity: 'neutral' as const,
                subtitle: `${filteredEdges.length} total links`,
            },
        ];
    }, [filteredNodes, filteredEdges, locations]);

    const hasActiveFilters =
        selectedLocation.id !== 'all' ||
        selectedType.id !== 'all' ||
        selectedStatus.id !== 'all';

    const clearFilters = () => {
        setSelectedLocation(LOCATION_FILTER_OPTIONS[0]);
        setSelectedType(TYPE_FILTER_OPTIONS[0]);
        setSelectedStatus(STATUS_FILTER_OPTIONS[0]);
        setSelectedNode(null);
    };

    // Loading skeleton
    if (isLoading && nodes.length === 0) {
        return (
            <PageLayout className="topology-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Infrastructure', href: '/devices' },
                        { label: 'Network Topology', active: true },
                    ]}
                    title="Network Topology"
                    subtitle="Visual overview of network devices and their interconnections"
                    showBorder
                    actions={[{ label: 'Refresh', onClick: () => {}, variant: 'primary', icon: Renew, disabled: true }]}
                />
                <div className="topology-page__content">
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                                <SkeletonText width="80%" />
                            </Tile>
                        ))}
                    </div>
                    <DataTableWrapper title="Connections" showFilter={false} showRefresh={false}>
                        <DataTableSkeleton columnCount={5} rowCount={8} showHeader={false} showToolbar={false} />
                    </DataTableWrapper>
                </div>
                </PageLayout>
        );
    }

    return (
        <PageLayout className="topology-page">
            <PageHeader
                breadcrumbs={[
                    { label: 'Infrastructure', href: '/devices' },
                    { label: 'Network Topology', active: true },
                ]}
                title="Network Topology"
                subtitle="Visual overview of network devices and their interconnections"
                showBorder
                actions={[{ label: 'Refresh', onClick: fetchTopology, variant: 'primary', icon: Renew }]}
            />

            <div className="topology-page__content">
                {topoError && (
                    <InlineNotification
                        kind="error"
                        title="Failed to load topology"
                        subtitle={topoError}
                        lowContrast
                        hideCloseButton
                    />
                )}

                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Visualization: Filters + Device Map */}
                <TopologyVisualization
                    nodesByLocation={nodesByLocation}
                    selectedNode={selectedNode}
                    onSelectNode={setSelectedNode}
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationChange={setSelectedLocation}
                    selectedType={selectedType}
                    onTypeChange={setSelectedType}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                />

                {/* Connections Table */}
                <ConnectionsTable
                    edges={filteredEdges}
                    nodes={nodes}
                    hasActiveFilters={hasActiveFilters}
                />
            </div>

        </PageLayout>
    );
}

export default TopologyPage;
