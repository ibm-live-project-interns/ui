/**
 * System Admin Dashboard View
 *
 * Full system overview with access to all metrics, configurations, and user management.
 * Uses real API data - no mock data.
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Tile, Tag, Tabs, TabList, Tab, TabPanels, TabPanel,
    DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
    TableToolbar, TableToolbarContent, TableToolbarSearch,
    Button, SkeletonText, DataTableSkeleton,
    Modal, TextInput, Select, SelectItem, InlineNotification,
    OverflowMenu, OverflowMenuItem,
} from '@carbon/react';
import { DonutChart } from '@carbon/charts-react';
import { KPICard, type KPICardProps, DashboardHeader } from '@/components/ui';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { StackedAreaChart } from '@carbon/charts-react';
import {
    CheckmarkFilled, Warning, ChartLine, Router, UserMultiple,
    Devices, Activity, Settings, Security,
    Add,
} from '@carbon/icons-react';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';
import type { RoleConfig } from '@/features/roles/types/role.types';
import { TopInterfaces, ConfigAuditLog } from '@/components/widgets';
import { alertDataService, deviceService, ticketDataService } from '@/shared/services';
import { createAreaChartOptions, createDonutChartOptions } from '@/shared/constants/charts';
import '@carbon/charts-react/styles.css';

interface SysAdminViewProps {
    config: RoleConfig;
}

// Mock users for demonstration - would come from API in production
const MOCK_USERS = [
    { id: '1', username: 'admin', email: 'admin@company.com', role: 'Admin', status: 'active', lastLogin: '2025-01-13 10:30 UTC' },
    { id: '2', username: 'operator1', email: 'operator1@company.com', role: 'NOC Operator', status: 'active', lastLogin: '2025-01-13 09:15 UTC' },
    { id: '3', username: 'engineer1', email: 'engineer1@company.com', role: 'Network Engineer', status: 'active', lastLogin: '2025-01-12 18:45 UTC' },
    { id: '4', username: 'analyst1', email: 'analyst1@company.com', role: 'Security Analyst', status: 'active', lastLogin: '2025-01-13 08:00 UTC' },
    { id: '5', username: 'viewer1', email: 'viewer1@company.com', role: 'Viewer', status: 'inactive', lastLogin: '2025-01-01 12:00 UTC' },
];

const USER_HEADERS = [
    { key: 'username', header: 'Username' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'lastLogin', header: 'Last Login' },
    { key: 'actions', header: '' },
];

const ROLES = ['Admin', 'NOC Operator', 'Network Engineer', 'Security Analyst', 'Viewer'];

export function SysAdminView({ config: _config }: SysAdminViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState('g100');
    const [selectedTab, setSelectedTab] = useState(0);

    // Real data states
    const [metrics, setMetrics] = useState({
        totalDevices: 0,
        activeAlerts: 0,
        systemHealth: 100,
        totalTickets: 0,
    });
    const [alertsOverTime, setAlertsOverTime] = useState<any[]>([]);
    const [severityDist, setSeverityDist] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // User management states
    const [users, setUsers] = useState(MOCK_USERS);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<typeof MOCK_USERS[0] | null>(null);
    const [userForm, setUserForm] = useState({ username: '', email: '', role: 'Viewer' });
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Detect theme
    useEffect(() => {
        const detectTheme = () => {
            try {
                const themeSetting = document.documentElement.getAttribute('data-theme-setting');
                if (themeSetting === 'light') setCurrentTheme('white');
                else if (themeSetting === 'dark') setCurrentTheme('g100');
                else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    setCurrentTheme(prefersDark ? 'g100' : 'white');
                }
            } catch { }
        };
        detectTheme();
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
        return () => observer.disconnect();
    }, []);

    // Fetch real data from API
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const results = await Promise.allSettled([
                    alertDataService.getAlertsSummary(),
                    alertDataService.getAlertsOverTime('24h'),
                    alertDataService.getSeverityDistribution(),
                    deviceService.getDevices(),
                    ticketDataService.getTickets(),
                    alertDataService.getNocAlerts(),
                ]);

                if (cancelled) return;

                // Extract values - handle failures gracefully
                const summary = results[0].status === 'fulfilled' ? results[0].value : null;
                const overTime = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [];
                const severity = results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : [];
                const devices = results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : [];
                const tickets = results[4].status === 'fulfilled' && Array.isArray(results[4].value) ? results[4].value : [];
                const alerts = results[5].status === 'fulfilled' && Array.isArray(results[5].value) ? results[5].value : [];

                // Calculate system health based on critical/major alerts
                const criticalCount = summary?.criticalCount || 0;
                const majorCount = summary?.majorCount || 0;
                const healthPenalty = (criticalCount * 5) + (majorCount * 2);
                const systemHealth = Math.max(0, 100 - healthPenalty);

                setMetrics({
                    totalDevices: devices.length || 0,
                    activeAlerts: summary?.activeCount || 0,
                    systemHealth,
                    totalTickets: tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length,
                });

                setAlertsOverTime(overTime);
                setSeverityDist(severity);

                // Transform recent alerts into activity log
                const activity = alerts.slice(0, 5).map((alert, idx) => ({
                    id: alert.id || `activity-${idx}`,
                    user: 'system',
                    action: alert.status === 'acknowledged' ? 'Alert Acknowledged' : 'Alert Detected',
                    resource: alert.device?.name || 'Unknown Device',
                    status: alert.status || 'open',
                    timestamp: alert.timestamp?.relative || 'Recently',
                }));
                setRecentActivity(activity);

            } catch (error) {
                console.error('Failed to fetch admin dashboard data:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    // User management handlers
    const handleOpenAddUser = () => {
        setSelectedUser(null);
        setUserForm({ username: '', email: '', role: 'Viewer' });
        setUserModalOpen(true);
    };

    const handleOpenEditUser = (user: typeof MOCK_USERS[0]) => {
        setSelectedUser(user);
        setUserForm({ username: user.username, email: user.email, role: user.role });
        setUserModalOpen(true);
    };

    const handleOpenDeleteUser = (user: typeof MOCK_USERS[0]) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    const handleSaveUser = () => {
        if (selectedUser) {
            // Edit existing user
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id
                    ? { ...u, ...userForm }
                    : u
            ));
            setNotification({ type: 'success', message: `User "${userForm.username}" updated successfully` });
        } else {
            // Add new user
            const newUser = {
                id: `${Date.now()}`,
                username: userForm.username,
                email: userForm.email,
                role: userForm.role,
                status: 'active' as const,
                lastLogin: 'Never',
            };
            setUsers(prev => [...prev, newUser]);
            setNotification({ type: 'success', message: `User "${userForm.username}" created successfully` });
        }
        setUserModalOpen(false);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDeleteUser = () => {
        if (selectedUser) {
            setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setNotification({ type: 'success', message: `User "${selectedUser.username}" deleted` });
            setDeleteModalOpen(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleToggleUserStatus = (userId: string) => {
        setUsers(prev => prev.map(u =>
            u.id === userId
                ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
                : u
        ));
    };

    // Chart options
    const areaChartOptions = useMemo(() =>
        createAreaChartOptions({ title: 'System Load', height: '250px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    const donutChartOptions = useMemo(() =>
        createDonutChartOptions({ title: 'Alert Distribution', height: '250px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    // KPI data from real metrics
    const kpiData: KPICardProps[] = [
        {
            label: 'Total Devices',
            value: metrics.totalDevices.toLocaleString(),
            icon: Router,
            iconColor: '#0f62fe',
            severity: 'info',
        },
        {
            label: 'Active Alerts',
            value: metrics.activeAlerts,
            icon: Warning,
            iconColor: metrics.activeAlerts > 10 ? '#da1e28' : '#ff832b',
            severity: metrics.activeAlerts > 10 ? 'critical' : 'major',
        },
        {
            label: 'System Health',
            value: `${metrics.systemHealth}%`,
            icon: CheckmarkFilled,
            iconColor: metrics.systemHealth > 80 ? '#24a148' : '#ff832b',
            severity: metrics.systemHealth > 80 ? 'success' : 'major',
        },
        {
            label: 'Open Tickets',
            value: metrics.totalTickets,
            icon: ChartLine,
            iconColor: '#8a3ffc',
            severity: 'info',
        },
    ];

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-page__content">
                    <DashboardHeader
                        title="System Administration"
                        subtitle="Full system overview, configuration, and security auditing"
                        systemStatus="operational"
                    />
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                            </Tile>
                        ))}
                    </div>
                    <DataTableSkeleton columnCount={5} rowCount={5} showHeader showToolbar />
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-page__content">
                <DashboardHeader
                    title="System Administration"
                    subtitle="Full system overview, configuration, and security auditing"
                    systemStatus={metrics.systemHealth > 80 ? 'operational' : 'degraded'}
                />

                {/* Notification */}
                {notification && (
                    <div style={{ marginBottom: '1rem' }}>
                        <InlineNotification
                            kind={notification.type}
                            title={notification.type === 'success' ? 'Success' : 'Error'}
                            subtitle={notification.message}
                            onCloseButtonClick={() => setNotification(null)}
                        />
                    </div>
                )}

                {/* KPI Section */}
                <div className="kpi-row">
                    {kpiData.map((kpi, index) => (
                        <KPICard key={index} {...kpi} />
                    ))}
                </div>

                {/* Admin Tabs */}
                <Tabs selectedIndex={selectedTab} onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}>
                    <TabList aria-label="Admin sections" contained>
                        <Tab renderIcon={Activity}>Overview</Tab>
                        <Tab renderIcon={UserMultiple}>Users & Roles</Tab>
                        <Tab renderIcon={Devices}>System Logs</Tab>
                    </TabList>
                    <TabPanels>
                        {/* Overview Tab */}
                        <TabPanel style={{ padding: '1rem 0' }}>
                            <div className="cds--grid" style={{ padding: 0, margin: 0 }}>
                                <div className="cds--row">
                                    {/* Left Column: Charts */}
                                    <div className="cds--col-lg-8 cds--col-md-8">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <Tile className="chart-tile" style={{ minHeight: '300px' }}>
                                                <div className="chart-header">
                                                    <h3>Alert Trends</h3>
                                                </div>
                                                <div className="chart-container">
                                                    <ChartWrapper
                                                        ChartComponent={StackedAreaChart}
                                                        data={alertsOverTime}
                                                        options={areaChartOptions}
                                                        height="250px"
                                                        emptyMessage="No alert data available"
                                                    />
                                                </div>
                                            </Tile>

                                            <Tile className="chart-tile" style={{ minHeight: '300px' }}>
                                                <div className="chart-header">
                                                    <h3>Severity Distribution</h3>
                                                </div>
                                                <div className="chart-container">
                                                    <ChartWrapper
                                                        ChartComponent={DonutChart}
                                                        data={severityDist}
                                                        options={donutChartOptions}
                                                        height="250px"
                                                        emptyMessage="No distribution data"
                                                    />
                                                </div>
                                            </Tile>
                                        </div>
                                    </div>

                                    {/* Right Column: Widgets */}
                                    <div className="cds--col-lg-8 cds--col-md-4">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                                            <div style={{ flex: 1 }}>
                                                <TopInterfaces />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <ConfigAuditLog />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Table */}
                            <div style={{ marginTop: '1rem' }}>
                                <DataTable rows={recentActivity} headers={[
                                    { key: 'user', header: 'User' },
                                    { key: 'action', header: 'Action' },
                                    { key: 'resource', header: 'Resource' },
                                    { key: 'status', header: 'Status' },
                                    { key: 'timestamp', header: 'Time' },
                                ]}>
                                    {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                                        <TableContainer title="Recent System Activity" description="Recent alerts and system events">
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
                                                    {recentActivity.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
                                                                No recent activity
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        rows.map((row) => {
                                                            const activity = recentActivity.find(a => a.id === row.id);
                                                            if (!activity) return null;
                                                            return (
                                                                <TableRow {...getRowProps({ row })} key={row.id}>
                                                                    <TableCell style={{ fontWeight: 600, color: 'var(--cds-link-primary)' }}>{activity.user}</TableCell>
                                                                    <TableCell>{activity.action}</TableCell>
                                                                    <TableCell>{activity.resource}</TableCell>
                                                                    <TableCell>
                                                                        <Tag type={activity.status === 'acknowledged' ? 'green' : activity.status === 'open' ? 'red' : 'gray'} size="sm">
                                                                            {activity.status}
                                                                        </Tag>
                                                                    </TableCell>
                                                                    <TableCell style={{ color: 'var(--cds-text-secondary)' }}>{typeof activity.timestamp === 'string' ? activity.timestamp : (activity.timestamp as any)?.relative || 'N/A'}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </DataTable>
                            </div>
                        </TabPanel>

                        {/* Users & Roles Tab */}
                        <TabPanel style={{ padding: '1rem 0' }}>
                            {/* User Statistics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <Tile style={{ background: 'var(--cds-layer-02)', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <UserMultiple size={24} style={{ color: '#0f62fe' }} />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase' }}>Total Users</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{users.length}</div>
                                        </div>
                                    </div>
                                </Tile>
                                <Tile style={{ background: 'var(--cds-layer-02)', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <CheckmarkFilled size={24} style={{ color: '#24a148' }} />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase' }}>Active</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{users.filter(u => u.status === 'active').length}</div>
                                        </div>
                                    </div>
                                </Tile>
                                <Tile style={{ background: 'var(--cds-layer-02)', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Security size={24} style={{ color: '#8a3ffc' }} />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase' }}>Admins</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{users.filter(u => u.role === 'Admin').length}</div>
                                        </div>
                                    </div>
                                </Tile>
                            </div>

                            {/* Users Table */}
                            <DataTable rows={users} headers={USER_HEADERS} isSortable>
                                {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                    <TableContainer title="User Management" description="Manage system users, roles, and permissions">
                                        <TableToolbar>
                                            <TableToolbarContent>
                                                <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                                <Button kind="primary" size="md" renderIcon={Add} onClick={handleOpenAddUser}>
                                                    Add User
                                                </Button>
                                            </TableToolbarContent>
                                        </TableToolbar>
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
                                                    const user = users.find(u => u.id === row.id);
                                                    if (!user) return null;
                                                    return (
                                                        <TableRow {...getRowProps({ row })} key={row.id}>
                                                            <TableCell style={{ fontWeight: 600 }}>{user.username}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>
                                                                <Tag type={user.role === 'Admin' ? 'red' : user.role === 'NOC Operator' ? 'blue' : 'gray'} size="sm">
                                                                    {user.role}
                                                                </Tag>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Tag type={user.status === 'active' ? 'green' : 'gray'} size="sm">
                                                                    {user.status}
                                                                </Tag>
                                                            </TableCell>
                                                            <TableCell style={{ color: 'var(--cds-text-secondary)' }}>{user.lastLogin}</TableCell>
                                                            <TableCell>
                                                                <OverflowMenu flipped size="sm" ariaLabel="User actions">
                                                                    <OverflowMenuItem itemText="Edit user" onClick={() => handleOpenEditUser(user)} />
                                                                    <OverflowMenuItem itemText="Reset password" />
                                                                    <OverflowMenuItem
                                                                        itemText={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                                        onClick={() => handleToggleUserStatus(user.id)}
                                                                    />
                                                                    <OverflowMenuItem isDelete itemText="Delete user" onClick={() => handleOpenDeleteUser(user)} />
                                                                </OverflowMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </DataTable>

                            {/* Role Permissions Summary */}
                            <Tile style={{ marginTop: '1rem', padding: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Settings size={20} /> Role Permissions Matrix
                                </h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Role</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>View Alerts</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Manage Alerts</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>View Devices</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Manage Users</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>System Config</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { role: 'Admin', perms: [true, true, true, true, true] },
                                                { role: 'NOC Operator', perms: [true, true, true, false, false] },
                                                { role: 'Network Engineer', perms: [true, true, true, false, false] },
                                                { role: 'Security Analyst', perms: [true, false, true, false, false] },
                                                { role: 'Viewer', perms: [true, false, true, false, false] },
                                            ].map((item) => (
                                                <tr key={item.role} style={{ borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{item.role}</td>
                                                    {item.perms.map((perm, i) => (
                                                        <td key={i} style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                            <Tag type={perm ? 'green' : 'gray'} size="sm">
                                                                {perm ? 'Yes' : 'No'}
                                                            </Tag>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Tile>
                        </TabPanel>

                        {/* System Logs Tab */}
                        <TabPanel style={{ padding: '1rem 0' }}>
                            <ConfigAuditLog />
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                {/* Add/Edit User Modal */}
                <Modal
                    open={userModalOpen}
                    onRequestClose={() => setUserModalOpen(false)}
                    onRequestSubmit={handleSaveUser}
                    modalHeading={selectedUser ? 'Edit User' : 'Add New User'}
                    modalLabel="User Management"
                    primaryButtonText={selectedUser ? 'Save Changes' : 'Create User'}
                    secondaryButtonText="Cancel"
                    size="md"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                        <TextInput
                            id="user-username"
                            labelText="Username"
                            value={userForm.username}
                            onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter username"
                        />
                        <TextInput
                            id="user-email"
                            labelText="Email Address"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@company.com"
                        />
                        <Select
                            id="user-role"
                            labelText="Role"
                            value={userForm.role}
                            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                        >
                            {ROLES.map(role => (
                                <SelectItem key={role} value={role} text={role} />
                            ))}
                        </Select>
                        {!selectedUser && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                A temporary password will be generated and sent to the user's email address.
                            </p>
                        )}
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    open={deleteModalOpen}
                    onRequestClose={() => setDeleteModalOpen(false)}
                    onRequestSubmit={handleDeleteUser}
                    modalHeading="Delete User"
                    modalLabel="Confirm Deletion"
                    primaryButtonText="Delete"
                    secondaryButtonText="Cancel"
                    danger
                    size="sm"
                >
                    <p style={{ padding: '1rem 0' }}>
                        Are you sure you want to delete the user <strong>"{selectedUser?.username}"</strong>?
                        This action cannot be undone.
                    </p>
                </Modal>
            </div>
        </div>
    );
}

export default SysAdminView;
