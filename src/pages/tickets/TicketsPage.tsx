import { useState, useEffect, useMemo } from 'react';
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
    Button,
    Tag,
    Pagination,
    DataTableSkeleton,
    Modal,
    TextInput,
    TextArea,
    Select,
    SelectItem,
    ToastNotification,
    Dropdown,
    Search,
    SkeletonText,
    Tile,
} from '@carbon/react';
import {
    Add,
    View,
    Ticket,
    Time,
    CheckmarkFilled,
    InProgress,
    Close,
} from '@carbon/icons-react';
import '@/styles/pages/_tickets.scss';
import '@/styles/components/_kpi-card.scss';

// Reusable components
import { KPICard, PageHeader, DataTableWrapper } from '@/components';

// Services
import { ticketDataService, authService, type TicketInfo } from '@/shared/services';

// Import shared constants - no need to redefine
import {
    getPriorityTag,
    getTicketStatusTag,
    PRIORITY_FILTER_OPTIONS,
    TICKET_STATUS_FILTER_OPTIONS
} from '@/shared/constants/tickets';

const QUICK_FILTERS = ['Critical', 'Open Only', 'My Tickets', 'Unassigned'];

export function TicketsPage() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<TicketInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPriority, setSelectedPriority] = useState(PRIORITY_FILTER_OPTIONS[0]);
    const [selectedStatus, setSelectedStatus] = useState(TICKET_STATUS_FILTER_OPTIONS[0]);
    const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
        deviceName: '',
        assignee: '',
    });
    const [toasts, setToasts] = useState<{ id: string; kind: 'success' | 'error'; title: string; subtitle: string }[]>([]);

    const addToast = (kind: 'success' | 'error', title: string, subtitle: string) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, kind, title, subtitle }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    // Fetch tickets from service
    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                const data = await ticketDataService.getTickets();
                setTickets(data);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const handleCreateTicket = async () => {
        if (!createForm.title) return;

        setIsCreating(true);
        try {
            const newTicket = await ticketDataService.createTicket({
                alertId: 'manual-' + Date.now(),
                title: createForm.title,
                description: createForm.description,
                priority: createForm.priority,
                deviceName: createForm.deviceName || 'Manual Entry',
                assignee: createForm.assignee,
            });

            // Refresh tickets list
            const updatedTickets = await ticketDataService.getTickets();
            setTickets(updatedTickets);

            setIsCreateModalOpen(false);
            setCreateForm({ title: '', description: '', priority: 'medium', deviceName: '', assignee: '' });
            addToast('success', 'Ticket Created', `${newTicket.ticketNumber} has been created`);
        } catch (error) {
            console.error('Failed to create ticket:', error);
            addToast('error', 'Creation Failed', 'Could not create ticket');
        } finally {
            setIsCreating(false);
        }
    };

    // KPI data
    const kpiData: any[] = useMemo(() => {
        const openCount = tickets.filter(t => t.status === 'open').length;
        const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
        const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
        const avgResolutionTime = '2.5h'; // Mock data

        return [
            {
                id: 'open-tickets',
                label: 'Open Tickets',
                value: openCount.toString(),
                subtitle: 'Awaiting action',
                icon: Ticket,
                severity: 'critical',
                iconColor: 'var(--cds-support-error)',
            },
            {
                id: 'in-progress',
                label: 'In Progress',
                value: inProgressCount.toString(),
                subtitle: 'Active tickets',
                icon: InProgress,
                severity: 'major',
                iconColor: 'var(--cds-support-primary)',
            },
            {
                id: 'resolved',
                label: 'Resolved',
                value: resolvedCount.toString(),
                subtitle: 'Use filter to view',
                icon: CheckmarkFilled,
                severity: 'success',
                iconColor: 'var(--cds-support-success)',
            },
            {
                id: 'avg-resolution',
                label: 'Avg Resolution',
                value: avgResolutionTime,
                subtitle: 'Last 30 days',
                icon: Time,
                severity: 'neutral',
                iconColor: 'var(--cds-text-secondary)',
            },
        ];
    }, [tickets]);

    // Filter tickets based on all filter criteria
    const filteredTickets = useMemo(() => {
        let result = [...tickets];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (ticket) =>
                    ticket.title.toLowerCase().includes(query) ||
                    ticket.ticketNumber.toLowerCase().includes(query) ||
                    ticket.deviceName.toLowerCase().includes(query) ||
                    ticket.description?.toLowerCase().includes(query)
            );
        }

        // Priority filter
        if (selectedPriority.id !== 'all') {
            result = result.filter((ticket) => ticket.priority === selectedPriority.id);
        }

        // Status filter
        if (selectedStatus.id !== 'all') {
            result = result.filter((ticket) => ticket.status === selectedStatus.id);
        }

        // Quick filters
        if (activeQuickFilters.includes('Critical')) {
            result = result.filter((ticket) => ticket.priority === 'critical');
        }

        if (activeQuickFilters.includes('Open Only')) {
            result = result.filter((ticket) => ticket.status === 'open');
        }

        if (activeQuickFilters.includes('My Tickets')) {
            const currentUser = authService.currentUser;
            const username = currentUser?.username || currentUser?.email || '';
            if (username) {
                result = result.filter((ticket) =>
                    ticket.assignedTo === username ||
                    ticket.assignedTo === currentUser?.email
                );
            }
        }

        if (activeQuickFilters.includes('Unassigned')) {
            result = result.filter((ticket) => !ticket.assignedTo || ticket.assignedTo === 'Unassigned');
        }

        return result;
    }, [tickets, searchQuery, selectedPriority, selectedStatus, activeQuickFilters]);

    // Paginate filtered tickets
    const paginatedTickets = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTickets.slice(start, start + pageSize);
    }, [filteredTickets, currentPage, pageSize]);

    // Toggle quick filter
    const toggleQuickFilter = (filter: string) => {
        setActiveQuickFilters((prev) =>
            prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter]
        );
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedPriority(PRIORITY_FILTER_OPTIONS[0]);
        setSelectedStatus(TICKET_STATUS_FILTER_OPTIONS[0]);
        setActiveQuickFilters([]);
        setCurrentPage(1);
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery ||
        selectedPriority.id !== 'all' ||
        selectedStatus.id !== 'all' ||
        activeQuickFilters.length > 0;

    // Count active filters for indicator
    const activeFilterCount = [
        searchQuery ? 1 : 0,
        selectedPriority.id !== 'all' ? 1 : 0,
        selectedStatus.id !== 'all' ? 1 : 0,
        activeQuickFilters.length,
    ].reduce((a, b) => a + b, 0);

    const headers = [
        { key: 'ticketNumber', header: 'Ticket #' },
        { key: 'title', header: 'Title' },
        { key: 'deviceName', header: 'Device' },
        { key: 'priority', header: 'Priority' },
        { key: 'status', header: 'Status' },
        { key: 'assignedTo', header: 'Assigned To' },
        { key: 'createdAt', header: 'Created' },
        { key: 'actions', header: 'Actions' },
    ];

    const handleViewTicket = (ticketId: string) => {
        navigate(`/tickets/${ticketId}`);
    };

    if (isLoading) {
        return (
            <div className="tickets-page">
                <PageHeader
                    title="Tickets"
                    subtitle="Track and manage all tickets created from network alerts"
                    showBreadcrumbs={false}
                    showBorder={true}
                />

                {/* Skeleton KPI Row - Using Carbon SkeletonText */}
                <div className="kpi-row">
                    {[1, 2, 3, 4].map((i) => (
                        <Tile key={i} className="kpi-card-skeleton">
                            <SkeletonText width="40%" />
                            <SkeletonText heading width="60%" />
                            <SkeletonText width="50%" />
                        </Tile>
                    ))}
                </div>

                {/* Skeleton Table */}
                <DataTableSkeleton
                    columnCount={headers.length}
                    rowCount={5}
                    showHeader
                    showToolbar
                />
            </div>
        );
    }

    return (
        <div className="tickets-page">
            <PageHeader
                title="Tickets"
                subtitle="Track and manage all tickets created from network alerts"
                showBreadcrumbs={false}
                showBorder={true}
                actions={[
                    {
                        label: 'Create Ticket',
                        onClick: () => setIsCreateModalOpen(true),
                        variant: 'primary',
                        icon: Add,
                    },
                ]}
            />

            <div className="tickets-page__content">
                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Filters Row - Following Carbon filtering pattern */}
                <div className="filters-row">
                    <Search
                        size="lg"
                        placeholder="Search by ticket #, title, or device..."
                        labelText="Search tickets"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                        }}
                        className="filters-search"
                    />
                    <Dropdown
                        id="priority-filter"
                        label="Priority"
                        titleText=""
                        items={PRIORITY_FILTER_OPTIONS}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={selectedPriority}
                        onChange={({ selectedItem }) => {
                            setSelectedPriority(selectedItem || PRIORITY_FILTER_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />
                    <Dropdown
                        id="status-filter"
                        label="Status"
                        titleText=""
                        items={TICKET_STATUS_FILTER_OPTIONS}
                        itemToString={(item) => item?.text || ''}
                        selectedItem={selectedStatus}
                        onChange={({ selectedItem }) => {
                            setSelectedStatus(selectedItem || TICKET_STATUS_FILTER_OPTIONS[0]);
                            setCurrentPage(1);
                        }}
                        size="lg"
                    />
                    {hasActiveFilters && (
                        <Button
                            kind="ghost"
                            size="lg"
                            renderIcon={Close}
                            onClick={clearAllFilters}
                        >
                            Clear filters ({activeFilterCount})
                        </Button>
                    )}
                </div>

                {/* Quick Filters - Instant update pattern */}
                <div className="quick-filters">
                    <span className="quick-filters-label">Quick Filters:</span>
                    {QUICK_FILTERS.map((filter) => (
                        <Tag
                            key={filter}
                            type={activeQuickFilters.includes(filter) ? 'blue' : 'gray'}
                            onClick={() => toggleQuickFilter(filter)}
                            className="quick-filter-tag"
                        >
                            {filter}
                        </Tag>
                    ))}
                </div>

                {/* Filter Results Summary */}
                {hasActiveFilters && (
                    <div className="filter-results-summary">
                        Showing {filteredTickets.length} of {tickets.length} tickets
                    </div>
                )}

                {/* Tickets Table using DataTableWrapper */}
                <DataTableWrapper
                    title="All Tickets"
                    onSearch={(value) => {
                        setSearchQuery(value);
                        setCurrentPage(1);
                    }}
                    searchPlaceholder="Search tickets..."
                    searchValue={searchQuery}
                    showFilter={false}
                    showRefresh={false}
                >
                    <DataTable rows={paginatedTickets} headers={headers}>
                        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                            <TableContainer>
                                <Table {...getTableProps()}>
                                    <TableHead>
                                        <TableRow>
                                            {headers.map((header) => (
                                                <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                    {header.header}
                                                </TableHeader>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map((row) => {
                                            const ticket = paginatedTickets.find((t) => t.id === row.id);
                                            if (!ticket) return null;
                                            return (
                                                <TableRow {...getRowProps({ row })} key={row.id}>
                                                    <TableCell>
                                                        <span
                                                            className="ticket-number"
                                                            onClick={() => handleViewTicket(ticket.id)}
                                                        >
                                                            {ticket.ticketNumber}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="ticket-title-cell">
                                                            <span className="ticket-title">{ticket.title}</span>
                                                            <span className="ticket-description">{ticket.description}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{ticket.deviceName}</TableCell>
                                                    <TableCell>{getPriorityTag(ticket.priority)}</TableCell>
                                                    <TableCell>{getTicketStatusTag(ticket.status as any)}</TableCell>
                                                    <TableCell>{ticket.assignedTo}</TableCell>
                                                    <TableCell>
                                                        <span className="timestamp">{ticket.createdAt}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            kind="ghost"
                                                            size="sm"
                                                            renderIcon={View}
                                                            hasIconOnly
                                                            iconDescription="View Ticket"
                                                            onClick={() => handleViewTicket(ticket.id)}
                                                        />
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
                        totalItems={filteredTickets.length}
                        pageSize={pageSize}
                        pageSizes={[10, 20, 50]}
                        page={currentPage}
                        onChange={({ page, pageSize }) => {
                            setCurrentPage(page);
                            setPageSize(pageSize);
                        }}
                    />
                </DataTableWrapper>
            </div>

            {/* Toast Notifications */}
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}>
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        kind={toast.kind}
                        title={toast.title}
                        subtitle={toast.subtitle}
                        timeout={5000}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

            {/* Create Ticket Modal */}
            <Modal
                open={isCreateModalOpen}
                onRequestClose={() => setIsCreateModalOpen(false)}
                modalHeading="Create New Ticket"
                primaryButtonText={isCreating ? 'Creating...' : 'Create Ticket'}
                secondaryButtonText="Cancel"
                onRequestSubmit={handleCreateTicket}
                primaryButtonDisabled={isCreating || !createForm.title}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <TextInput
                        id="create-ticket-title"
                        labelText="Title"
                        placeholder="Enter ticket title"
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                        required
                    />

                    <TextArea
                        id="create-ticket-description"
                        labelText="Description"
                        placeholder="Describe the issue"
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        rows={4}
                    />

                    <Select
                        id="create-ticket-priority"
                        labelText="Priority"
                        value={createForm.priority}
                        onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as typeof createForm.priority })}
                    >
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="high" text="High" />
                        <SelectItem value="medium" text="Medium" />
                        <SelectItem value="low" text="Low" />
                    </Select>

                    <TextInput
                        id="create-ticket-device"
                        labelText="Device Name (optional)"
                        placeholder="Enter device name"
                        value={createForm.deviceName}
                        onChange={(e) => setCreateForm({ ...createForm, deviceName: e.target.value })}
                    />

                    <TextInput
                        id="create-ticket-assignee"
                        labelText="Assignee (optional)"
                        placeholder="Enter assignee name"
                        value={createForm.assignee}
                        onChange={(e) => setCreateForm({ ...createForm, assignee: e.target.value })}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default TicketsPage;
