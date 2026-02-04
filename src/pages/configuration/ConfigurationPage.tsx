import { useState, useEffect } from 'react';
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
    InlineNotification,
} from '@carbon/react';
import React from 'react'; // specific import since I used React.Fragment
import {
    Add,
    Upload,
    Edit,
    SettingsAdjust,
    NotificationNew,
    LogoSlack,
    Email,
    Phone,
} from '@carbon/icons-react';
import { PageHeader } from '@/components/ui';
import '@/styles/pages/_configuration.scss';

// Mock data
const MOCK_RULES = [
    { id: '1', name: 'High CPU Utilization', description: 'Core Infrastructure • Switch, Router', condition: 'CPU > 90%', duration: 'for 5m', severity: 'critical', enabled: true },
    { id: '2', name: 'BGP Session Flapping', description: 'WAN Edge • BGP Peers', condition: 'Change > 3', duration: 'in 1m', severity: 'major', enabled: true },
    { id: '3', name: 'Storage Latency Warning', description: 'SAN/NAS • All Volumes', condition: 'Latency > 50ms', duration: '', severity: 'warning', enabled: false },
    { id: '4', name: 'Interface Packet Loss', description: 'All Devices • Interfaces', condition: 'Loss > 1%', duration: '', severity: 'major', enabled: true },
    { id: '5', name: 'Memory Threshold Alert', description: 'All Servers • Memory', condition: 'Memory > 85%', duration: 'for 10m', severity: 'warning', enabled: true },
];

const MOCK_CHANNELS = [
    { id: '1', name: '#netops-alerts', type: 'Slack', meta: '14 alerts/hr', active: true, icon: LogoSlack },
    { id: '2', name: 'noc-team@ibm.com', type: 'Email', meta: 'Critical Only', active: true, icon: Email },
    { id: '3', name: 'On-Call SMS', type: 'Twilio', meta: 'Paused', active: false, icon: Phone },
];

const MOCK_POLICIES = [
    { id: '1', name: 'Default Network Ops', description: 'Notify on-call > Manager > Director', steps: 3, alerts: 24 },
    { id: '2', name: 'Critical Infrastructure', description: 'Immediate blast to all channels', steps: 1, alerts: 5 },
];

