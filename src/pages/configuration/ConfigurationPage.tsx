import { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Toggle,
    Tag,
    DataTable,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableContainer,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,

    DataTableSkeleton,
    OverflowMenu,
    OverflowMenuItem,
    TableExpandRow,
    TableExpandedRow,
    TableExpandHeader,
    Modal,
    TextInput,
    Select,
    SelectItem,
    TextArea,
    NumberInput,
} from '@carbon/react';
import React from 'react';
import { useToast } from '@/contexts';
import {
    Add,
    Upload,
    SettingsAdjust,
    NotificationNew,
    LogoSlack,
    Email,
    Phone,
} from '@carbon/icons-react';
import { PageHeader } from '@/components/ui';
import { HttpService } from '@/shared/api';
import { env, API_ENDPOINTS } from '@/shared/config';
import '@/styles/pages/_configuration.scss';

// Thin wrapper around HttpService to expose its protected methods for direct usage.
// This ensures auth headers are automatically included and 401s are handled.
class ConfigHttpClient extends HttpService {
    constructor() {
        super(`${env.apiBaseUrl}/api/${env.apiVersion}`, 'ConfigurationPage');
    }
    // Expose protected methods as public for direct usage
    async fetchGet<T>(endpoint: string): Promise<T> { return this.get<T>(endpoint); }
    async fetchPost<T>(endpoint: string, data: unknown): Promise<T> { return this.post<T>(endpoint, data); }
    async fetchPut<T>(endpoint: string, data: unknown): Promise<T> { return this.put<T>(endpoint, data); }
    async fetchDelete<T>(endpoint: string): Promise<T> { return this.delete<T>(endpoint); }
}
const httpClient = new ConfigHttpClient();

// Types
interface Rule { id: string; name: string; description: string; condition: string; duration: string; severity: string; enabled: boolean; }
interface Channel { id: string; name: string; type: string; meta: string; active: boolean; }
interface Policy { id: string; name: string; description: string; steps: number; active: boolean; }
interface Maintenance { id: string; name: string; schedule: string; duration: string; status: string; }

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = { Slack: LogoSlack, Email, Twilio: Phone };

// Structured condition options
const CONDITION_METRICS = [
    { value: 'CPU', label: 'CPU Utilization', unit: '%' },
    { value: 'Memory', label: 'Memory Usage', unit: '%' },
    { value: 'Disk', label: 'Disk Usage', unit: '%' },
    { value: 'Bandwidth', label: 'Bandwidth Usage', unit: '%' },
    { value: 'Latency', label: 'Network Latency', unit: 'ms' },
    { value: 'Packet Loss', label: 'Packet Loss', unit: '%' },
    { value: 'Interface Errors', label: 'Interface Errors', unit: '/min' },
    { value: 'Response Time', label: 'Response Time', unit: 'ms' },
    { value: 'Temperature', label: 'Temperature', unit: '°C' },
];
const CONDITION_OPERATORS = ['>', '<', '>=', '<=', '==', '!='];

const parseCondition = (condition: string) => {
    const match = condition.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(\d+)/);
    if (match) {
        return { metric: match[1].trim(), operator: match[2], value: parseInt(match[3]) };
    }
    return { metric: 'CPU', operator: '>', value: 90 };
};

const composeCondition = (metric: string, operator: string, value: number) => {
    const metricDef = CONDITION_METRICS.find(m => m.value === metric);
    const unit = metricDef?.unit || '';
    return `${metric} ${operator} ${value}${unit}`;
};

// Table Headers
const RULES_HEADERS = [
    { header: 'Status', key: 'enabled' },
    { header: 'Rule Name', key: 'name' },
    { header: 'Condition', key: 'condition' },
    { header: 'Severity', key: 'severity' },
    { header: 'Actions', key: 'actions' },
];

const CHANNELS_HEADERS = [
    { header: 'Type', key: 'type' },
    { header: 'Channel Name', key: 'name' },
    { header: 'Status', key: 'status' },
    { header: 'Active', key: 'active' },
    { header: '', key: 'actions' },
];

const POLICIES_HEADERS = [
    { header: 'Policy Name', key: 'name' },
    { header: 'Description', key: 'description' },
    { header: 'Steps', key: 'steps' },
    { header: 'Active', key: 'active' },
    { header: '', key: 'actions' },
];

const MAINTENANCE_HEADERS = [
    { header: 'Name', key: 'name' },
    { header: 'Schedule', key: 'schedule' },
    { header: 'Duration', key: 'duration' },
    { header: 'Status', key: 'status' },
    { header: '', key: 'actions' },
];

