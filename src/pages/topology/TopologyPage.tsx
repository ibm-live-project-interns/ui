/**
 * Copyright IBM Corp. 2026
 *
 * Network Topology Page
 * Displays a visual representation of the network topology organized by location.
 * Devices are shown as cards grouped in location tiles. A connections table shows
 * all links with bandwidth, utilization, and status.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
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
    ClickableTile,
    Pagination,
    ProgressBar,
    DataTableSkeleton,
    SkeletonText,
    Dropdown,
    Popover,
    PopoverContent,
    Button,
} from '@carbon/react';
import {
    Router,
    Network_2 as Network2,
    Security,
    ServerDns,
    WifiSecure,
    Renew,
    ConnectionSignal,
    LocationStar,
    CircleFilled,
    ArrowRight,
    Close,
    Warning,
    CheckmarkFilled,
    ErrorFilled,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader, DataTableWrapper } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';

// Config
import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';

// Styles
import '@/styles/components/_kpi-card.scss';

// ==========================================
// Types
// ==========================================

interface TopologyNode {
    id: string;
    label: string;
    type: 'router' | 'switch' | 'firewall' | 'server' | 'access-point';
    status: 'online' | 'offline' | 'warning';
    ip: string;
    location: string;
}

interface TopologyEdge {
    source: string;
    target: string;
    bandwidth: string;
    utilization: number;
    status: 'active' | 'degraded' | 'down';
}

interface TopologyResponse {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
    locations: string[];
}

interface FilterOption {
    id: string;
    text: string;
}

// ==========================================
// Topology API Service (inline, follows AuditLogPage pattern)
// ==========================================

class TopologyService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'TopologyService');
    }

    async getTopology(): Promise<TopologyResponse> {
        try {
            return await this.get<TopologyResponse>('/topology');
        } catch (error) {
            console.warn('[TopologyService] GET /topology not available, returning empty:', error);
            return {
                nodes: [],
                edges: [],
                locations: [],
            };
        }
    }
}

const topologyService = new TopologyService();

// ==========================================
// Constants & Helpers
// ==========================================

const DEVICE_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    router: Router,
    switch: Network2,
    firewall: Security,
    server: ServerDns,
    'access-point': WifiSecure,
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
    router: 'Router',
    switch: 'Switch',
    firewall: 'Firewall',
    server: 'Server',
    'access-point': 'Access Point',
};

const STATUS_COLORS: Record<string, string> = {
    online: '#24a148',
    offline: '#da1e28',
    warning: '#f1c21b',
    active: '#24a148',
    degraded: '#f1c21b',
    down: '#da1e28',
};

const STATUS_TAG_TYPES: Record<string, 'green' | 'red' | 'warm-gray' | 'magenta' | 'cyan' | 'teal' | 'blue' | 'purple'> = {
    active: 'green',
    degraded: 'warm-gray',
    down: 'red',
};

const LOCATION_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Locations' },
];

const TYPE_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Types' },
    { id: 'router', text: 'Router' },
    { id: 'switch', text: 'Switch' },
    { id: 'firewall', text: 'Firewall' },
    { id: 'server', text: 'Server' },
    { id: 'access-point', text: 'Access Point' },
];

const STATUS_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Statuses' },
    { id: 'online', text: 'Online' },
    { id: 'offline', text: 'Offline' },
    { id: 'warning', text: 'Warning' },
];

function getUtilizationColor(utilization: number): string {
    if (utilization >= 80) return '#da1e28';
    if (utilization >= 60) return '#f1c21b';
    return '#24a148';
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'online':
        case 'active':
            return CheckmarkFilled;
        case 'offline':
        case 'down':
            return ErrorFilled;
        case 'warning':
        case 'degraded':
            return Warning;
        default:
            return CircleFilled;
    }
}

function getNodeLabel(nodeId: string, nodes: TopologyNode[]): string {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? node.label : nodeId;
}

// ==========================================
// Sub-components
// ==========================================

/** A single device card shown inside a location tile. */
function DeviceCard({
    node,
    isSelected,
    onSelect,
}: {
    node: TopologyNode;
    isSelected: boolean;
    onSelect: (node: TopologyNode | null) => void;
}) {
    const Icon = DEVICE_TYPE_ICONS[node.type] || ServerDns;
    const typeLabel = DEVICE_TYPE_LABELS[node.type] || node.type;

    return (
        <Popover
            open={isSelected}
            autoAlign
            dropShadow
            caret
        >
            <ClickableTile
                className={`topology-page__device-card topology-page__device-card--${node.status}`}
                onClick={() => onSelect(isSelected ? null : node)}
                aria-label={`${node.label} - ${node.status}`}
            >
                <div className="topology-page__device-card-header">
                    <span
                        className="topology-page__device-card-icon"
                        style={{ color: STATUS_COLORS[node.status] }}
                    >
                        <Icon size={20} />
                    </span>
                    <span
                        className="topology-page__device-status-dot"
                        style={{ backgroundColor: STATUS_COLORS[node.status] }}
                        title={node.status}
                    />
                </div>
                <div className="topology-page__device-card-body">
                    <span className="topology-page__device-card-name" title={node.label}>
                        {node.label}
                    </span>
                    <span className="topology-page__device-card-meta">
                        {typeLabel}
                    </span>
                    <code className="topology-page__device-card-ip">{node.ip}</code>
                </div>
            </ClickableTile>
            <PopoverContent className="topology-page__device-popover">
                <div className="topology-page__device-popover-inner">
                    <div className="topology-page__device-popover-header">
                        <Icon size={20} />
                        <strong>{node.label}</strong>
                        <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            renderIcon={Close}
                            iconDescription="Close"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onSelect(null);
                            }}
                            className="topology-page__device-popover-close"
                        />
                    </div>
                    <dl className="topology-page__device-popover-details">
                        <div>
                            <dt>Type</dt>
                            <dd>{typeLabel}</dd>
                        </div>
                        <div>
                            <dt>IP Address</dt>
                            <dd><code>{node.ip}</code></dd>
                        </div>
                        <div>
                            <dt>Location</dt>
                            <dd>{node.location}</dd>
                        </div>
                        <div>
                            <dt>Status</dt>
                            <dd>
                                <Tag
                                    type={node.status === 'online' ? 'green' : node.status === 'offline' ? 'red' : 'warm-gray'}
                                    size="sm"
                                >
                                    {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                                </Tag>
                            </dd>
                        </div>
                    </dl>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/** A location group container with its child device cards. */
function LocationGroup({
    location,
    nodes,
    selectedNode,
    onSelectNode,
}: {
    location: string;
    nodes: TopologyNode[];
    selectedNode: TopologyNode | null;
    onSelectNode: (node: TopologyNode | null) => void;
}) {
    const onlineCount = nodes.filter((n) => n.status === 'online').length;
    const offlineCount = nodes.filter((n) => n.status === 'offline').length;
    const warningCount = nodes.filter((n) => n.status === 'warning').length;

    return (
        <Tile className="topology-page__location-tile">
            <div className="topology-page__location-header">
                <div className="topology-page__location-title">
                    <LocationStar size={16} />
                    <h4>{location}</h4>
                </div>
                <div className="topology-page__location-stats">
                    <span className="topology-page__location-stat topology-page__location-stat--online">
                        {onlineCount} online
                    </span>
                    {warningCount > 0 && (
                        <span className="topology-page__location-stat topology-page__location-stat--warning">
                            {warningCount} warning
                        </span>
                    )}
                    {offlineCount > 0 && (
                        <span className="topology-page__location-stat topology-page__location-stat--offline">
                            {offlineCount} offline
                        </span>
                    )}
                </div>
            </div>
            <div className="topology-page__device-grid">
                {nodes.map((node) => (
                    <DeviceCard
                        key={node.id}
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        onSelect={onSelectNode}
                    />
                ))}
            </div>
        </Tile>
    );
}

// ==========================================
// Main Component
// ==========================================

export function TopologyPage() {
    // Data state
    const [nodes, setNodes] = useState<TopologyNode[]>([]);
    const [edges, setEdges] = useState<TopologyEdge[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Interaction state
    const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

    // Filter state
    const [selectedLocation, setSelectedLocation] = useState<FilterOption>(LOCATION_FILTER_OPTIONS[0]);
    const [selectedType, setSelectedType] = useState<FilterOption>(TYPE_FILTER_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState<FilterOption>(STATUS_FILTER_OPTIONS[0]);

    // Connections table pagination
    const [connPage, setConnPage] = useState(1);
    const [connPageSize, setConnPageSize] = useState(10);

    // Build location filter options from data
    const locationFilterOptions = useMemo((): FilterOption[] => [
        { id: 'all', text: 'All Locations' },
        ...locations.map((loc) => ({ id: loc, text: loc })),
    ], [locations]);

    // Fetch topology data
    const fetchTopology = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await topologyService.getTopology();
            setNodes(response.nodes || []);
            setEdges(response.edges || []);
            setLocations(response.locations || []);
        } catch (error) {
            console.error('Failed to fetch topology:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const doFetch = async () => {
            if (!isMounted) return;
            await fetchTopology();
        };
        doFetch();
        return () => { isMounted = false; };
    }, [fetchTopology]);

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
            if (!grouped[node.location]) {
                grouped[node.location] = [];
            }
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

    // Sort edges by utilization descending to show overloaded links first
    const sortedEdges = useMemo(() => {
        return [...filteredEdges].sort((a, b) => b.utilization - a.utilization);
    }, [filteredEdges]);

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
                iconColor: '#0f62fe',
                severity: 'info' as const,
                subtitle: `${locations.length} location${locations.length !== 1 ? 's' : ''}`,
            },
            {
                id: 'online-devices',
                label: 'Online',
                value: onlineDevices,
                icon: CheckmarkFilled,
                iconColor: '#24a148',
                severity: 'success' as const,
                subtitle: totalDevices > 0 ? `${Math.round((onlineDevices / totalDevices) * 100)}% of fleet` : 'No devices',
            },
            {
                id: 'offline-devices',
                label: 'Offline',
                value: offlineDevices,
                icon: ErrorFilled,
                iconColor: '#da1e28',
                severity: offlineDevices > 0 ? 'critical' as const : 'success' as const,
                subtitle: offlineDevices > 0 ? 'Requires attention' : 'All systems operational',
            },
            {
                id: 'active-connections',
                label: 'Active Connections',
                value: activeConnections,
                icon: ConnectionSignal,
                iconColor: '#8a3ffc',
                severity: 'neutral' as const,
                subtitle: `${filteredEdges.length} total links`,
            },
        ];
    }, [filteredNodes, filteredEdges, locations]);

    // Connection table headers
    const connectionHeaders = [
        { key: 'source', header: 'Source' },
        { key: 'target', header: 'Target' },
        { key: 'bandwidth', header: 'Bandwidth' },
        { key: 'utilization', header: 'Utilization' },
        { key: 'status', header: 'Status' },
    ];

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

    // Clear filters
    const clearFilters = () => {
        setSelectedLocation(LOCATION_FILTER_OPTIONS[0]);
        setSelectedType(TYPE_FILTER_OPTIONS[0]);
        setSelectedStatus(STATUS_FILTER_OPTIONS[0]);
        setSelectedNode(null);
    };

    const hasActiveFilters =
        selectedLocation.id !== 'all' ||
        selectedType.id !== 'all' ||
        selectedStatus.id !== 'all';

    // ==========================================
    // Loading skeleton
    // ==========================================

    if (isLoading && nodes.length === 0) {
        return (
            <div className="topology-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Infrastructure', href: '/devices' },
                        { label: 'Network Topology', active: true },
                    ]}
                    title="Network Topology"
                    subtitle="Visual overview of network devices and their interconnections"
                    showBorder
                    actions={[
                        {
                            label: 'Refresh',
                            onClick: () => {},
                            variant: 'primary',
                            icon: Renew,
                            disabled: true,
                        },
                    ]}
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
                        <DataTableSkeleton
                            columnCount={5}
                            rowCount={8}
                            showHeader={false}
                            showToolbar={false}
                        />
                    </DataTableWrapper>
                </div>
            </div>
        );
    }

    // ==========================================
    // Main render
    // ==========================================

    return (
        <div className="topology-page">
            {/* Page Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Infrastructure', href: '/devices' },
                    { label: 'Network Topology', active: true },
                ]}
                title="Network Topology"
                subtitle="Visual overview of network devices and their interconnections"
                showBorder
                actions={[
                    {
                        label: 'Refresh',
                        onClick: fetchTopology,
                        variant: 'primary',
                        icon: Renew,
                    },
                ]}
            />

            <div className="topology-page__content">
                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Filters Row */}
                <div className="topology-page__filters">
                    <Dropdown
                        id="location-filter"
                        label="Location"
                        titleText=""
                        items={locationFilterOptions}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedLocation}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedLocation(selectedItem || LOCATION_FILTER_OPTIONS[0]);
                        }}
                        size="lg"
                    />
                    <Dropdown
                        id="type-filter"
                        label="Device Type"
                        titleText=""
                        items={TYPE_FILTER_OPTIONS}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedType}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedType(selectedItem || TYPE_FILTER_OPTIONS[0]);
                        }}
                        size="lg"
                    />
                    <Dropdown
                        id="status-filter"
                        label="Status"
                        titleText=""
                        items={STATUS_FILTER_OPTIONS}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedStatus}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedStatus(selectedItem || STATUS_FILTER_OPTIONS[0]);
                        }}
                        size="lg"
                    />
                    {hasActiveFilters && (
                        <Button
                            kind="ghost"
                            size="lg"
                            renderIcon={Close}
                            onClick={clearFilters}
                            className="topology-page__clear-filters"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Topology Visualization: Location Groups */}
                <section className="topology-page__visualization" aria-label="Network topology map">
                    <h3 className="topology-page__section-title">Device Map</h3>

                    {Object.keys(nodesByLocation).length === 0 ? (
                        <Tile className="topology-page__empty-state">
                            <Network2 size={48} />
                            <p>
                                {hasActiveFilters
                                    ? 'No devices match the current filters.'
                                    : 'No devices found. Make sure the backend is running and devices are configured.'}
                            </p>
                        </Tile>
                    ) : (
                        <div className="topology-page__location-grid">
                            {Object.entries(nodesByLocation).map(([location, locNodes]) => (
                                <LocationGroup
                                    key={location}
                                    location={location}
                                    nodes={locNodes}
                                    selectedNode={selectedNode}
                                    onSelectNode={setSelectedNode}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Connections Table */}
                <section className="topology-page__connections" aria-label="Network connections">
                    <DataTableWrapper
                        title="Connections"
                        showFilter={false}
                        showRefresh={false}
                    >
                        <DataTable rows={connectionRows} headers={connectionHeaders}>
                            {({ rows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
                                <TableContainer>
                                    <Table {...getTableProps()}>
                                        <TableHead>
                                            <TableRow>
                                                {tableHeaders.map((header) => (
                                                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                        {header.header}
                                                    </TableHeader>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={connectionHeaders.length}>
                                                        <div style={{
                                                            textAlign: 'center',
                                                            padding: '2rem',
                                                            color: 'var(--cds-text-secondary, #c6c6c6)',
                                                        }}>
                                                            {hasActiveFilters
                                                                ? 'No connections match the current filters.'
                                                                : 'No connections found.'}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rows.map((row) => {
                                                    const rowIndex = connectionRows.findIndex((r) => r.id === row.id);
                                                    const rowData = rowIndex >= 0 ? connectionRows[rowIndex] : null;
                                                    const edgeData = rowIndex >= 0 ? paginatedEdges[rowIndex] : null;

                                                    return (
                                                        <TableRow {...getRowProps({ row })} key={row.id}>
                                                            <TableCell>
                                                                <div className="topology-page__conn-endpoint">
                                                                    {rowData?.source || '--'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="topology-page__conn-endpoint">
                                                                    <ArrowRight size={12} style={{ marginRight: '0.25rem', flexShrink: 0 }} />
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
                                                                            status={
                                                                                edgeData.utilization >= 80
                                                                                    ? 'error'
                                                                                    : edgeData.utilization >= 60
                                                                                        ? 'active'
                                                                                        : 'active'
                                                                            }
                                                                        />
                                                                        <span
                                                                            className="topology-page__utilization-value"
                                                                            style={{ color: getUtilizationColor(edgeData.utilization) }}
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
                                                })
                                            )}
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
                    </DataTableWrapper>
                </section>
            </div>

            {/* Inline Styles */}
            <style>{topologyStyles}</style>
        </div>
    );
}

export default TopologyPage;

// ==========================================
// Inline styles (CSS-in-JS)
// Following the project pattern of co-located styles for page components.
// Uses Carbon design token CSS custom properties wherever possible.
// ==========================================

const topologyStyles = `
/* Page container */
.topology-page {
    display: flex;
    flex-direction: column;
    min-height: 100%;
}

.topology-page__content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Filters row */
.topology-page__filters {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    flex-wrap: wrap;
}

.topology-page__filters .cds--dropdown__wrapper {
    min-width: 180px;
}

.topology-page__clear-filters {
    white-space: nowrap;
}

/* Section titles */
.topology-page__section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--cds-text-primary, #f4f4f4);
    margin-bottom: 1rem;
}

/* Location grid */
.topology-page__location-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1rem;
}

@media (max-width: 672px) {
    .topology-page__location-grid {
        grid-template-columns: 1fr;
    }
}

/* Location tile */
.topology-page__location-tile {
    padding: 1rem !important;
    background: var(--cds-layer-01, #262626) !important;
    border-left: 3px solid var(--cds-border-interactive, #4589ff);
}

.topology-page__location-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--cds-border-subtle, #393939);
}

.topology-page__location-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.topology-page__location-title h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--cds-text-primary, #f4f4f4);
    margin: 0;
}

.topology-page__location-stats {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
}

.topology-page__location-stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.topology-page__location-stat--online {
    color: #24a148;
}

.topology-page__location-stat--warning {
    color: #f1c21b;
}

.topology-page__location-stat--offline {
    color: #da1e28;
}

/* Device grid inside location */
.topology-page__device-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    gap: 0.5rem;
}

/* Device card */
.topology-page__device-card {
    padding: 0.75rem !important;
    min-height: auto !important;
    background: var(--cds-layer-02, #393939) !important;
    border: 1px solid transparent;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
    position: relative;
}

.topology-page__device-card:hover {
    border-color: var(--cds-border-interactive, #4589ff);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.topology-page__device-card--offline {
    opacity: 0.65;
}

.topology-page__device-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.topology-page__device-card-icon {
    display: flex;
    align-items: center;
}

.topology-page__device-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.topology-page__device-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.topology-page__device-card-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--cds-text-primary, #f4f4f4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.topology-page__device-card-meta {
    font-size: 0.6875rem;
    color: var(--cds-text-secondary, #c6c6c6);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.topology-page__device-card-ip {
    font-size: 0.6875rem;
    font-family: 'IBM Plex Mono', monospace;
    color: var(--cds-text-helper, #8d8d8d);
}

/* Device popover */
.topology-page__device-popover {
    min-width: 260px;
}

.topology-page__device-popover-inner {
    padding: 0.75rem;
}

.topology-page__device-popover-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--cds-border-subtle, #393939);
}

.topology-page__device-popover-header strong {
    flex: 1;
    font-size: 0.875rem;
    color: var(--cds-text-primary, #f4f4f4);
}

.topology-page__device-popover-close {
    flex-shrink: 0;
}

.topology-page__device-popover-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
}

.topology-page__device-popover-details > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.topology-page__device-popover-details dt {
    font-size: 0.75rem;
    color: var(--cds-text-secondary, #c6c6c6);
    white-space: nowrap;
}

.topology-page__device-popover-details dd {
    font-size: 0.8125rem;
    color: var(--cds-text-primary, #f4f4f4);
    text-align: right;
    margin: 0;
}

.topology-page__device-popover-details code {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
}

/* Empty state */
.topology-page__empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem !important;
    text-align: center;
    color: var(--cds-text-secondary, #c6c6c6);
    gap: 1rem;
}

.topology-page__empty-state p {
    max-width: 400px;
    font-size: 0.875rem;
}

/* Connections table */
.topology-page__connections {
    margin-top: 0.5rem;
}

.topology-page__conn-endpoint {
    display: flex;
    align-items: center;
    font-size: 0.8125rem;
    color: var(--cds-text-primary, #f4f4f4);
}

.topology-page__utilization-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 160px;
}

.topology-page__utilization-cell .cds--progress-bar {
    flex: 1;
    min-width: 80px;
}

.topology-page__utilization-value {
    font-size: 0.75rem;
    font-weight: 600;
    font-family: 'IBM Plex Mono', monospace;
    white-space: nowrap;
    min-width: 45px;
    text-align: right;
}
`;
