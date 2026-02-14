/**
 * System Admin Dashboard View
 *
 * Full system overview with access to all metrics, configurations, and user management.
 * Uses real API data with graceful fallback when endpoints are not yet available.
 *
 * Services:
 * - User management from userService (GET/POST/PUT/DELETE /users)
 * - Alert data from alertDataService
 * - Device data from deviceService
 * - Ticket data from ticketDataService
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Tile, Tag, Tabs, TabList, Tab, TabPanels, TabPanel,
    DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
    TableToolbar, TableToolbarContent, TableToolbarSearch,
    TableSelectAll, TableSelectRow, TableBatchActions, TableBatchAction,
    TableExpandHeader, TableExpandRow, TableExpandedRow,
    Button, SkeletonText, DataTableSkeleton,
    Modal, TextInput, Select, SelectItem, Toggle,
    OverflowMenu, OverflowMenuItem, Pagination,
} from '@carbon/react';
import { useToast } from '@/contexts';
import { DonutChart } from '@carbon/charts-react';
import { KPICard, type KPICardProps, PageHeader, EmptyState, WidgetErrorBoundary } from '@/components/ui';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { StackedAreaChart } from '@carbon/charts-react';
import {
    CheckmarkFilled, Warning, ChartLine, Router, UserMultiple,
    UserAvatar, Devices, Activity, Settings, Security,
    Add, TrashCan, Power, UserRole, Time, Ticket,
} from '@carbon/icons-react';
import { ROLE_PERMISSIONS } from '@/shared/types/api.types';
import type { RoleID, Permission } from '@/shared/types/api.types';
import type { TicketInfo } from '@/shared/services';
import '@/styles/pages/_dashboard.scss';
import '@/styles/components/_kpi-card.scss';
import type { RoleConfig } from '@/features/roles/types/role.types';
import { TopInterfaces, ConfigAuditLog } from '@/components/widgets';
import { alertDataService, deviceService, ticketDataService, userService } from '@/shared/services';
import type { ManagedUser } from '@/shared/services';
import { createAreaChartOptions, createDonutChartOptions } from '@/shared/constants/charts';
import '@carbon/charts-react/styles.css';

interface SysAdminViewProps {
    config: RoleConfig;
}

const USER_HEADERS = [
    { key: 'username', header: 'Username' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'lastLogin', header: 'Last Login' },
    { key: 'actions', header: '' },
];

const ROLE_OPTIONS = [
    { value: 'sysadmin', label: 'System Administrator' },
    { value: 'network-ops', label: 'NOC Operator' },
    { value: 'network-admin', label: 'Network Administrator' },
    { value: 'senior-eng', label: 'Senior Engineer' },
    { value: 'sre', label: 'SRE' },
];

/** Friendly role label mapping */
const getRoleLabel = (role: string): string => {
    const found = ROLE_OPTIONS.find(r => r.value === role);
    return found ? found.label : role;
};

/** Tag color for role */
const getRoleTagType = (role: string): 'red' | 'blue' | 'purple' | 'teal' | 'cyan' | 'gray' => {
    switch (role) {
        case 'sysadmin': return 'red';
        case 'network-ops': return 'blue';
        case 'network-admin': return 'teal';
        case 'senior-eng': return 'purple';
        case 'sre': return 'cyan';
        default: return 'gray';
    }
};

/** Transform ManagedUser to table-compatible row */
interface UserRow {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    lastLogin: string;
    actions: string;
}

/** Per-user performance statistics computed from alert/ticket data */
interface UserStats {
    alertsAssigned: number;
    ticketsOpen: number;
    ticketsResolved: number;
    ticketsClosed: number;
    ticketsTotal: number;
    avgResolutionHours: number | null;
}

/** Friendly label for a permission key */
const getPermissionLabel = (perm: Permission): string => {
    const labels: Record<Permission, string> = {
        'view-alerts': 'View Alerts',
        'acknowledge-alerts': 'Ack Alerts',
        'create-tickets': 'Create Tickets',
        'view-tickets': 'View Tickets',
        'view-devices': 'View Devices',
        'manage-devices': 'Manage Devices',
        'view-config': 'View Config',
        'view-analytics': 'Analytics',
        'export-reports': 'Export',
        'view-services': 'Services',
        'view-sla': 'SLA',
        'view-all': 'View All',
        'view-team-metrics': 'Team Metrics',
    };
    return labels[perm] || perm;
};