export function ConfigurationPage() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Error state for failed API calls -- shown as a retry banner
    const [loadError, setLoadError] = useState<string | null>(null);
    const [globalSettings, setGlobalSettings] = useState({
        maintenanceMode: false, autoResolve: true, aiCorrelation: true,
    });
    const [selectedTab, setSelectedTab] = useState(0);

    // Rule modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [editForm, setEditForm] = useState({
        name: '', description: '',
        conditionMetric: 'CPU', conditionOperator: '>', conditionValue: 90,
        durationValue: 5, durationUnit: 'minutes',
        severity: 'warning',
    });

    // Channel modal states
    const [channelModalOpen, setChannelModalOpen] = useState(false);
    const [channelDeleteOpen, setChannelDeleteOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [channelForm, setChannelForm] = useState({ name: '', type: 'Slack', meta: '' });
    const [channelIsEdit, setChannelIsEdit] = useState(false);

    // Policy modal states
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyDeleteOpen, setPolicyDeleteOpen] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [policyForm, setPolicyForm] = useState({ name: '', description: '', steps: 1 });
    const [policyIsEdit, setPolicyIsEdit] = useState(false);

    // Maintenance modal states
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceDeleteOpen, setMaintenanceDeleteOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
    const [maintenanceForm, setMaintenanceForm] = useState({ name: '', scheduleDayOfWeek: 'Sunday', scheduleHour: 2, scheduleMinute: 0, durationValue: 2, durationUnit: 'hours', status: 'scheduled' });
    const [maintenanceIsEdit, setMaintenanceIsEdit] = useState(false);

    const { addToast } = useToast();

    // Fetch global settings from backend API on mount
    const fetchGlobalSettings = useCallback(async () => {
        try {
            const data = await httpClient.fetchGet<{ maintenance_mode?: boolean; auto_resolve_enabled?: boolean; ai_correlation_enabled?: boolean }>(API_ENDPOINTS.CONFIG_GLOBAL_SETTINGS);
            setGlobalSettings({
                maintenanceMode: data.maintenance_mode ?? false,
                autoResolve: data.auto_resolve_enabled ?? true,
                aiCorrelation: data.ai_correlation_enabled ?? true,
            });
            return;
        } catch {
            // API unreachable — fall back to localStorage
        }
        // Fallback: try localStorage if API failed
        try {
            const stored = localStorage.getItem('global-config-settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                setGlobalSettings({
                    maintenanceMode: parsed.maintenanceMode ?? false,
                    autoResolve: parsed.autoResolve ?? true,
                    aiCorrelation: parsed.aiCorrelation ?? true,
                });
            }
        } catch {
            // Use defaults already set in useState
        }
    }, []);

    // Handler for global settings toggles -- persists to backend API
    // On failure, revert the toggle state (optimistic rollback)
    const handleToggleGlobalSetting = useCallback(async (key: keyof typeof globalSettings) => {
        const previous = { ...globalSettings };
        const updated = { ...globalSettings, [key]: !globalSettings[key] };
        // Optimistic UI update
        setGlobalSettings(updated);

        const payload = {
            maintenance_mode: updated.maintenanceMode,
            auto_resolve_enabled: updated.autoResolve,
            ai_correlation_enabled: updated.aiCorrelation,
        };

        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_GLOBAL_SETTINGS, payload);
        } catch {
            // Revert optimistic update on failure
            setGlobalSettings(previous);
            addToast('error', 'Update Failed', `Failed to update ${key}. Reverted to previous value.`);
            // Also persist previous state to localStorage as fallback
            try {
                localStorage.setItem('global-config-settings', JSON.stringify(previous));
            } catch {
                // silent
            }
        }
    }, [globalSettings, addToast]);

    // ==========================================
    // Fetch all data from API
    // ==========================================
    const fetchRules = useCallback(async () => {
        try {
            const data = await httpClient.fetchGet<Rule[]>(API_ENDPOINTS.CONFIG_RULES);
            setRules(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Failed to fetch rules:', e); }
    }, []);

    const fetchChannels = useCallback(async () => {
        try {
            const data = await httpClient.fetchGet<Channel[]>(API_ENDPOINTS.CONFIG_CHANNELS);
            setChannels(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Failed to fetch channels:', e); }
    }, []);

    const fetchPolicies = useCallback(async () => {
        try {
            const data = await httpClient.fetchGet<Policy[]>(API_ENDPOINTS.CONFIG_POLICIES);
            setPolicies(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Failed to fetch policies:', e); }
    }, []);

    const fetchMaintenance = useCallback(async () => {
        try {
            const data = await httpClient.fetchGet<Maintenance[]>(API_ENDPOINTS.CONFIG_MAINTENANCE);
            setMaintenance(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Failed to fetch maintenance windows:', e); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                await Promise.all([fetchRules(), fetchChannels(), fetchPolicies(), fetchMaintenance(), fetchGlobalSettings()]);
            } catch (e) {
                setLoadError(e instanceof Error ? e.message : 'Failed to load configuration data');
            }
            setIsLoading(false);
        };
        loadAll();
    }, [fetchRules, fetchChannels, fetchPolicies, fetchMaintenance, fetchGlobalSettings]);

    // --- RULE HANDLERS ---
    const handleOpenEditModal = (rule: Rule) => {
        setSelectedRule(rule);
        const cond = parseCondition(rule.condition);
        const dur = parseDuration(rule.duration || '5 minutes');
        setEditForm({
            name: rule.name, description: rule.description,
            conditionMetric: cond.metric, conditionOperator: cond.operator, conditionValue: cond.value,
            durationValue: dur.value, durationUnit: dur.unit,
            severity: rule.severity,
        });
        setEditModalOpen(true);
    };

    const handleOpenDeleteModal = (rule: Rule) => {
        setSelectedRule(rule);
        setDeleteModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedRule) return;
        const payload = {
            name: editForm.name, description: editForm.description,
            condition: composeCondition(editForm.conditionMetric, editForm.conditionOperator, editForm.conditionValue),
            duration: composeDuration(editForm.durationValue, editForm.durationUnit),
            severity: editForm.severity,
        };
        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_RULE_BY_ID(selectedRule.id), payload);
            await fetchRules();
            setEditModalOpen(false);
            addToast('success', 'Success', `Rule "${editForm.name}" updated successfully`);
        } catch { addToast('error', 'Error', 'Failed to update rule'); }
    };

    const handleConfirmDelete = async () => {
        if (!selectedRule) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_RULE_BY_ID(selectedRule.id));
            await fetchRules();
            setDeleteModalOpen(false);
            addToast('success', 'Success', `Rule "${selectedRule.name}" deleted`);
        } catch { addToast('error', 'Error', 'Failed to delete rule'); }
    };

    const handleDuplicateRule = async (rule: Rule) => {
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_RULES, {
                name: `${rule.name} (Copy)`, description: rule.description, condition: rule.condition,
                duration: rule.duration, severity: rule.severity, enabled: rule.enabled,
            });
            await fetchRules();
            addToast('success', 'Success', 'Rule duplicated successfully');
        } catch { addToast('error', 'Error', 'Failed to duplicate rule'); }
    };

    const handleCreateNewRule = async () => {
        const payload = {
            name: editForm.name || 'New Rule',
            description: editForm.description,
            condition: composeCondition(editForm.conditionMetric, editForm.conditionOperator, editForm.conditionValue),
            duration: composeDuration(editForm.durationValue, editForm.durationUnit),
            severity: editForm.severity,
        };
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_RULES, payload);
            await fetchRules();
            setNewRuleModalOpen(false);
            setEditForm({
                name: '', description: '',
                conditionMetric: 'CPU', conditionOperator: '>', conditionValue: 90,
                durationValue: 5, durationUnit: 'minutes',
                severity: 'warning',
            });
            addToast('success', 'Success', `New rule "${editForm.name || 'New Rule'}" created`);
        } catch { addToast('error', 'Error', 'Failed to create rule'); }
    };

    const handleToggleRule = async (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;
        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_RULE_BY_ID(id), { enabled: !rule.enabled });
            await fetchRules();
        } catch { addToast('error', 'Error', 'Failed to toggle rule'); }
    };

    // --- CHANNEL HANDLERS ---
    const handleToggleChannel = async (id: string) => {
        const channel = channels.find(c => c.id === id);
        if (!channel) return;
        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_CHANNEL_BY_ID(id), { active: !channel.active });
            await fetchChannels();
        } catch { addToast('error', 'Error', 'Failed to toggle channel'); }
    };

    const openChannelModal = (channel?: Channel) => {
        if (channel) {
            setChannelIsEdit(true);
            setSelectedChannel(channel);
            setChannelForm({ name: channel.name, type: channel.type, meta: channel.meta });
        } else {
            setChannelIsEdit(false);
            setSelectedChannel(null);
            setChannelForm({ name: '', type: 'Slack', meta: '' });
        }
        setChannelModalOpen(true);
    };

    const handleSaveChannel = async () => {
        try {
            if (channelIsEdit && selectedChannel) {
                await httpClient.fetchPut(API_ENDPOINTS.CONFIG_CHANNEL_BY_ID(selectedChannel.id), channelForm);
                await fetchChannels();
                addToast('success', 'Success', `Channel "${channelForm.name}" updated`);
            } else {
                await httpClient.fetchPost(API_ENDPOINTS.CONFIG_CHANNELS, { ...channelForm, active: true });
                await fetchChannels();
                addToast('success', 'Success', `Channel "${channelForm.name}" created`);
            }
            setChannelModalOpen(false);
        } catch { addToast('error', 'Error', 'Failed to save channel'); }
    };

    const handleDeleteChannel = async () => {
        if (!selectedChannel) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_CHANNEL_BY_ID(selectedChannel.id));
            await fetchChannels();
            setChannelDeleteOpen(false);
            addToast('success', 'Success', `Channel "${selectedChannel.name}" deleted`);
        } catch { addToast('error', 'Error', 'Failed to delete channel'); }
    };

    // --- POLICY HANDLERS ---
    const openPolicyModal = (policy?: Policy) => {
        if (policy) {
            setPolicyIsEdit(true);
            setSelectedPolicy(policy);
            setPolicyForm({ name: policy.name, description: policy.description, steps: policy.steps });
        } else {
            setPolicyIsEdit(false);
            setSelectedPolicy(null);
            setPolicyForm({ name: '', description: '', steps: 1 });
        }
        setPolicyModalOpen(true);
    };

    const handleSavePolicy = async () => {
        try {
            if (policyIsEdit && selectedPolicy) {
                await httpClient.fetchPut(API_ENDPOINTS.CONFIG_POLICY_BY_ID(selectedPolicy.id), policyForm);
                await fetchPolicies();
                addToast('success', 'Success', `Policy "${policyForm.name}" updated`);
            } else {
                await httpClient.fetchPost(API_ENDPOINTS.CONFIG_POLICIES, { ...policyForm, active: true });
                await fetchPolicies();
                addToast('success', 'Success', `Policy "${policyForm.name}" created`);
            }
            setPolicyModalOpen(false);
        } catch { addToast('error', 'Error', 'Failed to save policy'); }
    };

    const handleDeletePolicy = async () => {
        if (!selectedPolicy) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_POLICY_BY_ID(selectedPolicy.id));
            await fetchPolicies();
            setPolicyDeleteOpen(false);
            addToast('success', 'Success', `Policy "${selectedPolicy.name}" deleted`);
        } catch { addToast('error', 'Error', 'Failed to delete policy'); }
    };

    const handleDuplicatePolicy = async (policy: Policy) => {
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_POLICIES, {
                name: `${policy.name} (Copy)`, description: policy.description, steps: policy.steps, active: policy.active,
            });
            await fetchPolicies();
            addToast('success', 'Success', 'Policy duplicated');
        } catch { addToast('error', 'Error', 'Failed to duplicate policy'); }
    };

    // --- MAINTENANCE HANDLERS ---
    const parseSchedule = (schedule: string) => {
        const dayMatch = schedule.match(/(?:Every\s+)?(\w+day)/i);
        const timeMatch = schedule.match(/(\d{1,2}):(\d{2})/);
        return {
            day: dayMatch ? dayMatch[1] : 'Sunday',
            hour: timeMatch ? parseInt(timeMatch[1]) : 2,
            minute: timeMatch ? parseInt(timeMatch[2]) : 0,
        };
    };

    const parseDuration = (duration: string) => {
        const match = duration.match(/(\d+)\s*(hour|minute|day)/i);
        if (match) {
            return { value: parseInt(match[1]), unit: match[2].toLowerCase() + 's' };
        }
        return { value: 2, unit: 'hours' };
    };

    const composeSchedule = (day: string, hour: number, minute: number) =>
        `Every ${day} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} UTC`;

    const composeDuration = (value: number, unit: string) =>
        `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}`;

    const openMaintenanceModal = (maint?: Maintenance) => {
        if (maint) {
            setMaintenanceIsEdit(true);
            setSelectedMaintenance(maint);
            const sched = parseSchedule(maint.schedule);
            const dur = parseDuration(maint.duration);
            setMaintenanceForm({ name: maint.name, scheduleDayOfWeek: sched.day, scheduleHour: sched.hour, scheduleMinute: sched.minute, durationValue: dur.value, durationUnit: dur.unit, status: maint.status });
        } else {
            setMaintenanceIsEdit(false);
            setSelectedMaintenance(null);
            setMaintenanceForm({ name: '', scheduleDayOfWeek: 'Sunday', scheduleHour: 2, scheduleMinute: 0, durationValue: 2, durationUnit: 'hours', status: 'scheduled' });
        }
        setMaintenanceModalOpen(true);
    };

    const handleSaveMaintenance = async () => {
        const payload = {
            name: maintenanceForm.name,
            schedule: composeSchedule(maintenanceForm.scheduleDayOfWeek, maintenanceForm.scheduleHour, maintenanceForm.scheduleMinute),
            duration: composeDuration(maintenanceForm.durationValue, maintenanceForm.durationUnit),
            status: maintenanceForm.status,
        };
        try {
            if (maintenanceIsEdit && selectedMaintenance) {
                await httpClient.fetchPut(API_ENDPOINTS.CONFIG_MAINTENANCE_BY_ID(selectedMaintenance.id), payload);
                await fetchMaintenance();
                addToast('success', 'Success', `Window "${maintenanceForm.name}" updated`);
            } else {
                await httpClient.fetchPost(API_ENDPOINTS.CONFIG_MAINTENANCE, payload);
                await fetchMaintenance();
                addToast('success', 'Success', `Window "${maintenanceForm.name}" created`);
            }
            setMaintenanceModalOpen(false);
        } catch { addToast('error', 'Error', 'Failed to save window'); }
    };

    const handleDeleteMaintenance = async () => {
        if (!selectedMaintenance) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_MAINTENANCE_BY_ID(selectedMaintenance.id));
            await fetchMaintenance();
            setMaintenanceDeleteOpen(false);
            addToast('success', 'Success', `Window "${selectedMaintenance.name}" deleted`);
        } catch { addToast('error', 'Error', 'Failed to delete window'); }
    };

    const handleDuplicateMaintenance = async (maint: Maintenance) => {
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_MAINTENANCE, {
                name: `${maint.name} (Copy)`, schedule: maint.schedule, duration: maint.duration, status: maint.status,
            });
            await fetchMaintenance();
            addToast('success', 'Success', 'Window duplicated');
        } catch { addToast('error', 'Error', 'Failed to duplicate window'); }
    };

    const getSeverityTag = (severity: string) => {
        switch (severity) {
            case 'critical': return <Tag type="red" size="sm">CRITICAL</Tag>;
            case 'major': return <Tag type="magenta" size="sm">MAJOR</Tag>;
            case 'warning': return <Tag type="warm-gray" size="sm">WARNING</Tag>;
            case 'info': return <Tag type="blue" size="sm">INFO</Tag>;
            default: return <Tag type="gray" size="sm">{severity.toUpperCase()}</Tag>;
        }
    };

    return (
        <div className="configuration-page">
            <PageHeader
                title="Alert Configuration"
                subtitle="Manage threshold rules, notification channels, and escalation policies"
                breadcrumbs={[
                    { label: 'Configuration', href: '/configuration' },
                    { label: 'Alert Rules', active: true }
                ]}
                tabs={[
                    { label: 'Threshold Rules', value: 'rules' },
                    { label: 'Notification Channels', value: 'channels' },
                    { label: 'Escalation Policies', value: 'policies' },
                    { label: 'Maintenance Windows', value: 'maintenance' }
                ]}
                selectedTab={['rules', 'channels', 'policies', 'maintenance'][selectedTab]}
                onTabChange={(val) => {
                    const idx = ['rules', 'channels', 'policies', 'maintenance'].indexOf(val);
                    setSelectedTab(idx);
                }}
                showBorder={false}
            />

            {/* Error state with retry */}
            {loadError && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--cds-text-error)', marginBottom: '1rem' }}>
                        Failed to load configuration: {loadError}
                    </p>
                    <Button kind="tertiary" size="sm" onClick={() => {
                        setLoadError(null);
                        setIsLoading(true);
                        Promise.all([fetchRules(), fetchChannels(), fetchPolicies(), fetchMaintenance(), fetchGlobalSettings()])
                            .catch(e => setLoadError(e instanceof Error ? e.message : 'Failed to load'))
                            .finally(() => setIsLoading(false));
                    }}>Retry</Button>
                </div>
            )}

            <div className="configuration-content" style={{ display: 'flex', gap: '2rem' }}>
                {/* ==================== TAB 0: Threshold Rules ==================== */}
                {selectedTab === 0 && (
                    <>
                        <div className="rules-section" style={{ flex: 1 }}>
                            {isLoading ? (
                                <DataTableSkeleton headers={RULES_HEADERS} columnCount={5} rowCount={5} showHeader showToolbar />
                            ) : (
                                <DataTable rows={rules} headers={RULES_HEADERS} isSortable>
                                    {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                        <TableContainer title="Threshold Rules" description="Manage your alert threshold rules">
                                            <TableToolbar>
                                                <TableToolbarContent>
                                                    <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                                    <Button kind="secondary" size="md" renderIcon={Upload} onClick={() => addToast('info', 'Coming soon', 'Configuration import is not yet implemented.')}>Import</Button>
                                                    <Button kind="primary" size="md" renderIcon={Add} onClick={() => {
                                                        setEditForm({
                                                            name: '', description: '',
                                                            conditionMetric: 'CPU', conditionOperator: '>', conditionValue: 90,
                                                            durationValue: 5, durationUnit: 'minutes',
                                                            severity: 'warning',
                                                        });
                                                        setNewRuleModalOpen(true);
                                                    }}>New Rule</Button>
                                                </TableToolbarContent>
                                            </TableToolbar>
                                            <Table {...getTableProps()}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableExpandHeader />
                                                        {headers.map((header) => (
                                                            <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                                                {header.header}
                                                            </TableHeader>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {rows.map((row) => {
                                                        const rule = rules.find(r => r.id === row.id);
                                                        if (!rule) return null;
                                                        return (
                                                            <React.Fragment key={row.id}>
                                                                <TableExpandRow {...getRowProps({ row })}>
                                                                    <TableCell>
                                                                        <Toggle
                                                                            id={`toggle-${rule.id}`}
                                                                            size="sm"
                                                                            toggled={rule.enabled}
                                                                            onToggle={() => handleToggleRule(rule.id)}
                                                                            labelA="" labelB="" hideLabel
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: 600, color: 'var(--cds-text-primary)' }}>{rule.name}</span>
                                                                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{rule.description}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem' }}>{rule.condition}</div>
                                                                    </TableCell>
                                                                    <TableCell>{getSeverityTag(rule.severity)}</TableCell>
                                                                    <TableCell>
                                                                        <OverflowMenu flipped size="sm" ariaLabel="Actions">
                                                                            <OverflowMenuItem itemText="Edit rule" onClick={() => handleOpenEditModal(rule)} />
                                                                            <OverflowMenuItem itemText="Duplicate" onClick={() => handleDuplicateRule(rule)} />
                                                                            <OverflowMenuItem isDelete itemText="Delete" onClick={() => handleOpenDeleteModal(rule)} />
                                                                        </OverflowMenu>
                                                                    </TableCell>
                                                                </TableExpandRow>
                                                                <TableExpandedRow colSpan={headers.length + 1}>
                                                                    <div style={{ padding: '1rem', background: '#222222' }}>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a8a8a8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Metric</label>
                                                                                <select style={{ width: '100%', background: '#393939', color: 'white', padding: '0.5rem', border: 'none' }}>
                                                                                    <option>interface.packet_loss</option>
                                                                                    <option>interface.errors_in</option>
                                                                                </select>
                                                                            </div>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a8a8a8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Device Filter</label>
                                                                                <input type="text" defaultValue="*" style={{ width: '100%', background: '#393939', color: 'white', padding: '0.5rem', border: 'none', fontFamily: 'monospace' }} />
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                                                            <Button kind="ghost" size="sm">Cancel</Button>
                                                                            <Button kind="primary" size="sm">Save Changes</Button>
                                                                        </div>
                                                                    </div>
                                                                </TableExpandedRow>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </DataTable>
                            )}
                        </div>

                        {/* Settings Side Panel */}
                        <div className="settings-section" style={{ width: '320px' }}>
                            <div className="settings-panel">
                                <div className="settings-panel__header">
                                    <h3><SettingsAdjust size={16} /> Global Settings</h3>
                                </div>
                                <div className="settings-panel__content">
                                    {[
                                        { label: 'Maintenance Mode', desc: 'Suppress all non-critical alerts', key: 'maintenanceMode' },
                                        { label: 'Auto-Resolve', desc: 'Close alerts after 24h of silence', key: 'autoResolve' },
                                        { label: 'AI Correlation', desc: 'Group related alerts automatically', key: 'aiCorrelation' }
                                    ].map((setting) => (
                                        <div className="setting-row" key={setting.key} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="setting-name" style={{ fontWeight: 600 }}>{setting.label}</span>
                                                <Toggle
                                                    id={setting.key}
                                                    size="sm"
                                                    toggled={globalSettings[setting.key as keyof typeof globalSettings]}
                                                    onToggle={() => handleToggleGlobalSetting(setting.key as keyof typeof globalSettings)}
                                                    labelA="" labelB="" hideLabel
                                                />
                                            </div>
                                            <span className="setting-description" style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{setting.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="settings-panel">
                                <div className="settings-panel__header">
                                    <h3><NotificationNew size={16} style={{ color: '#ff832b' }} /> Active Channels</h3>
                                    <button className="panel-action" onClick={() => setSelectedTab(1)}>Configure</button>
                                </div>
                                <div className="settings-panel__content">
                                    {channels.filter(c => c.active).map(channel => {
                                        const Icon = ICON_MAP[channel.type] || Email;
                                        return (
                                            <div key={channel.id} className="channel-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                                <div className="channel-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Icon size={18} />
                                                    <span className="channel-name" style={{ fontWeight: 600 }}>{channel.name}</span>
                                                    <div className="channel-status" style={{ marginLeft: 'auto' }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', paddingLeft: '1.75rem' }}>{channel.type} • {channel.meta}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ==================== TAB 1: Notification Channels ==================== */}
                {selectedTab === 1 && (
                    <div style={{ flex: 1 }}>
                        {isLoading ? (
                            <DataTableSkeleton headers={CHANNELS_HEADERS} columnCount={5} rowCount={3} showHeader showToolbar />
                        ) : (
                        <DataTable rows={channels} headers={CHANNELS_HEADERS}>
                            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                <TableContainer title="Notification Channels" description="Manage integrations">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                            <Button kind="primary" size="md" renderIcon={Add} onClick={() => openChannelModal()}>Add Channel</Button>
                                        </TableToolbarContent>
                                    </TableToolbar>
                                    <Table {...getTableProps()}>
                                        <TableHead>
                                            <TableRow>
                                                {headers.map((header) => (
                                                    <TableHeader {...getHeaderProps({ header })} key={header.key}>{header.header}</TableHeader>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.map(row => {
                                                const channel = channels.find(c => c.id === row.id);
                                                if (!channel) return null;
                                                const Icon = ICON_MAP[channel.type] || Email;
                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell><Icon size={20} /></TableCell>
                                                        <TableCell>{channel.name}</TableCell>
                                                        <TableCell><Tag type={channel.active ? 'green' : 'gray'}>{channel.active ? 'Active' : 'Inactive'}</Tag></TableCell>
                                                        <TableCell><Toggle id={`ch-${channel.id}`} toggled={channel.active} onToggle={() => handleToggleChannel(channel.id)} size="sm" labelA="" labelB="" hideLabel /></TableCell>
                                                        <TableCell>
                                                            <OverflowMenu flipped size="sm" ariaLabel="Actions">
                                                                <OverflowMenuItem itemText="Edit" onClick={() => openChannelModal(channel)} />
                                                                <OverflowMenuItem isDelete itemText="Delete" onClick={() => { setSelectedChannel(channel); setChannelDeleteOpen(true); }} />
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
                        )}
                    </div>
                )}

                {/* ==================== TAB 2: Escalation Policies ==================== */}
                {selectedTab === 2 && (
                    <div style={{ flex: 1 }}>
                        {isLoading ? (
                            <DataTableSkeleton headers={POLICIES_HEADERS} columnCount={5} rowCount={2} showHeader showToolbar />
                        ) : (
                        <DataTable rows={policies} headers={POLICIES_HEADERS}>
                            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                <TableContainer title="Escalation Policies" description="Define how alerts are escalated through your team">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                            <Button kind="primary" size="md" renderIcon={Add} onClick={() => openPolicyModal()}>New Policy</Button>
                                        </TableToolbarContent>
                                    </TableToolbar>
                                    <Table {...getTableProps()}>
                                        <TableHead>
                                            <TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.map(row => {
                                                const policy = policies.find(p => p.id === row.id);
                                                if (!policy) return null;
                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell style={{ fontWeight: 600 }}>{policy.name}</TableCell>
                                                        <TableCell>{policy.description}</TableCell>
                                                        <TableCell><Tag type="blue" size="sm">{policy.steps} steps</Tag></TableCell>
                                                        <TableCell><Tag type={policy.active ? 'green' : 'gray'} size="sm">{policy.active ? 'Active' : 'Inactive'}</Tag></TableCell>
                                                        <TableCell>
                                                            <OverflowMenu flipped size="sm" ariaLabel="Actions">
                                                                <OverflowMenuItem itemText="Edit" onClick={() => openPolicyModal(policy)} />
                                                                <OverflowMenuItem itemText="Duplicate" onClick={() => handleDuplicatePolicy(policy)} />
                                                                <OverflowMenuItem isDelete itemText="Delete" onClick={() => { setSelectedPolicy(policy); setPolicyDeleteOpen(true); }} />
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
                        )}
                    </div>
                )}

                {/* ==================== TAB 3: Maintenance Windows ==================== */}
                {selectedTab === 3 && (
                    <div style={{ flex: 1 }}>
                        {isLoading ? (
                            <DataTableSkeleton headers={MAINTENANCE_HEADERS} columnCount={5} rowCount={2} showHeader showToolbar />
                        ) : (
                        <DataTable rows={maintenance} headers={MAINTENANCE_HEADERS}>
                            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                <TableContainer title="Maintenance Windows" description="Schedule maintenance periods to suppress alerts">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                            <Button kind="primary" size="md" renderIcon={Add} onClick={() => openMaintenanceModal()}>Add Window</Button>
                                        </TableToolbarContent>
                                    </TableToolbar>
                                    <Table {...getTableProps()}>
                                        <TableHead>
                                            <TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.map(row => {
                                                const maint = maintenance.find(m => m.id === row.id);
                                                if (!maint) return null;
                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell style={{ fontWeight: 600 }}>{maint.name}</TableCell>
                                                        <TableCell>{maint.schedule}</TableCell>
                                                        <TableCell>{maint.duration}</TableCell>
                                                        <TableCell>
                                                            <Tag type={maint.status === 'active' ? 'green' : 'blue'} size="sm">
                                                                {maint.status.charAt(0).toUpperCase() + maint.status.slice(1)}
                                                            </Tag>
                                                        </TableCell>
                                                        <TableCell>
                                                            <OverflowMenu flipped size="sm" ariaLabel="Actions">
                                                                <OverflowMenuItem itemText="Edit" onClick={() => openMaintenanceModal(maint)} />
                                                                <OverflowMenuItem itemText="Duplicate" onClick={() => handleDuplicateMaintenance(maint)} />
                                                                <OverflowMenuItem isDelete itemText="Delete" onClick={() => { setSelectedMaintenance(maint); setMaintenanceDeleteOpen(true); }} />
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
                        )}
                    </div>
                )}
            </div>

            {/* ==================== RULE MODALS ==================== */}
            <Modal
                open={editModalOpen}
                onRequestClose={() => setEditModalOpen(false)}
                onRequestSubmit={handleSaveEdit}
                modalHeading="Edit Rule"
                modalLabel="Alert Configuration"
                primaryButtonText="Save Changes"
                secondaryButtonText="Cancel"
                primaryButtonDisabled={!editForm.name}
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <TextInput id="edit-rule-name" labelText="Rule Name" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} required invalid={!editForm.name} invalidText="Rule name is required" />
                    <TextInput id="edit-rule-description" labelText="Description" value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} />

                    <div>
                        <label className="cds--label" style={{ display: 'block', marginBottom: '0.5rem' }}>Condition</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <Select id="edit-cond-metric" labelText="" hideLabel value={editForm.conditionMetric} onChange={(e) => setEditForm(prev => ({ ...prev, conditionMetric: e.target.value }))}>
                                {CONDITION_METRICS.map(m => <SelectItem key={m.value} value={m.value} text={m.label} />)}
                            </Select>
                            <Select id="edit-cond-op" labelText="" hideLabel value={editForm.conditionOperator} onChange={(e) => setEditForm(prev => ({ ...prev, conditionOperator: e.target.value }))}>
                                {CONDITION_OPERATORS.map(op => <SelectItem key={op} value={op} text={op} />)}
                            </Select>
                            <NumberInput id="edit-cond-value" label="" hideLabel min={0} max={100000} value={editForm.conditionValue} onChange={(_e: any, state: any) => setEditForm(prev => ({ ...prev, conditionValue: Number(state.value) || 0 }))} size="md" />
                            <span style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--cds-text-secondary)', whiteSpace: 'nowrap' }}>
                                {CONDITION_METRICS.find(m => m.value === editForm.conditionMetric)?.unit || ''}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="cds--label" style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (trigger after)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <NumberInput id="edit-dur-value" label="" hideLabel min={1} max={1440} value={editForm.durationValue} onChange={(_e: any, state: any) => setEditForm(prev => ({ ...prev, durationValue: Number(state.value) || 1 }))} size="md" />
                            <Select id="edit-dur-unit" labelText="" hideLabel value={editForm.durationUnit} onChange={(e) => setEditForm(prev => ({ ...prev, durationUnit: e.target.value }))}>
                                <SelectItem value="seconds" text="Seconds" />
                                <SelectItem value="minutes" text="Minutes" />
                                <SelectItem value="hours" text="Hours" />
                            </Select>
                        </div>
                    </div>

                    <Select id="edit-rule-severity" labelText="Severity" value={editForm.severity} onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value }))}>
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="major" text="Major" />
                        <SelectItem value="warning" text="Warning" />
                        <SelectItem value="info" text="Info" />
                    </Select>
                </div>
            </Modal>

            <Modal
                open={deleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                onRequestSubmit={handleConfirmDelete}
                modalHeading="Delete Rule"
                modalLabel="Confirm Deletion"
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                danger
                size="sm"
            >
                <p style={{ padding: '1rem 0' }}>
                    Are you sure you want to delete the rule <strong>"{selectedRule?.name}"</strong>? This action cannot be undone.
                </p>
            </Modal>

            <Modal
                open={newRuleModalOpen}
                onRequestClose={() => setNewRuleModalOpen(false)}
                onRequestSubmit={handleCreateNewRule}
                modalHeading="Create New Rule"
                modalLabel="Alert Configuration"
                primaryButtonText="Create Rule"
                secondaryButtonText="Cancel"
                primaryButtonDisabled={!editForm.name}
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <TextInput id="new-rule-name" labelText="Rule Name" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., High Memory Usage" required invalid={!editForm.name} invalidText="Rule name is required" />
                    <TextInput id="new-rule-description" labelText="Description" value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} placeholder="e.g., All Servers • Memory" />

                    <div>
                        <label className="cds--label" style={{ display: 'block', marginBottom: '0.5rem' }}>Condition</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <Select id="new-cond-metric" labelText="" hideLabel value={editForm.conditionMetric} onChange={(e) => setEditForm(prev => ({ ...prev, conditionMetric: e.target.value }))}>
                                {CONDITION_METRICS.map(m => <SelectItem key={m.value} value={m.value} text={m.label} />)}
                            </Select>
                            <Select id="new-cond-op" labelText="" hideLabel value={editForm.conditionOperator} onChange={(e) => setEditForm(prev => ({ ...prev, conditionOperator: e.target.value }))}>
                                {CONDITION_OPERATORS.map(op => <SelectItem key={op} value={op} text={op} />)}
                            </Select>
                            <NumberInput id="new-cond-value" label="" hideLabel min={0} max={100000} value={editForm.conditionValue} onChange={(_e: any, state: any) => setEditForm(prev => ({ ...prev, conditionValue: Number(state.value) || 0 }))} size="md" />
                            <span style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--cds-text-secondary)', whiteSpace: 'nowrap' }}>
                                {CONDITION_METRICS.find(m => m.value === editForm.conditionMetric)?.unit || ''}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="cds--label" style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (trigger after)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <NumberInput id="new-dur-value" label="" hideLabel min={1} max={1440} value={editForm.durationValue} onChange={(_e: any, state: any) => setEditForm(prev => ({ ...prev, durationValue: Number(state.value) || 1 }))} size="md" />
                            <Select id="new-dur-unit" labelText="" hideLabel value={editForm.durationUnit} onChange={(e) => setEditForm(prev => ({ ...prev, durationUnit: e.target.value }))}>
                                <SelectItem value="seconds" text="Seconds" />
                                <SelectItem value="minutes" text="Minutes" />
                                <SelectItem value="hours" text="Hours" />
                            </Select>
                        </div>
                    </div>

                    <Select id="new-rule-severity" labelText="Severity" value={editForm.severity} onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value }))}>
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="major" text="Major" />
                        <SelectItem value="warning" text="Warning" />
                        <SelectItem value="info" text="Info" />
                    </Select>
                </div>
            </Modal>

            {/* ==================== CHANNEL MODALS ==================== */}
            <Modal
                open={channelModalOpen}
                onRequestClose={() => setChannelModalOpen(false)}
                onRequestSubmit={handleSaveChannel}
                modalHeading={channelIsEdit ? 'Edit Channel' : 'Add Notification Channel'}
                modalLabel="Notification Channels"
                primaryButtonText={channelIsEdit ? 'Save Changes' : 'Add Channel'}
                secondaryButtonText="Cancel"
                primaryButtonDisabled={!channelForm.name}
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <Select id="channel-type" labelText="Channel Type" value={channelForm.type} onChange={(e) => setChannelForm(prev => ({ ...prev, type: e.target.value }))}>
                        <SelectItem value="Slack" text="Slack" />
                        <SelectItem value="Email" text="Email" />
                        <SelectItem value="Twilio" text="Twilio (SMS)" />
                    </Select>
                    <TextInput id="channel-name" labelText="Channel Name" value={channelForm.name} onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))} placeholder={channelForm.type === 'Slack' ? '#noc-alerts' : channelForm.type === 'Email' ? 'team@company.com' : '+1-555-0123'} required invalid={!channelForm.name} invalidText="Channel name is required" />
                    <Select id="channel-meta" labelText="Alert Filter" value={channelForm.meta} onChange={(e) => setChannelForm(prev => ({ ...prev, meta: e.target.value }))}>
                        <SelectItem value="" text="Select filter..." />
                        <SelectItem value="All Alerts" text="All Alerts" />
                        <SelectItem value="Critical Only" text="Critical Only" />
                        <SelectItem value="Critical & High" text="Critical & High" />
                        <SelectItem value="Warning & Above" text="Warning & Above" />
                    </Select>
                </div>
            </Modal>

            <Modal
                open={channelDeleteOpen}
                onRequestClose={() => setChannelDeleteOpen(false)}
                onRequestSubmit={handleDeleteChannel}
                modalHeading="Delete Channel"
                modalLabel="Confirm Deletion"
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                danger
                size="sm"
            >
                <p style={{ padding: '1rem 0' }}>
                    Are you sure you want to delete <strong>"{selectedChannel?.name}"</strong>? Alerts will no longer be sent to this channel.
                </p>
            </Modal>

            {/* ==================== POLICY MODALS ==================== */}
            <Modal
                open={policyModalOpen}
                onRequestClose={() => setPolicyModalOpen(false)}
                onRequestSubmit={handleSavePolicy}
                modalHeading={policyIsEdit ? 'Edit Policy' : 'Create Escalation Policy'}
                modalLabel="Escalation Policies"
                primaryButtonText={policyIsEdit ? 'Save Changes' : 'Create Policy'}
                secondaryButtonText="Cancel"
                primaryButtonDisabled={!policyForm.name}
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <TextInput id="policy-name" labelText="Policy Name" value={policyForm.name} onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Critical Infrastructure" required invalid={!policyForm.name} invalidText="Policy name is required" />
                    <TextArea id="policy-description" labelText="Escalation Steps" value={policyForm.description} onChange={(e) => setPolicyForm(prev => ({ ...prev, description: e.target.value }))} placeholder="e.g., Notify on-call > Manager > Director" rows={3} />
                    <Select id="policy-steps" labelText="Number of Steps" value={String(policyForm.steps)} onChange={(e) => setPolicyForm(prev => ({ ...prev, steps: parseInt(e.target.value) || 1 }))}>
                        <SelectItem value="1" text="1 step" />
                        <SelectItem value="2" text="2 steps" />
                        <SelectItem value="3" text="3 steps" />
                        <SelectItem value="4" text="4 steps" />
                        <SelectItem value="5" text="5 steps" />
                    </Select>
                </div>
            </Modal>

            <Modal
                open={policyDeleteOpen}
                onRequestClose={() => setPolicyDeleteOpen(false)}
                onRequestSubmit={handleDeletePolicy}
                modalHeading="Delete Policy"
                modalLabel="Confirm Deletion"
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                danger
                size="sm"
            >
                <p style={{ padding: '1rem 0' }}>
                    Are you sure you want to delete <strong>"{selectedPolicy?.name}"</strong>? Active alerts using this policy will fall back to the default escalation.
                </p>
            </Modal>

            {/* ==================== MAINTENANCE MODALS ==================== */}
            <Modal
                open={maintenanceModalOpen}
                onRequestClose={() => setMaintenanceModalOpen(false)}
                onRequestSubmit={handleSaveMaintenance}
                modalHeading={maintenanceIsEdit ? 'Edit Maintenance Window' : 'Schedule Maintenance Window'}
                modalLabel="Maintenance Windows"
                primaryButtonText={maintenanceIsEdit ? 'Save Changes' : 'Create Window'}
                secondaryButtonText="Cancel"
                primaryButtonDisabled={!maintenanceForm.name}
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <TextInput id="maint-name" labelText="Window Name" value={maintenanceForm.name} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Weekly Patching" required invalid={!maintenanceForm.name} invalidText="Window name is required" />

                    <div>
                        <label className="cds--label" style={{ display: 'block', marginBottom: '0.5rem' }}>Schedule</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <Select id="maint-day" labelText="" hideLabel value={maintenanceForm.scheduleDayOfWeek} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduleDayOfWeek: e.target.value }))}>
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                                    <SelectItem key={d} value={d} text={d} />
                                ))}
                            </Select>
                            <NumberInput id="maint-hour" label="" hideLabel min={0} max={23} value={maintenanceForm.scheduleHour} onChange={(_e: any, state: any) => setMaintenanceForm(prev => ({ ...prev, scheduleHour: Number(state.value) || 0 }))} helperText="Hour (0-23)" size="md" />
                            <span style={{ padding: '0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>:</span>
                            <NumberInput id="maint-minute" label="" hideLabel min={0} max={59} step={5} value={maintenanceForm.scheduleMinute} onChange={(_e: any, state: any) => setMaintenanceForm(prev => ({ ...prev, scheduleMinute: Number(state.value) || 0 }))} helperText="Minute (0-59)" size="md" />
                            <span style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>UTC</span>
                        </div>
                    </div>

                    <div>
                        <label className="cds--label" style={{ display: 'block', marginBottom: '0.5rem' }}>Duration</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <NumberInput id="maint-dur-value" label="" hideLabel min={1} max={168} value={maintenanceForm.durationValue} onChange={(_e: any, state: any) => setMaintenanceForm(prev => ({ ...prev, durationValue: Number(state.value) || 1 }))} size="md" />
                            <Select id="maint-dur-unit" labelText="" hideLabel value={maintenanceForm.durationUnit} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, durationUnit: e.target.value }))}>
                                <SelectItem value="minutes" text="Minutes" />
                                <SelectItem value="hours" text="Hours" />
                                <SelectItem value="days" text="Days" />
                            </Select>
                        </div>
                    </div>

                    <Select id="maint-status" labelText="Status" value={maintenanceForm.status} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, status: e.target.value }))}>
                        <SelectItem value="scheduled" text="Scheduled" />
                        <SelectItem value="active" text="Active" />
                    </Select>
                </div>
            </Modal>

            <Modal
                open={maintenanceDeleteOpen}
                onRequestClose={() => setMaintenanceDeleteOpen(false)}
                onRequestSubmit={handleDeleteMaintenance}
                modalHeading="Delete Maintenance Window"
                modalLabel="Confirm Deletion"
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                danger
                size="sm"
            >
                <p style={{ padding: '1rem 0' }}>
                    Are you sure you want to delete <strong>"{selectedMaintenance?.name}"</strong>? Alert suppression for this window will be removed.
                </p>
            </Modal>
        </div>
    );
}

export default ConfigurationPage;