const MOCK_MAINTENANCE = [
    { id: '1', name: 'Weekly Patching', schedule: 'Every Sunday 02:00 UTC', duration: '2 hours', status: 'active' },
    { id: '2', name: 'Datacenter Power Maintenance', schedule: 'One-time: Oct 24, 2025', duration: '8 hours', status: 'scheduled' },
];

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
    { header: 'Active Alerts', key: 'alerts' },
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
    const [rules, setRules] = useState(MOCK_RULES); // Simplified type for mock
    const [channels, setChannels] = useState(MOCK_CHANNELS);
    const [isLoading, setIsLoading] = useState(true);
    const [globalSettings, setGlobalSettings] = useState({
        maintenanceMode: false,
        autoResolve: true,
        aiCorrelation: true,
    });
    const [selectedTab, setSelectedTab] = useState(0);

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<typeof MOCK_RULES[0] | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', condition: '', severity: 'warning' });
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Modal handlers
    const handleOpenEditModal = (rule: typeof MOCK_RULES[0]) => {
        setSelectedRule(rule);
        setEditForm({
            name: rule.name,
            description: rule.description,
            condition: rule.condition,
            severity: rule.severity,
        });
        setEditModalOpen(true);
    };

    const handleOpenDeleteModal = (rule: typeof MOCK_RULES[0]) => {
        setSelectedRule(rule);
        setDeleteModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (selectedRule) {
            setRules(prev => prev.map(r =>
                r.id === selectedRule.id
                    ? { ...r, ...editForm }
                    : r
            ));
            setEditModalOpen(false);
            setNotification({ type: 'success', message: `Rule "${editForm.name}" updated successfully` });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleConfirmDelete = () => {
        if (selectedRule) {
            setRules(prev => prev.filter(r => r.id !== selectedRule.id));
            setDeleteModalOpen(false);
            setNotification({ type: 'success', message: `Rule "${selectedRule.name}" deleted` });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleDuplicateRule = (rule: typeof MOCK_RULES[0]) => {
        const newRule = {
            ...rule,
            id: `${Date.now()}`,
            name: `${rule.name} (Copy)`,
        };
        setRules(prev => [...prev, newRule]);
        setNotification({ type: 'success', message: `Rule duplicated successfully` });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCreateNewRule = () => {
        const newRule = {
            id: `${Date.now()}`,
            name: editForm.name || 'New Rule',
            description: editForm.description || 'Custom Rule',
            condition: editForm.condition || 'Value > 0',
            duration: '',
            severity: editForm.severity,
            enabled: true,
        };
        setRules(prev => [...prev, newRule]);
        setNewRuleModalOpen(false);
        setEditForm({ name: '', description: '', condition: '', severity: 'warning' });
        setNotification({ type: 'success', message: `New rule "${newRule.name}" created` });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleToggleRule = (id: string) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const handleToggleChannel = (id: string) => {
        setChannels(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    };

    const getSeverityTag = (severity: string) => {
        switch (severity) {
            case 'critical': return <Tag type="red" size="sm">CRITICAL</Tag>;
            case 'major': return <Tag type="magenta" size="sm">MAJOR</Tag>; // Magenta is close to orange/major often
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
                showBorder={false} // Tabs handles the border now
            />

            <div className="configuration-content" style={{ display: 'flex', gap: '2rem' }}>
                {/* Rules Tab Content */}
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
                                                    <Button kind="secondary" size="md" renderIcon={Upload}>Import</Button>
                                                    <Button kind="primary" size="md" renderIcon={Add} onClick={() => {
                                                        setEditForm({ name: '', description: '', condition: '', severity: 'warning' });
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

                        {/* Settings Side Panel (Only visible on Rules tab) */}
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
                                                    onToggle={() => setGlobalSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof typeof globalSettings] }))}
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
                                    {channels.filter(c => c.active).map(channel => (
                                        <div key={channel.id} className="channel-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                            <div className="channel-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <channel.icon size={18} />
                                                <span className="channel-name" style={{ fontWeight: 600 }}>{channel.name}</span>
                                                <div className="channel-status" style={{ marginLeft: 'auto' }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', paddingLeft: '1.75rem' }}>{channel.type} • {channel.meta}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Other Tabs content (Simplified to just the table) */}
                {selectedTab === 1 && (
                    <div style={{ flex: 1 }}>
                        <DataTable rows={channels} headers={CHANNELS_HEADERS}>
                            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                <TableContainer title="Notification Channels" description="Manage integrations">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                            <Button kind="primary" size="md" renderIcon={Add}>Add Channel</Button>
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
                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell><channel.icon size={20} /></TableCell>
                                                        <TableCell>{channel.name}</TableCell>
                                                        <TableCell><Tag type={channel.active ? 'green' : 'gray'}>{channel.active ? 'Active' : 'Inactive'}</Tag></TableCell>
                                                        <TableCell><Toggle id={channel.id} toggled={channel.active} onToggle={() => handleToggleChannel(channel.id)} size="sm" labelA="" labelB="" hideLabel /></TableCell>
                                                        <TableCell><Button kind="ghost" size="sm" iconDescription="Edit" renderIcon={Edit} /></TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </DataTable>
                    </div>
                )}

                {selectedTab === 2 && (
                    <div style={{ flex: 1 }}>
                        <DataTable rows={MOCK_POLICIES} headers={POLICIES_HEADERS}>
                            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                <TableContainer title="Escalation Policies" description="Define how alerts are escalated through your team">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                            <Button kind="primary" size="md" renderIcon={Add}>New Policy</Button>
                                        </TableToolbarContent>
                                    </TableToolbar>
                                    <Table {...getTableProps()}>
                                        <TableHead>
                                            <TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.map(row => {
                                                const policy = MOCK_POLICIES.find(p => p.id === row.id);
                                                if (!policy) return null;
                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell style={{ fontWeight: 600 }}>{policy.name}</TableCell>
                                                        <TableCell>{policy.description}</TableCell>
                                                        <TableCell><Tag type="blue" size="sm">{policy.steps} steps</Tag></TableCell>
                                                        <TableCell><Tag type="gray" size="sm">{policy.alerts} alerts</Tag></TableCell>
                                                        <TableCell>
                                                            <OverflowMenu flipped size="sm" ariaLabel="Actions">
                                                                <OverflowMenuItem itemText="Edit" />
                                                                <OverflowMenuItem itemText="Duplicate" />
                                                                <OverflowMenuItem isDelete itemText="Delete" />
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
                    </div>
                )}

                {selectedTab === 3 && (
                    <div style={{ flex: 1 }}>
                        <DataTable rows={MOCK_MAINTENANCE} headers={MAINTENANCE_HEADERS}>
                            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                                <TableContainer title="Maintenance Windows" description="Schedule maintenance periods to suppress alerts">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            <TableToolbarSearch onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLInputElement>)} />
                                            <Button kind="primary" size="md" renderIcon={Add}>Add Window</Button>
                                        </TableToolbarContent>
                                    </TableToolbar>
                                    <Table {...getTableProps()}>
                                        <TableHead>
                                            <TableRow>{headers.map(h => <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>)}</TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.map(row => {
                                                const maintenance = MOCK_MAINTENANCE.find(m => m.id === row.id);
                                                if (!maintenance) return null;
                                                return (
                                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                                        <TableCell style={{ fontWeight: 600 }}>{maintenance.name}</TableCell>
                                                        <TableCell>{maintenance.schedule}</TableCell>
                                                        <TableCell>{maintenance.duration}</TableCell>
                                                        <TableCell>
                                                            <Tag type={maintenance.status === 'active' ? 'green' : 'blue'} size="sm">
                                                                {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}
                                                            </Tag>
                                                        </TableCell>
                                                        <TableCell>
                                                            <OverflowMenu flipped size="sm" ariaLabel="Actions">
                                                                <OverflowMenuItem itemText="Edit" />
                                                                <OverflowMenuItem itemText="Duplicate" />
                                                                <OverflowMenuItem isDelete itemText="Delete" />
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
                    </div>
                )}
            </div>

            {/* Notification */}
            {notification && (
                <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999 }}>
                    <InlineNotification
                        kind={notification.type}
                        title={notification.type === 'success' ? 'Success' : 'Error'}
                        subtitle={notification.message}
                        onCloseButtonClick={() => setNotification(null)}
                    />
                </div>
            )}

            {/* Edit Rule Modal */}
            <Modal
                open={editModalOpen}
                onRequestClose={() => setEditModalOpen(false)}
                onRequestSubmit={handleSaveEdit}
                modalHeading="Edit Rule"
                modalLabel="Alert Configuration"
                primaryButtonText="Save Changes"
                secondaryButtonText="Cancel"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <TextInput
                        id="edit-rule-name"
                        labelText="Rule Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <TextInput
                        id="edit-rule-description"
                        labelText="Description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <TextInput
                        id="edit-rule-condition"
                        labelText="Condition"
                        value={editForm.condition}
                        onChange={(e) => setEditForm(prev => ({ ...prev, condition: e.target.value }))}
                        placeholder="e.g., CPU > 90%"
                    />
                    <Select
                        id="edit-rule-severity"
                        labelText="Severity"
                        value={editForm.severity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value }))}
                    >
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="major" text="Major" />
                        <SelectItem value="warning" text="Warning" />
                        <SelectItem value="info" text="Info" />
                    </Select>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
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
                    Are you sure you want to delete the rule <strong>"{selectedRule?.name}"</strong>?
                    This action cannot be undone.
                </p>
            </Modal>

            {/* New Rule Modal */}
            <Modal
                open={newRuleModalOpen}
                onRequestClose={() => setNewRuleModalOpen(false)}
                onRequestSubmit={handleCreateNewRule}
                modalHeading="Create New Rule"
                modalLabel="Alert Configuration"
                primaryButtonText="Create Rule"
                secondaryButtonText="Cancel"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    <TextInput
                        id="new-rule-name"
                        labelText="Rule Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., High Memory Usage"
                    />
                    <TextInput
                        id="new-rule-description"
                        labelText="Description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="e.g., All Servers • Memory"
                    />
                    <TextInput
                        id="new-rule-condition"
                        labelText="Condition"
                        value={editForm.condition}
                        onChange={(e) => setEditForm(prev => ({ ...prev, condition: e.target.value }))}
                        placeholder="e.g., Memory > 90%"
                    />
                    <Select
                        id="new-rule-severity"
                        labelText="Severity"
                        value={editForm.severity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value }))}
                    >
                        <SelectItem value="critical" text="Critical" />
                        <SelectItem value="major" text="Major" />
                        <SelectItem value="warning" text="Warning" />
                        <SelectItem value="info" text="Info" />
                    </Select>
                </div>
            </Modal>
        </div>
    );
}

export default ConfigurationPage;