export function SysAdminView({ config: _config }: SysAdminViewProps) {
    const navigate = useNavigate();
    const { addToast } = useToast();
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

    // Per-user stats source data
    const [allAlerts, setAllAlerts] = useState<any[]>([]);
    const [allTickets, setAllTickets] = useState<TicketInfo[]>([]);

    // User management states
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSaving, setUserSaving] = useState(false);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [userForm, setUserForm] = useState({ username: '', email: '', role: 'network-ops', first_name: '', last_name: '' });

    // User table pagination
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userPageSize, setUserPageSize] = useState(10);

    // System Logs tab states
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Bulk action states
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);
    const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
    const [pendingBulkRoleIds, setPendingBulkRoleIds] = useState<string[]>([]);
    const [bulkRoleValue, setBulkRoleValue] = useState('network-ops');

    // Editable role permissions state
    const PERM_COLUMN_LABELS = ['View Alerts', 'Manage Alerts', 'View Devices', 'Manage Users', 'System Config'];
    const PERM_ROLES: { roleId: string; label: string }[] = [
        { roleId: 'sysadmin', label: 'System Administrator' },
        { roleId: 'network-ops', label: 'NOC Operator' },
        { roleId: 'network-admin', label: 'Network Administrator' },
        { roleId: 'senior-eng', label: 'Senior Engineer' },
        { roleId: 'sre', label: 'SRE' },
    ];
    const [rolePermissions, setRolePermissions] = useState<Record<string, boolean[]>>({
        'sysadmin': [true, true, true, true, true],
        'network-ops': [true, true, true, false, false],
        'network-admin': [true, true, true, false, true],
        'senior-eng': [true, true, true, false, false],
        'sre': [true, false, true, false, false],
    });

    const handlePermissionToggle = (roleId: string, permIndex: number) => {
        if (roleId === 'sysadmin') return; // System Administrator is always full access
        setRolePermissions(prev => {
            const updated = { ...prev };
            updated[roleId] = [...prev[roleId]];
            updated[roleId][permIndex] = !updated[roleId][permIndex];
            return updated;
        });
        addToast('info', 'Permission Updated', `Updated permissions for ${PERM_ROLES.find(r => r.roleId === roleId)?.label}`);
    };

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
            } catch { /* ignore */ }
        };
        detectTheme();
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-setting'] });
        return () => observer.disconnect();
    }, []);

    // Fetch dashboard overview data
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

                const summary = results[0].status === 'fulfilled' ? results[0].value : null;
                const overTime = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [];
                const severity = results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : [];
                const devices = results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : [];
                const tickets = results[4].status === 'fulfilled' && Array.isArray(results[4].value) ? results[4].value : [];
                const alerts = results[5].status === 'fulfilled' && Array.isArray(results[5].value) ? results[5].value : [];

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

                // Store raw data for per-user statistics
                setAllAlerts(alerts);
                setAllTickets(tickets);

                // Transform recent alerts into activity log
                const activity = alerts.slice(0, 10).map((alert: any, idx: number) => ({
                    id: alert.id || `activity-${idx}`,
                    user: 'system',
                    action: alert.status === 'acknowledged' ? 'Alert Acknowledged' : 'Alert Detected',
                    resource: alert.device?.name || 'Unknown Device',
                    status: alert.status || 'open',
                    timestamp: typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative || 'Recently',
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

    // Fetch users when Users tab is selected
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const fetchedUsers = await userService.getUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            addToast('error', 'Error', 'Failed to load users. The user management API may not be available yet.');
        } finally {
            setUsersLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (selectedTab === 1) {
            fetchUsers();
        }
    }, [selectedTab, fetchUsers]);

    // Fetch system logs when Logs tab is selected
    const fetchSystemLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const alerts = await alertDataService.getNocAlerts();
            const logs = (alerts || []).slice(0, 20).map((alert: any, idx: number) => ({
                id: alert.id || `log-${idx}`,
                timestamp: typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp?.relative || 'Recently',
                level: alert.severity === 'critical' ? 'ERROR' : alert.severity === 'major' || alert.severity === 'high' ? 'WARN' : 'INFO',
                source: alert.device?.name || 'System',
                message: alert.aiSummary || alert.aiTitle || 'System event recorded',
                status: alert.status || 'open',
            }));
            setSystemLogs(logs);
        } catch (error) {
            console.error('Failed to fetch system logs:', error);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedTab === 2) {
            fetchSystemLogs();
        }
    }, [selectedTab, fetchSystemLogs]);

    // User management handlers
    const handleOpenAddUser = () => {
        setSelectedUser(null);
        setUserForm({ username: '', email: '', role: 'network-ops', first_name: '', last_name: '' });
        setUserModalOpen(true);
    };

    const handleOpenEditUser = (user: ManagedUser) => {
        setSelectedUser(user);
        setUserForm({
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
        });
        setUserModalOpen(true);
    };

    const handleOpenDeleteUser = (user: ManagedUser) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    const handleOpenResetPassword = (user: ManagedUser) => {
        setSelectedUser(user);
        setResetPasswordModalOpen(true);
    };

    const handleSaveUser = async () => {
        setUserSaving(true);
        try {
            if (selectedUser) {
                // Edit existing user
                await userService.updateUser(selectedUser.id, {
                    username: userForm.username,
                    email: userForm.email,
                    role: userForm.role,
                    first_name: userForm.first_name,
                    last_name: userForm.last_name,
                });
                addToast('success', 'Success', `User "${userForm.username}" updated successfully.`);
            } else {
                // Create new user
                await userService.createUser({
                    username: userForm.username,
                    email: userForm.email,
                    role: userForm.role,
                    first_name: userForm.first_name,
                    last_name: userForm.last_name,
                });
                addToast('success', 'Success', `User "${userForm.username}" created successfully. A temporary password has been generated.`);
            }
            setUserModalOpen(false);
            // Refresh the user list
            await fetchUsers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            addToast('error', 'Error', `Failed to ${selectedUser ? 'update' : 'create'} user: ${message}`);
        } finally {
            setUserSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setUserSaving(true);
        try {
            await userService.deleteUser(selectedUser.id);
            addToast('success', 'Success', `User "${selectedUser.username}" deleted successfully.`);
            setDeleteModalOpen(false);
            await fetchUsers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            addToast('error', 'Error', `Failed to delete user: ${message}`);
        } finally {
            setUserSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        setUserSaving(true);
        try {
            await userService.resetPassword(selectedUser.id);
            addToast('success', 'Success', `Password reset email sent to "${selectedUser.email}".`);
            setResetPasswordModalOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            addToast('error', 'Error', `Failed to reset password: ${message}`);
        } finally {
            setUserSaving(false);
        }
    };

    const handleToggleUserStatus = async (user: ManagedUser) => {
        try {
            await userService.toggleUserStatus(user.id, !user.is_active);
            addToast('success', 'Success', `User "${user.username}" ${user.is_active ? 'deactivated' : 'activated'} successfully.`);
            await fetchUsers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            addToast('error', 'Error', `Failed to update user status: ${message}`);
        }
    };

    // Bulk action handlers
    const extractSelectedIds = (selectedRows: Array<{ id: string }>): string[] =>
        selectedRows.map(row => row.id);

    const handleBulkActivate = async (selectedRows: Array<{ id: string }>) => {
        const ids = extractSelectedIds(selectedRows);
        if (ids.length === 0) return;
        setBulkActionLoading(true);
        let successCount = 0;
        for (const id of ids) {
            try {
                await userService.updateUser(id, { is_active: true });
                successCount++;
            } catch (err) {
                console.error(`Failed to activate user ${id}:`, err);
            }
        }
        setBulkActionLoading(false);
        if (successCount > 0) {
            addToast('success', 'Users Activated', `${successCount} of ${ids.length} user${ids.length > 1 ? 's' : ''} activated successfully.`);
        }
        if (successCount < ids.length) {
            addToast('warning', 'Partial Failure', `${ids.length - successCount} user${ids.length - successCount > 1 ? 's' : ''} could not be activated.`);
        }
        await fetchUsers();
    };

    const handleBulkDeactivate = async (selectedRows: Array<{ id: string }>) => {
        const ids = extractSelectedIds(selectedRows);
        if (ids.length === 0) return;
        setBulkActionLoading(true);
        let successCount = 0;
        for (const id of ids) {
            try {
                await userService.updateUser(id, { is_active: false });
                successCount++;
            } catch (err) {
                console.error(`Failed to deactivate user ${id}:`, err);
            }
        }
        setBulkActionLoading(false);
        if (successCount > 0) {
            addToast('success', 'Users Deactivated', `${successCount} of ${ids.length} user${ids.length > 1 ? 's' : ''} deactivated successfully.`);
        }
        if (successCount < ids.length) {
            addToast('warning', 'Partial Failure', `${ids.length - successCount} user${ids.length - successCount > 1 ? 's' : ''} could not be deactivated.`);
        }
        await fetchUsers();
    };

    const handleBulkDeleteRequest = (selectedRows: Array<{ id: string }>) => {
        const ids = extractSelectedIds(selectedRows);
        if (ids.length === 0) return;
        setPendingBulkDeleteIds(ids);
        setShowBulkDeleteModal(true);
    };

    const handleBulkDeleteConfirm = async () => {
        if (pendingBulkDeleteIds.length === 0) return;
        setBulkActionLoading(true);
        let successCount = 0;
        for (const id of pendingBulkDeleteIds) {
            try {
                await userService.deleteUser(id);
                successCount++;
            } catch (err) {
                console.error(`Failed to delete user ${id}:`, err);
            }
        }
        setBulkActionLoading(false);
        setShowBulkDeleteModal(false);
        setPendingBulkDeleteIds([]);
        if (successCount > 0) {
            addToast('success', 'Users Deleted', `${successCount} of ${pendingBulkDeleteIds.length} user${pendingBulkDeleteIds.length > 1 ? 's' : ''} deleted successfully.`);
        }
        if (successCount < pendingBulkDeleteIds.length) {
            addToast('warning', 'Partial Failure', `${pendingBulkDeleteIds.length - successCount} user${pendingBulkDeleteIds.length - successCount > 1 ? 's' : ''} could not be deleted.`);
        }
        await fetchUsers();
    };

    const handleBulkRoleRequest = (selectedRows: Array<{ id: string }>) => {
        const ids = extractSelectedIds(selectedRows);
        if (ids.length === 0) return;
        setPendingBulkRoleIds(ids);
        setBulkRoleValue('network-ops');
        setShowBulkRoleModal(true);
    };

    const handleBulkRoleConfirm = async () => {
        if (pendingBulkRoleIds.length === 0 || !bulkRoleValue) return;
        setBulkActionLoading(true);
        let successCount = 0;
        for (const id of pendingBulkRoleIds) {
            try {
                await userService.updateUser(id, { role: bulkRoleValue });
                successCount++;
            } catch (err) {
                console.error(`Failed to change role for user ${id}:`, err);
            }
        }
        setBulkActionLoading(false);
        setShowBulkRoleModal(false);
        setPendingBulkRoleIds([]);
        if (successCount > 0) {
            addToast('success', 'Roles Updated', `${successCount} of ${pendingBulkRoleIds.length} user${pendingBulkRoleIds.length > 1 ? 's' : ''} updated to ${getRoleLabel(bulkRoleValue)}.`);
        }
        if (successCount < pendingBulkRoleIds.length) {
            addToast('warning', 'Partial Failure', `${pendingBulkRoleIds.length - successCount} user${pendingBulkRoleIds.length - successCount > 1 ? 's' : ''} could not be updated.`);
        }
        await fetchUsers();
    };

    // Chart options
    const areaChartOptions = useMemo(() =>
        createAreaChartOptions({ title: 'System Load', height: '320px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    const donutChartOptions = useMemo(() =>
        createDonutChartOptions({ title: 'Alert Distribution', height: '300px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    // Donut chart options for ticket distribution by assignee in Overview tab
    const ticketDistDonutOptions = useMemo(() =>
        createDonutChartOptions({ title: 'Tickets by Assignee', height: '280px', theme: currentTheme, showTitle: false }),
        [currentTheme]
    );

    // Per-user performance statistics computed from all alerts & tickets
    const userStatsMap = useMemo<Map<string, UserStats>>(() => {
        const statsMap = new Map<string, UserStats>();

        // Helper to normalise assignee names for matching (lowercase, trimmed)
        const normalise = (name: string | undefined | null): string =>
            (name || '').trim().toLowerCase();

        // Build a set of usernames (lowered) for lookup
        const usernameSet = new Set(users.map(u => normalise(u.username)));
        // Also map full-name -> username for fuzzy matching
        const fullNameToUsername = new Map<string, string>();
        for (const u of users) {
            const fullName = normalise(`${u.first_name} ${u.last_name}`);
            if (fullName.trim()) {
                fullNameToUsername.set(fullName, normalise(u.username));
            }
        }

        // Resolve an assignee string to a normalised username
        const resolveAssignee = (raw: string | undefined | null): string | null => {
            const n = normalise(raw);
            if (!n || n === 'unassigned' || n === 'system') return null;
            if (usernameSet.has(n)) return n;
            // Try full name match
            if (fullNameToUsername.has(n)) return fullNameToUsername.get(n) || null;
            // Partial match: check if the raw string contains any username
            for (const uname of usernameSet) {
                if (n.includes(uname) || uname.includes(n)) return uname;
            }
            return n; // Return as-is -- may be an external assignee
        };

        // Initialise stats for all known users
        for (const u of users) {
            statsMap.set(normalise(u.username), {
                alertsAssigned: 0,
                ticketsOpen: 0,
                ticketsResolved: 0,
                ticketsClosed: 0,
                ticketsTotal: 0,
                avgResolutionHours: null,
            });
        }

        // Count alerts by assignee
        for (const alert of allAlerts) {
            const assignee = resolveAssignee(alert.assignee || alert.assigned_to);
            if (assignee && statsMap.has(assignee)) {
                statsMap.get(assignee)!.alertsAssigned++;
            }
        }

        // Count tickets by assignee and compute avg resolution time
        const resolutionHoursPerUser = new Map<string, number[]>();
        for (const ticket of allTickets) {
            const assignee = resolveAssignee(ticket.assignedTo);
            if (!assignee) continue;

            if (!statsMap.has(assignee)) {
                // External assignee not in users list -- skip
                continue;
            }

            const stats = statsMap.get(assignee)!;
            stats.ticketsTotal++;

            if (ticket.status === 'open') stats.ticketsOpen++;
            else if (ticket.status === 'resolved') stats.ticketsResolved++;
            else if (ticket.status === 'closed') stats.ticketsClosed++;

            // Compute resolution time for resolved/closed tickets
            if ((ticket.status === 'resolved' || ticket.status === 'closed') && ticket.createdAt && ticket.updatedAt) {
                const created = new Date(ticket.createdAt).getTime();
                const updated = new Date(ticket.updatedAt).getTime();
                if (!isNaN(created) && !isNaN(updated) && updated > created) {
                    const hours = (updated - created) / (1000 * 60 * 60);
                    if (!resolutionHoursPerUser.has(assignee)) {
                        resolutionHoursPerUser.set(assignee, []);
                    }
                    resolutionHoursPerUser.get(assignee)!.push(hours);
                }
            }
        }

        // Compute average resolution hours
        for (const [username, hours] of resolutionHoursPerUser.entries()) {
            if (hours.length > 0 && statsMap.has(username)) {
                const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
                statsMap.get(username)!.avgResolutionHours = Math.round(avg * 10) / 10;
            }
        }

        return statsMap;
    }, [users, allAlerts, allTickets]);

    // Top performers for the Overview tab -- sorted by tickets resolved descending
    const topPerformers = useMemo(() => {
        return users
            .map(u => {
                const stats = userStatsMap.get(u.username.trim().toLowerCase());
                return {
                    id: u.id,
                    username: u.username,
                    fullName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
                    role: u.role,
                    ticketsResolved: stats?.ticketsResolved ?? 0,
                    ticketsTotal: stats?.ticketsTotal ?? 0,
                    alertsAssigned: stats?.alertsAssigned ?? 0,
                    avgResolutionHours: stats?.avgResolutionHours,
                };
            })
            .filter(u => u.ticketsResolved > 0 || u.alertsAssigned > 0)
            .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
            .slice(0, 10);
    }, [users, userStatsMap]);

    // Donut chart data for ticket distribution by assignee (Overview tab)
    const ticketDistByAssignee = useMemo(() => {
        const distribution: Array<{ group: string; value: number }> = [];
        for (const u of users) {
            const stats = userStatsMap.get(u.username.trim().toLowerCase());
            const total = stats?.ticketsTotal ?? 0;
            if (total > 0) {
                const displayName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username;
                distribution.push({ group: displayName, value: total });
            }
        }
        // Also count unassigned tickets
        const assignedTotal = distribution.reduce((s, d) => s + d.value, 0);
        const unassigned = allTickets.length - assignedTotal;
        if (unassigned > 0) {
            distribution.push({ group: 'Unassigned', value: unassigned });
        }
        return distribution.sort((a, b) => b.value - a.value);
    }, [users, allTickets, userStatsMap]);

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

    // Filter and paginate users
    const filteredUsers = useMemo(() => {
        if (!userSearchQuery.trim()) return users;
        const query = userSearchQuery.toLowerCase();
        return users.filter(u =>
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query) ||
            u.first_name.toLowerCase().includes(query) ||
            u.last_name.toLowerCase().includes(query)
        );
    }, [users, userSearchQuery]);

    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * userPageSize;
        return filteredUsers.slice(start, start + userPageSize);
    }, [filteredUsers, userPage, userPageSize]);

    // Transform users to DataTable rows
    const userTableRows: UserRow[] = useMemo(() =>
        paginatedUsers.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            status: u.is_active ? 'active' : 'inactive',
            lastLogin: u.last_login || 'Never',
            actions: '',
        })),
        [paginatedUsers]
    );

    // System logs table rows
    const logHeaders = [
        { key: 'timestamp', header: 'Time' },
        { key: 'level', header: 'Level' },
        { key: 'source', header: 'Source' },
        { key: 'message', header: 'Message' },
        { key: 'status', header: 'Status' },
    ];

    // Form validation
    const isFormValid = userForm.username.trim().length > 0
        && userForm.email.trim().length > 0
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email);

    // Loading skeleton -- only show on initial load, not on refetch intervals
    if (isLoading && metrics.totalDevices === 0 && alertsOverTime.length === 0) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-page__content">
                    <PageHeader
                        title="System Administration"
                        subtitle="Full system overview, configuration, and security auditing"
                        badges={[{ text: 'System Operational', color: '#24a148' }]}
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
                <PageHeader
                    title="System Administration"
                    subtitle="Full system overview, configuration, and security auditing"
                    badges={[metrics.systemHealth > 80
                        ? { text: 'System Operational', color: '#24a148' }
                        : { text: 'System Degraded', color: '#ee5396' }
                    ]}
                />

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
                        <TabPanel className="dashboard-tab-panel">
                            {/* Charts Row: Alert Trends + Severity Distribution side by side */}
                            <div className="charts-row">
                                <Tile className="chart-tile">
                                    <div className="chart-header">
                                        <h3>Alert Trends</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ChartWrapper
                                            ChartComponent={StackedAreaChart}
                                            data={alertsOverTime}
                                            options={areaChartOptions}
                                            height="320px"
                                            emptyMessage="No alert data available"
                                        />
                                    </div>
                                </Tile>

                                <Tile className="chart-tile">
                                    <div className="chart-header">
                                        <h3>Severity Distribution</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ChartWrapper
                                            ChartComponent={DonutChart}
                                            data={severityDist}
                                            options={donutChartOptions}
                                            height="300px"
                                            emptyMessage="No distribution data"
                                        />
                                    </div>
                                </Tile>
                            </div>

                            {/* Bottom Row: Top Interfaces + Config Audit Log side by side */}
                            <div className="bottom-row">
                                <Tile className="bottom-tile">
                                    <WidgetErrorBoundary widgetName="Top Interfaces">
                                        <TopInterfaces />
                                    </WidgetErrorBoundary>
                                </Tile>
                                <Tile className="bottom-tile">
                                    <WidgetErrorBoundary widgetName="Config Audit Log">
                                        <ConfigAuditLog />
                                    </WidgetErrorBoundary>
                                </Tile>
                            </div>

                            {/* Activity Table */}
                            <div className="dashboard-section">
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
                                                            <TableCell colSpan={5}>
                                                                <EmptyState
                                                                    icon={Activity}
                                                                    title="No recent activity"
                                                                    description="System events will appear here as they occur"
                                                                    size="sm"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        rows.map((row) => {
                                                            const activity = recentActivity.find(a => a.id === row.id);
                                                            if (!activity) return null;
                                                            return (
                                                                <TableRow {...getRowProps({ row })} key={row.id}>
                                                                    <TableCell style={{ fontWeight: 600 }}>{activity.user}</TableCell>
                                                                    <TableCell>
                                                                        <span
                                                                            style={{ cursor: 'pointer', color: 'var(--cds-link-primary)' }}
                                                                            role="link"
                                                                            tabIndex={0}
                                                                            onClick={() => navigate(`/alerts/${activity.id}`)}
                                                                            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/alerts/${activity.id}`); }}
                                                                        >
                                                                            {activity.action}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span
                                                                            style={{ cursor: 'pointer', color: 'var(--cds-link-primary)' }}
                                                                            role="link"
                                                                            tabIndex={0}
                                                                            onClick={() => navigate(`/devices?search=${encodeURIComponent(activity.resource)}`)}
                                                                            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/devices?search=${encodeURIComponent(activity.resource)}`); }}
                                                                        >
                                                                            {activity.resource}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Tag type={activity.status === 'acknowledged' ? 'green' : activity.status === 'open' ? 'red' : 'gray'} size="sm">
                                                                            {activity.status}
                                                                        </Tag>
                                                                    </TableCell>
                                                                    <TableCell style={{ color: 'var(--cds-text-secondary)' }}>
                                                                        {typeof activity.timestamp === 'string' ? activity.timestamp : 'N/A'}
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
                            </div>

                            {/* User Performance Section */}
                            <div className="dashboard-section">
                                <h3 className="dashboard-section__title">
                                    User Performance
                                </h3>
                                <div className="charts-row">
                                    {/* Left: Top Performers Table */}
                                    <Tile className="chart-tile">
                                        <div className="chart-header">
                                            <h4>Top Performers</h4>
                                        </div>
                                        {topPerformers.length === 0 ? (
                                            <EmptyState
                                                icon={UserMultiple}
                                                title="No performance data yet"
                                                description="User performance metrics will appear once tickets and alerts are assigned"
                                                size="sm"
                                            />
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '2px solid var(--cds-border-subtle-01)' }}>
                                                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>User</th>
                                                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>Tickets Resolved</th>
                                                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>Alerts</th>
                                                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>Avg Resolution</th>
                                                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>Role</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {topPerformers.map((performer, idx) => (
                                                            <tr key={performer.id} style={{ borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
                                                                <td style={{ padding: '0.5rem 0.75rem' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <div style={{
                                                                            width: '24px', height: '24px', borderRadius: '50%',
                                                                            background: idx === 0 ? '#0f62fe' : idx === 1 ? '#8a3ffc' : 'var(--cds-layer-accent-01)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: '0.6875rem', fontWeight: 700, color: idx < 2 ? '#fff' : 'var(--cds-text-primary)',
                                                                            flexShrink: 0,
                                                                        }}>
                                                                            {idx + 1}
                                                                        </div>
                                                                        <span style={{ fontWeight: 500 }}>{performer.fullName}</span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                                                    {performer.ticketsResolved}
                                                                </td>
                                                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                                                    {performer.alertsAssigned}
                                                                </td>
                                                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
                                                                    {performer.avgResolutionHours != null ? `${performer.avgResolutionHours}h` : '--'}
                                                                </td>
                                                                <td style={{ padding: '0.5rem 0.75rem' }}>
                                                                    <Tag type={getRoleTagType(performer.role)} size="sm">
                                                                        {getRoleLabel(performer.role)}
                                                                    </Tag>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </Tile>
                                    {/* Right: Ticket Distribution Donut Chart */}
                                    <Tile className="chart-tile">
                                        <div className="chart-header">
                                            <h4>Ticket Distribution by Assignee</h4>
                                        </div>
                                        <div className="chart-container">
                                            <ChartWrapper
                                                ChartComponent={DonutChart}
                                                data={ticketDistByAssignee}
                                                options={ticketDistDonutOptions}
                                                height="280px"
                                                emptyMessage="No ticket assignment data available"
                                            />
                                        </div>
                                    </Tile>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Users & Roles Tab */}
                        <TabPanel className="dashboard-tab-panel">
                            {/* User Statistics */}
                            <div className="kpi-row">
                                <KPICard
                                    label="Total Users"
                                    value={users.length}
                                    icon={UserMultiple}
                                    iconColor="#0f62fe"
                                    severity="info"
                                />
                                <KPICard
                                    label="Active"
                                    value={users.filter(u => u.is_active).length}
                                    icon={CheckmarkFilled}
                                    iconColor="#24a148"
                                    severity="success"
                                />
                                <KPICard
                                    label="Admins"
                                    value={users.filter(u => u.role === 'sysadmin').length}
                                    icon={Security}
                                    iconColor="#8a3ffc"
                                    severity="info"
                                />
                            </div>

                            {/* Users Table with Expandable Rows */}
                            {usersLoading && users.length === 0 ? (
                                <DataTableSkeleton columnCount={6} rowCount={5} showHeader showToolbar />
                            ) : (
                                <>
                                    <DataTable rows={userTableRows} headers={USER_HEADERS} isSortable>
                                        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getSelectionProps, getBatchActionProps, getExpandHeaderProps, selectedRows, onInputChange }) => {
                                            const batchActionProps = getBatchActionProps();
                                            return (
                                            <TableContainer title="User Management" description="Manage system users, roles, and permissions. Expand a row to see per-user performance stats.">
                                                <TableToolbar>
                                                    <TableBatchActions
                                                        {...batchActionProps}
                                                    >
                                                        <TableBatchAction
                                                            tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                                            renderIcon={Power}
                                                            onClick={() => handleBulkActivate(selectedRows)}
                                                            disabled={bulkActionLoading}
                                                        >
                                                            Activate
                                                        </TableBatchAction>
                                                        <TableBatchAction
                                                            tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                                            renderIcon={Power}
                                                            onClick={() => handleBulkDeactivate(selectedRows)}
                                                            disabled={bulkActionLoading}
                                                        >
                                                            Deactivate
                                                        </TableBatchAction>
                                                        <TableBatchAction
                                                            tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                                            renderIcon={UserRole}
                                                            onClick={() => handleBulkRoleRequest(selectedRows)}
                                                            disabled={bulkActionLoading}
                                                        >
                                                            Change Role
                                                        </TableBatchAction>
                                                        <TableBatchAction
                                                            tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                                            renderIcon={TrashCan}
                                                            onClick={() => handleBulkDeleteRequest(selectedRows)}
                                                            disabled={bulkActionLoading}
                                                        >
                                                            Delete
                                                        </TableBatchAction>
                                                    </TableBatchActions>
                                                    <TableToolbarContent>
                                                        <TableToolbarSearch
                                                            onChange={(e: any) => {
                                                                onInputChange(e);
                                                                setUserSearchQuery(e.target?.value || '');
                                                                setUserPage(1);
                                                            }}
                                                            placeholder="Search users..."
                                                        />
                                                        <Button kind="primary" size="md" renderIcon={Add} onClick={handleOpenAddUser}>
                                                            Add User
                                                        </Button>
                                                    </TableToolbarContent>
                                                </TableToolbar>
                                                <Table {...getTableProps()}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableExpandHeader
                                                                {...getExpandHeaderProps()}
                                                                aria-label="Expand row"
                                                            />
                                                            <TableSelectAll {...getSelectionProps()} />
                                                            {headers.map((header) => (
                                                                <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                                    {header.header}
                                                                </TableHeader>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {rows.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={headers.length + 2}>
                                                                    {users.length === 0 ? (
                                                                        <EmptyState
                                                                            icon={UserAvatar}
                                                                            title="No users found"
                                                                            description="The user management API may not be available yet"
                                                                            size="md"
                                                                        />
                                                                    ) : (
                                                                        <EmptyState
                                                                            icon={UserAvatar}
                                                                            title={`No users matching "${userSearchQuery}"`}
                                                                            description="Try adjusting your search criteria"
                                                                            size="sm"
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            rows.map((row) => {
                                                                const user = paginatedUsers.find(u => u.id === row.id);
                                                                if (!user) return null;
                                                                const stats = userStatsMap.get(user.username.trim().toLowerCase());
                                                                const rolePerms = ROLE_PERMISSIONS[user.role as RoleID] || [];
                                                                return (
                                                                    <React.Fragment key={row.id}>
                                                                        <TableExpandRow {...getRowProps({ row })}>
                                                                            <TableSelectRow {...getSelectionProps({ row })} />
                                                                            <TableCell style={{ fontWeight: 600 }}>
                                                                                <div>
                                                                                    <span>{user.username}</span>
                                                                                    {user.first_name && (
                                                                                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                                                                            {user.first_name} {user.last_name}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>{user.email}</TableCell>
                                                                            <TableCell>
                                                                                <Tag type={getRoleTagType(user.role)} size="sm">
                                                                                    {getRoleLabel(user.role)}
                                                                                </Tag>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Tag type={user.is_active ? 'green' : 'gray'} size="sm">
                                                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                                                </Tag>
                                                                            </TableCell>
                                                                            <TableCell style={{ color: 'var(--cds-text-secondary)' }}>
                                                                                {user.last_login || 'Never'}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <OverflowMenu flipped size="sm" ariaLabel="User actions">
                                                                                    <OverflowMenuItem itemText="Edit user" onClick={() => handleOpenEditUser(user)} />
                                                                                    <OverflowMenuItem itemText="Reset password" onClick={() => handleOpenResetPassword(user)} />
                                                                                    <OverflowMenuItem
                                                                                        itemText={user.is_active ? 'Deactivate' : 'Activate'}
                                                                                        onClick={() => handleToggleUserStatus(user)}
                                                                                    />
                                                                                    <OverflowMenuItem isDelete itemText="Delete user" onClick={() => handleOpenDeleteUser(user)} />
                                                                                </OverflowMenu>
                                                                            </TableCell>
                                                                        </TableExpandRow>

                                                                        {/* Expanded row: Per-user performance dashboard */}
                                                                        <TableExpandedRow colSpan={headers.length + 2}>
                                                                            <div style={{ padding: '1rem 0.5rem' }}>
                                                                                {/* Stats cards row */}
                                                                                <div style={{
                                                                                    display: 'grid',
                                                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                                                    gap: '0.75rem',
                                                                                    marginBottom: '1rem',
                                                                                }}>
                                                                                    {/* Alerts Assigned */}
                                                                                    <div style={{
                                                                                        background: 'var(--cds-layer-02)',
                                                                                        borderRadius: '4px',
                                                                                        padding: '0.75rem',
                                                                                        borderLeft: '3px solid #da1e28',
                                                                                    }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                                            <Warning size={16} style={{ color: '#da1e28' }} />
                                                                                            <span style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.32px' }}>Alerts Assigned</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                                                                            {stats?.alertsAssigned ?? 0}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Tickets Open */}
                                                                                    <div style={{
                                                                                        background: 'var(--cds-layer-02)',
                                                                                        borderRadius: '4px',
                                                                                        padding: '0.75rem',
                                                                                        borderLeft: '3px solid #0f62fe',
                                                                                    }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                                            <Ticket size={16} style={{ color: '#0f62fe' }} />
                                                                                            <span style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.32px' }}>Tickets Open</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                                                                            {stats?.ticketsOpen ?? 0}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Tickets Resolved */}
                                                                                    <div style={{
                                                                                        background: 'var(--cds-layer-02)',
                                                                                        borderRadius: '4px',
                                                                                        padding: '0.75rem',
                                                                                        borderLeft: '3px solid #24a148',
                                                                                    }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                                            <CheckmarkFilled size={16} style={{ color: '#24a148' }} />
                                                                                            <span style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.32px' }}>Tickets Resolved</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                                                                            {stats?.ticketsResolved ?? 0}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Avg Resolution Time */}
                                                                                    <div style={{
                                                                                        background: 'var(--cds-layer-02)',
                                                                                        borderRadius: '4px',
                                                                                        padding: '0.75rem',
                                                                                        borderLeft: '3px solid #8a3ffc',
                                                                                    }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                                            <Time size={16} style={{ color: '#8a3ffc' }} />
                                                                                            <span style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.32px' }}>Avg Resolution</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                                                                            {stats?.avgResolutionHours != null ? `${stats.avgResolutionHours}h` : '--'}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Last Activity */}
                                                                                    <div style={{
                                                                                        background: 'var(--cds-layer-02)',
                                                                                        borderRadius: '4px',
                                                                                        padding: '0.75rem',
                                                                                        borderLeft: '3px solid #009d9a',
                                                                                    }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                                            <Activity size={16} style={{ color: '#009d9a' }} />
                                                                                            <span style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.32px' }}>Last Login</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                            {user.last_login || 'Never'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Role Permissions tags */}
                                                                                <div style={{ marginBottom: '0.75rem' }}>
                                                                                    <span style={{
                                                                                        fontSize: '0.6875rem',
                                                                                        fontWeight: 600,
                                                                                        color: 'var(--cds-text-secondary)',
                                                                                        textTransform: 'uppercase',
                                                                                        letterSpacing: '0.32px',
                                                                                        display: 'block',
                                                                                        marginBottom: '0.375rem',
                                                                                    }}>
                                                                                        Role Permissions
                                                                                    </span>
                                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                                                        {rolePerms.length > 0 ? (
                                                                                            rolePerms.map(perm => (
                                                                                                <Tag key={perm} type="blue" size="sm">
                                                                                                    {getPermissionLabel(perm)}
                                                                                                </Tag>
                                                                                            ))
                                                                                        ) : (
                                                                                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                                                                                No permissions defined for this role
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* View Profile button */}
                                                                                <Button
                                                                                    kind="ghost"
                                                                                    size="sm"
                                                                                    renderIcon={UserAvatar}
                                                                                    onClick={() => {
                                                                                        addToast('info', 'Profile', `Profile view for "${user.username}" is not yet available.`);
                                                                                    }}
                                                                                >
                                                                                    View Profile
                                                                                </Button>
                                                                            </div>
                                                                        </TableExpandedRow>
                                                                    </React.Fragment>
                                                                );
                                                            })
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            );
                                        }}
                                    </DataTable>

                                    {filteredUsers.length > userPageSize && (
                                        <Pagination
                                            totalItems={filteredUsers.length}
                                            pageSize={userPageSize}
                                            pageSizes={[5, 10, 20, 50]}
                                            page={userPage}
                                            onChange={({ page, pageSize }: { page: number; pageSize: number }) => {
                                                setUserPage(page);
                                                setUserPageSize(pageSize);
                                            }}
                                        />
                                    )}
                                </>
                            )}

                            {/* Role Permissions Matrix - Editable */}
                            <Tile className="section-tile">
                                <div className="chart-header">
                                    <h4><Settings size={20} /> Role Permissions Matrix</h4>
                                </div>
                                <div className="permissions-matrix-wrapper">
                                    <table className="permissions-matrix">
                                        <thead>
                                            <tr>
                                                <th className="permissions-matrix__role-col">Role</th>
                                                {PERM_COLUMN_LABELS.map((label) => (
                                                    <th key={label} className="permissions-matrix__perm-col">{label}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {PERM_ROLES.map(({ roleId, label }) => {
                                                const isSysadmin = roleId === 'sysadmin';
                                                const perms = rolePermissions[roleId] || [];
                                                return (
                                                    <tr key={roleId}>
                                                        <td className="permissions-matrix__role-cell">
                                                            <Tag type={getRoleTagType(roleId)} size="sm">{label}</Tag>
                                                        </td>
                                                        {perms.map((enabled, i) => (
                                                            <td key={i} className="permissions-matrix__toggle-cell">
                                                                {isSysadmin ? (
                                                                    <Tag type="green" size="sm">Always</Tag>
                                                                ) : (
                                                                    <Toggle
                                                                        id={`perm-${roleId}-${i}`}
                                                                        size="sm"
                                                                        labelA=""
                                                                        labelB=""
                                                                        toggled={enabled}
                                                                        onToggle={() => handlePermissionToggle(roleId, i)}
                                                                    />
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Tile>
                        </TabPanel>

                        {/* System Logs Tab */}
                        <TabPanel className="dashboard-tab-panel">
                            {logsLoading && systemLogs.length === 0 ? (
                                <DataTableSkeleton columnCount={5} rowCount={8} showHeader showToolbar />
                            ) : (
                                <>
                                    <DataTable rows={systemLogs} headers={logHeaders} isSortable>
                                        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                            <TableContainer title="System Audit Trail" description="Recent system events, alert activity, and configuration changes">
                                                <TableToolbar>
                                                    <TableToolbarContent>
                                                        <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
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
                                                        {systemLogs.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={5}>
                                                                    <EmptyState
                                                                        icon={Devices}
                                                                        title="No system logs available"
                                                                        description="Logs will appear here once system events are recorded"
                                                                        size="md"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            rows.map((row) => {
                                                                const log = systemLogs.find(l => l.id === row.id);
                                                                if (!log) return null;
                                                                return (
                                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                                        <TableCell className="cell-timestamp">
                                                                            {log.timestamp}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Tag
                                                                                type={log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'gray' : 'blue'}
                                                                                size="sm"
                                                                            >
                                                                                {log.level}
                                                                            </Tag>
                                                                        </TableCell>
                                                                        <TableCell className="cell-device">
                                                                            <span
                                                                                className="device-link"
                                                                                role="link"
                                                                                tabIndex={0}
                                                                                onClick={() => navigate(`/devices?search=${encodeURIComponent(log.source)}`)}
                                                                                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/devices?search=${encodeURIComponent(log.source)}`); }}
                                                                            >
                                                                                {log.source}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="cell-summary">
                                                                            <div className="summary-truncate" title={log.message}>
                                                                                {log.message}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Tag type={log.status === 'resolved' ? 'green' : log.status === 'acknowledged' ? 'blue' : 'gray'} size="sm">
                                                                                {log.status}
                                                                            </Tag>
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

                                    {/* Config Audit Log below */}
                                    <div className="dashboard-section">
                                        <WidgetErrorBoundary widgetName="Config Audit Log">
                                            <ConfigAuditLog />
                                        </WidgetErrorBoundary>
                                    </div>
                                </>
                            )}
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
                    primaryButtonText={userSaving ? 'Saving...' : (selectedUser ? 'Save Changes' : 'Create User')}
                    secondaryButtonText="Cancel"
                    primaryButtonDisabled={!isFormValid || userSaving}
                    size="md"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <TextInput
                                id="user-first-name"
                                labelText="First Name"
                                value={userForm.first_name}
                                onChange={(e) => setUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                                placeholder="John"
                            />
                            <TextInput
                                id="user-last-name"
                                labelText="Last Name"
                                value={userForm.last_name}
                                onChange={(e) => setUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                                placeholder="Doe"
                            />
                        </div>
                        <TextInput
                            id="user-username"
                            labelText="Username"
                            value={userForm.username}
                            onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter username"
                            required
                            invalid={userForm.username.length > 0 && userForm.username.trim().length === 0}
                            invalidText="Username is required"
                        />
                        <TextInput
                            id="user-email"
                            labelText="Email Address"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@company.com"
                            required
                            invalid={userForm.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)}
                            invalidText="Please enter a valid email address"
                        />
                        <Select
                            id="user-role"
                            labelText="Role"
                            value={userForm.role}
                            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                        >
                            {ROLE_OPTIONS.map(role => (
                                <SelectItem key={role.value} value={role.value} text={role.label} />
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
                    primaryButtonText={userSaving ? 'Deleting...' : 'Delete'}
                    secondaryButtonText="Cancel"
                    primaryButtonDisabled={userSaving}
                    danger
                    size="sm"
                >
                    <p style={{ padding: '1rem 0' }}>
                        Are you sure you want to delete the user <strong>"{selectedUser?.username}"</strong>?
                        This action cannot be undone.
                    </p>
                </Modal>

                {/* Reset Password Confirmation Modal */}
                <Modal
                    open={resetPasswordModalOpen}
                    onRequestClose={() => setResetPasswordModalOpen(false)}
                    onRequestSubmit={handleResetPassword}
                    modalHeading="Reset Password"
                    modalLabel="User Management"
                    primaryButtonText={userSaving ? 'Sending...' : 'Reset Password'}
                    secondaryButtonText="Cancel"
                    primaryButtonDisabled={userSaving}
                    size="sm"
                >
                    <p style={{ padding: '1rem 0' }}>
                        This will send a password reset email to <strong>{selectedUser?.email}</strong>.
                        The user will need to set a new password using the link in the email.
                    </p>
                </Modal>

                {/* Bulk Delete Confirmation Modal */}
                <Modal
                    open={showBulkDeleteModal}
                    onRequestClose={() => {
                        setShowBulkDeleteModal(false);
                        setPendingBulkDeleteIds([]);
                    }}
                    onRequestSubmit={handleBulkDeleteConfirm}
                    modalHeading="Delete Selected Users"
                    modalLabel="Bulk Action"
                    primaryButtonText={bulkActionLoading ? 'Deleting...' : `Delete ${pendingBulkDeleteIds.length} User${pendingBulkDeleteIds.length !== 1 ? 's' : ''}`}
                    secondaryButtonText="Cancel"
                    primaryButtonDisabled={bulkActionLoading}
                    danger
                    size="sm"
                >
                    <div style={{ padding: '1rem 0' }}>
                        <p style={{ marginBottom: '0.75rem' }}>
                            Are you sure you want to delete <strong>{pendingBulkDeleteIds.length}</strong> selected user{pendingBulkDeleteIds.length !== 1 ? 's' : ''}? This action cannot be undone.
                        </p>
                        {pendingBulkDeleteIds.length > 0 && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                                <p style={{ marginBottom: '0.5rem' }}>The following users will be deleted:</p>
                                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                                    {pendingBulkDeleteIds.map(id => {
                                        const user = users.find(u => u.id === id);
                                        return (
                                            <li key={id}>
                                                {user ? `${user.username} (${user.email})` : id}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Bulk Role Change Modal */}
                <Modal
                    open={showBulkRoleModal}
                    onRequestClose={() => {
                        setShowBulkRoleModal(false);
                        setPendingBulkRoleIds([]);
                    }}
                    onRequestSubmit={handleBulkRoleConfirm}
                    modalHeading="Change Role for Selected Users"
                    modalLabel="Bulk Action"
                    primaryButtonText={bulkActionLoading ? 'Updating...' : `Update ${pendingBulkRoleIds.length} User${pendingBulkRoleIds.length !== 1 ? 's' : ''}`}
                    secondaryButtonText="Cancel"
                    primaryButtonDisabled={bulkActionLoading || !bulkRoleValue}
                    size="sm"
                >
                    <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p>
                            Select the new role for <strong>{pendingBulkRoleIds.length}</strong> selected user{pendingBulkRoleIds.length !== 1 ? 's' : ''}.
                        </p>
                        <Select
                            id="bulk-role-select"
                            labelText="New Role"
                            value={bulkRoleValue}
                            onChange={(e) => setBulkRoleValue(e.target.value)}
                        >
                            {ROLE_OPTIONS.map(role => (
                                <SelectItem key={role.value} value={role.value} text={role.label} />
                            ))}
                        </Select>
                        {pendingBulkRoleIds.length > 0 && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                                <p style={{ marginBottom: '0.5rem' }}>Affected users:</p>
                                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                                    {pendingBulkRoleIds.map(id => {
                                        const user = users.find(u => u.id === id);
                                        return (
                                            <li key={id}>
                                                {user ? `${user.username} (currently: ${getRoleLabel(user.role)})` : id}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export default SysAdminView;
