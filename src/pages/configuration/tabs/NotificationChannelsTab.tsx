/**
 * NotificationChannelsTab
 *
 * Manages notification channel CRUD operations with DataTable and modals.
 * Extracted from ConfigurationPage.
 */

import { useState } from 'react';
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
    Modal,
    TextInput,
    Select,
    SelectItem,
} from '@carbon/react';
import { Add } from '@carbon/icons-react';

import { useToast } from '@/contexts';
import { useFetchData } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';
import { API_ENDPOINTS } from '@/shared/config';
import type { Channel, ChannelForm } from '../types';
import {
    httpClient,
    ICON_MAP,
    CHANNELS_HEADERS,
    DEFAULT_CHANNEL_FORM,
} from '../types';

export function NotificationChannelsTab() {
    const { addToast } = useToast();

    // Data fetching via useFetchData
    const { data: rawChannels, isLoading, refetch: fetchChannels } = useFetchData(
        async (_signal) => {
            const data = await httpClient.fetchGet<Channel[]>(API_ENDPOINTS.CONFIG_CHANNELS);
            return Array.isArray(data) ? data : [];
        },
        [],
        {
            onError: (err) => {
                logger.error('Failed to fetch channels', err);
                addToast('error', 'Error', 'Failed to load notification channels');
            },
        }
    );
    const channels = rawChannels ?? [];

    // Modal states
    const [channelModalOpen, setChannelModalOpen] = useState(false);
    const [channelDeleteOpen, setChannelDeleteOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [channelForm, setChannelForm] = useState<ChannelForm>(DEFAULT_CHANNEL_FORM);
    const [channelIsEdit, setChannelIsEdit] = useState(false);

    // Channel handlers
    const handleToggleChannel = async (id: string) => {
        const channel = channels.find(c => c.id === id);
        if (!channel) return;
        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_CHANNEL_BY_ID(id), { active: !channel.active });
            await fetchChannels();
        } catch {
            addToast('error', 'Error', 'Failed to toggle channel');
        }
    };

    const openChannelModal = (channel?: Channel) => {
        if (channel) {
            setChannelIsEdit(true);
            setSelectedChannel(channel);
            setChannelForm({ name: channel.name, type: channel.type, meta: channel.meta });
        } else {
            setChannelIsEdit(false);
            setSelectedChannel(null);
            setChannelForm(DEFAULT_CHANNEL_FORM);
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
        } catch {
            addToast('error', 'Error', 'Failed to save channel');
        }
    };

    const handleDeleteChannel = async () => {
        if (!selectedChannel) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_CHANNEL_BY_ID(selectedChannel.id));
            await fetchChannels();
            setChannelDeleteOpen(false);
            addToast('success', 'Success', `Channel "${selectedChannel.name}" deleted`);
        } catch {
            addToast('error', 'Error', 'Failed to delete channel');
        }
    };

    const Email = ICON_MAP['Email'];

    return (
        <>
            <div className="configuration-tab__content">
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
                                            {headers.map((header) => {
                                                const { key: _key, ...headerProps } = getHeaderProps({ header });
                                                return (
                                                    <TableHeader {...headerProps} key={header.key}>{header.header}</TableHeader>
                                                );
                                            })}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map(row => {
                                            const channel = channels.find(c => c.id === row.id);
                                            if (!channel) return null;
                                            const Icon = ICON_MAP[channel.type] || Email;
                                            const { key: _rowKey, ...rowProps } = getRowProps({ row });
                                            return (
                                                <TableRow {...rowProps} key={row.id}>
                                                    <TableCell><Icon size={20} /></TableCell>
                                                    <TableCell>{channel.name}</TableCell>
                                                    <TableCell><Tag type={channel.active ? 'green' : 'gray'}>{channel.active ? 'Active' : 'Inactive'}</Tag></TableCell>
                                                    <TableCell><Toggle id={`ch-${channel.id}`} toggled={channel.active} onToggle={() => handleToggleChannel(channel.id)} size="sm" labelA="Inactive" labelB="Active" hideLabel aria-label={`Toggle ${channel.name} channel`} /></TableCell>
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

            {/* Channel Create/Edit Modal */}
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
                <div className="configuration-modal__form">
                    <Select id="channel-type" labelText="Channel Type" value={channelForm.type} onChange={(e) => setChannelForm(prev => ({ ...prev, type: e.target.value }))}>
                        <SelectItem value="Slack" text="Slack" />
                        <SelectItem value="Email" text="Email" />
                        <SelectItem value="Twilio" text="Twilio (SMS)" />
                    </Select>
                    <TextInput
                        id="channel-name"
                        labelText="Channel Name"
                        value={channelForm.name}
                        onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={channelForm.type === 'Slack' ? '#noc-alerts' : channelForm.type === 'Email' ? 'noc-alerts@yourorg.com' : '+1-555-0123'}
                        helperText={channelForm.type === 'Email' ? 'Emails are sent from the address configured in SMTP_FROM environment variable' : undefined}
                        required
                        invalid={!channelForm.name}
                        invalidText="Channel name is required"
                    />
                    <Select id="channel-meta" labelText="Alert Filter" value={channelForm.meta} onChange={(e) => setChannelForm(prev => ({ ...prev, meta: e.target.value }))}>
                        <SelectItem value="" text="Select filter..." />
                        <SelectItem value="All Alerts" text="All Alerts" />
                        <SelectItem value="Critical Only" text="Critical Only" />
                        <SelectItem value="Critical & High" text="Critical & High" />
                        <SelectItem value="Warning & Above" text="Warning & Above" />
                    </Select>
                </div>
            </Modal>

            {/* Channel Delete Modal */}
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
                <p className="configuration-modal__confirm-text">
                    Are you sure you want to delete <strong>&quot;{selectedChannel?.name}&quot;</strong>? Alerts will no longer be sent to this channel.
                </p>
            </Modal>
        </>
    );
}
