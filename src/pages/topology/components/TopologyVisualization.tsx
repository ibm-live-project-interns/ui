/**
 * TopologyVisualization
 *
 * Renders the device map grouped by location with filter dropdowns.
 * Each location is a tile containing device cards with popover details.
 * Extracted from TopologyPage.
 */

import React from 'react';
import {
    Tile,
    ClickableTile,
    Dropdown,
    Popover,
    PopoverContent,
    Button,
    Tag,
} from '@carbon/react';
import {
    ServerDns,
    Close,
    LocationStar,
    Network_2 as Network2,
} from '@carbon/icons-react';

import type { TopologyNode, FilterOption } from '../types';
import {
    DEVICE_TYPE_ICONS,
    DEVICE_TYPE_LABELS,
    LOCATION_FILTER_OPTIONS,
    TYPE_FILTER_OPTIONS,
    STATUS_FILTER_OPTIONS,
} from '../types';

// ==========================================
// Sub-components
// ==========================================

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
        <Popover open={isSelected} autoAlign dropShadow caret>
            <ClickableTile
                className={`topology-page__device-card topology-page__device-card--${node.status}`}
                onClick={() => onSelect(isSelected ? null : node)}
                aria-label={`${node.label} - ${node.status}`}
            >
                <div className="topology-page__device-card-header">
                    <span className={`topology-page__device-card-icon topology-page__device-card-icon--${node.status}`}>
                        <Icon size={20} />
                    </span>
                    <span
                        className={`topology-page__device-status-dot topology-page__device-status-dot--${node.status}`}
                        title={node.status}
                    />
                </div>
                <div className="topology-page__device-card-body">
                    <span className="topology-page__device-card-name" title={node.label}>{node.label}</span>
                    <span className="topology-page__device-card-meta">{typeLabel}</span>
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
                        <div><dt>Type</dt><dd>{typeLabel}</dd></div>
                        <div><dt>IP Address</dt><dd><code>{node.ip}</code></dd></div>
                        <div><dt>Location</dt><dd>{node.location}</dd></div>
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

interface TopologyVisualizationProps {
    nodesByLocation: Record<string, TopologyNode[]>;
    selectedNode: TopologyNode | null;
    onSelectNode: (node: TopologyNode | null) => void;
    locations: string[];
    selectedLocation: FilterOption;
    onLocationChange: (item: FilterOption) => void;
    selectedType: FilterOption;
    onTypeChange: (item: FilterOption) => void;
    selectedStatus: FilterOption;
    onStatusChange: (item: FilterOption) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export const TopologyVisualization = React.memo(function TopologyVisualization({
    nodesByLocation,
    selectedNode,
    onSelectNode,
    locations,
    selectedLocation,
    onLocationChange,
    selectedType,
    onTypeChange,
    selectedStatus,
    onStatusChange,
    hasActiveFilters,
    onClearFilters,
}: TopologyVisualizationProps) {
    const locationFilterOptions: FilterOption[] = [
        ...LOCATION_FILTER_OPTIONS,
        ...locations.map((loc) => ({ id: loc, text: loc })),
    ];

    return (
        <>
            {/* Filters Row */}
            <div className="topology-page__filters">
                <Dropdown
                    id="location-filter"
                    label="Location"
                    titleText="Filter by location"
                    hideLabel
                    items={locationFilterOptions}
                    itemToString={(item: FilterOption | null) => item?.text || ''}
                    selectedItem={selectedLocation}
                    onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                        onLocationChange(selectedItem || LOCATION_FILTER_OPTIONS[0]);
                    }}
                    size="lg"
                />
                <Dropdown
                    id="type-filter"
                    label="Device Type"
                    titleText="Filter by device type"
                    hideLabel
                    items={TYPE_FILTER_OPTIONS}
                    itemToString={(item: FilterOption | null) => item?.text || ''}
                    selectedItem={selectedType}
                    onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                        onTypeChange(selectedItem || TYPE_FILTER_OPTIONS[0]);
                    }}
                    size="lg"
                />
                <Dropdown
                    id="status-filter"
                    label="Status"
                    titleText="Filter by status"
                    hideLabel
                    items={STATUS_FILTER_OPTIONS}
                    itemToString={(item: FilterOption | null) => item?.text || ''}
                    selectedItem={selectedStatus}
                    onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                        onStatusChange(selectedItem || STATUS_FILTER_OPTIONS[0]);
                    }}
                    size="lg"
                />
                {hasActiveFilters && (
                    <Button
                        kind="ghost"
                        size="lg"
                        renderIcon={Close}
                        onClick={onClearFilters}
                        className="topology-page__clear-filters"
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Device Map */}
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
                                onSelectNode={onSelectNode}
                            />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
});
