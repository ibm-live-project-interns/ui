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

// ==========================================
// Inline Styles
// ==========================================
const topologyStyles = `
.topology-page { display: flex; flex-direction: column; min-height: 100%; }
.topology-page__content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.topology-page__filters { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
.topology-page__filters .cds--dropdown__wrapper { min-width: 180px; }
.topology-page__clear-filters { white-space: nowrap; }
.topology-page__section-title { font-size: 1rem; font-weight: 600; color: var(--cds-text-primary, #f4f4f4); margin-bottom: 1rem; }
.topology-page__location-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1rem; }
@media (max-width: 672px) { .topology-page__location-grid { grid-template-columns: 1fr; } }
.topology-page__location-tile { padding: 1rem !important; background: var(--cds-layer-01, #262626) !important; border-left: 3px solid var(--cds-border-interactive, #4589ff); }
.topology-page__location-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--cds-border-subtle, #393939); }
.topology-page__location-title { display: flex; align-items: center; gap: 0.5rem; }
.topology-page__location-title h4 { font-size: 0.875rem; font-weight: 600; color: var(--cds-text-primary, #f4f4f4); margin: 0; }
.topology-page__location-stats { display: flex; gap: 0.75rem; font-size: 0.75rem; }
.topology-page__location-stat { display: flex; align-items: center; gap: 0.25rem; }
.topology-page__location-stat--online { color: var(--cds-support-success, #24a148); }
.topology-page__location-stat--warning { color: var(--cds-support-warning, #f1c21b); }
.topology-page__location-stat--offline { color: var(--cds-support-error, #da1e28); }
.topology-page__device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 0.5rem; }
.topology-page__device-card { padding: 0.75rem !important; min-height: auto !important; background: var(--cds-layer-02, #393939) !important; border: 1px solid transparent; transition: border-color 0.15s ease, box-shadow 0.15s ease; cursor: pointer; position: relative; }
.topology-page__device-card:hover { border-color: var(--cds-border-interactive, #4589ff); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); }
.topology-page__device-card--offline { opacity: 0.65; }
.topology-page__device-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.topology-page__device-card-icon { display: flex; align-items: center; }
.topology-page__device-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.topology-page__device-card-body { display: flex; flex-direction: column; gap: 0.125rem; }
.topology-page__device-card-name { font-size: 0.8125rem; font-weight: 600; color: var(--cds-text-primary, #f4f4f4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.topology-page__device-card-meta { font-size: 0.6875rem; color: var(--cds-text-secondary, #c6c6c6); text-transform: uppercase; letter-spacing: 0.02em; }
.topology-page__device-card-ip { font-size: 0.6875rem; font-family: 'IBM Plex Mono', monospace; color: var(--cds-text-helper, #8d8d8d); }
.topology-page__device-popover { min-width: 260px; }
.topology-page__device-popover-inner { padding: 0.75rem; }
.topology-page__device-popover-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--cds-border-subtle, #393939); }
.topology-page__device-popover-header strong { flex: 1; font-size: 0.875rem; color: var(--cds-text-primary, #f4f4f4); }
.topology-page__device-popover-close { flex-shrink: 0; }
.topology-page__device-popover-details { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; }
.topology-page__device-popover-details > div { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.topology-page__device-popover-details dt { font-size: 0.75rem; color: var(--cds-text-secondary, #c6c6c6); white-space: nowrap; }
.topology-page__device-popover-details dd { font-size: 0.8125rem; color: var(--cds-text-primary, #f4f4f4); text-align: right; margin: 0; }
.topology-page__device-popover-details code { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; }
.topology-page__empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem !important; text-align: center; color: var(--cds-text-secondary, #c6c6c6); gap: 1rem; }
.topology-page__empty-state p { max-width: 400px; font-size: 0.875rem; }
.topology-page__connections { margin-top: 0.5rem; }
.topology-page__conn-endpoint { display: flex; align-items: center; font-size: 0.8125rem; color: var(--cds-text-primary, #f4f4f4); }
.topology-page__utilization-cell { display: flex; align-items: center; gap: 0.75rem; min-width: 160px; }
.topology-page__utilization-cell .cds--progress-bar { flex: 1; min-width: 80px; }
.topology-page__utilization-value { font-size: 0.75rem; font-weight: 600; font-family: 'IBM Plex Mono', monospace; white-space: nowrap; min-width: 45px; text-align: right; }
`;

// ==========================================
// Main Component
// ==========================================

export function TopologyPage() {
    // Data fetching
    const { data: topoData, isLoading, refetch: fetchTopology } = useFetchData(
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
                <style>{topologyStyles}</style>
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

            <style>{topologyStyles}</style>
        </PageLayout>
    );
}

export default TopologyPage;
