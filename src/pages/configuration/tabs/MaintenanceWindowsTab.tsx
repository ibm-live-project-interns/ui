/**
 * MaintenanceWindowsTab
 *
 * Manages maintenance window CRUD operations with DataTable and modals.
 * Extracted from ConfigurationPage.
 */

import { useState, useCallback } from 'react';
import React from 'react';
import {
    Button,
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
    NumberInput,
} from '@carbon/react';
import { Add } from '@carbon/icons-react';

import { useToast } from '@/contexts';
import { useFetchData } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';
import { API_ENDPOINTS } from '@/shared/config';

import '@/styles/pages/_maintenance-windows.scss';
import type { Maintenance, MaintenanceForm } from '../types';
import {
    httpClient,
    MAINTENANCE_HEADERS,
    DEFAULT_MAINTENANCE_FORM,
    parseSchedule,
    parseDuration,
    composeSchedule,
    composeDuration,
} from '../types';

export function MaintenanceWindowsTab() {
    const { addToast } = useToast();

    // Data fetching via useFetchData
    const { data: rawMaintenance, isLoading, refetch: fetchMaintenance } = useFetchData(
        async (_signal) => {
            const data = await httpClient.fetchGet<Maintenance[]>(API_ENDPOINTS.CONFIG_MAINTENANCE);
            return Array.isArray(data) ? data : [];
        },
        [],
        {
            onError: (err) => {
                logger.error('Failed to fetch maintenance windows', err);
                addToast('error', 'Error', 'Failed to load maintenance windows');
            },
        }
    );
    const maintenance = rawMaintenance ?? [];

    // Modal states
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceDeleteOpen, setMaintenanceDeleteOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
    const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>(DEFAULT_MAINTENANCE_FORM);
    const [maintenanceIsEdit, setMaintenanceIsEdit] = useState(false);

    // Maintenance handlers
    const openMaintenanceModal = (maint?: Maintenance) => {
        if (maint) {
            setMaintenanceIsEdit(true);
            setSelectedMaintenance(maint);
            const sched = parseSchedule(maint.schedule);
            const dur = parseDuration(maint.duration);
            setMaintenanceForm({
                name: maint.name,
                scheduleDayOfWeek: sched.day,
                scheduleHour: sched.hour,
                scheduleMinute: sched.minute,
                durationValue: dur.value,
                durationUnit: dur.unit,
                status: maint.status,
            });
        } else {
            setMaintenanceIsEdit(false);
            setSelectedMaintenance(null);
            setMaintenanceForm(DEFAULT_MAINTENANCE_FORM);
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
        } catch {
            addToast('error', 'Error', 'Failed to save window');
        }
    };

    const handleDeleteMaintenance = async () => {
        if (!selectedMaintenance) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_MAINTENANCE_BY_ID(selectedMaintenance.id));
            await fetchMaintenance();
            setMaintenanceDeleteOpen(false);
            addToast('success', 'Success', `Window "${selectedMaintenance.name}" deleted`);
        } catch {
            addToast('error', 'Error', 'Failed to delete window');
        }
    };

    const handleDuplicateMaintenance = async (maint: Maintenance) => {
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_MAINTENANCE, {
                name: `${maint.name} (Copy)`,
                schedule: maint.schedule,
                duration: maint.duration,
                status: maint.status,
            });
            await fetchMaintenance();
            addToast('success', 'Success', 'Window duplicated');
        } catch {
            addToast('error', 'Error', 'Failed to duplicate window');
        }
    };

    return (
        <>
            <div className="maintenance-windows">
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
                                        <TableRow>{headers.map(h => { const { key: _key, ...hp } = getHeaderProps({ header: h }); return <TableHeader {...hp} key={h.key}>{h.header}</TableHeader>; })}</TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map(row => {
                                            const maint = maintenance.find(m => m.id === row.id);
                                            if (!maint) return null;
                                            const { key: _rowKey, ...rowProps } = getRowProps({ row });
                                            return (
                                                <TableRow {...rowProps} key={row.id}>
                                                    <TableCell className="maintenance-windows__name-cell">{maint.name}</TableCell>
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

            {/* Maintenance Create/Edit Modal */}
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
                <div className="maintenance-windows__form">
                    <TextInput
                        id="maint-name"
                        labelText="Window Name"
                        value={maintenanceForm.name}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Weekly Patching"
                        required
                        invalid={!maintenanceForm.name}
                        invalidText="Window name is required"
                    />

                    <div className="maintenance-windows__field-group">
                        <label className="cds--label maintenance-windows__field-label">Schedule</label>
                        <div className="maintenance-windows__field-row">
                            <Select id="maint-day" labelText="Day of week" hideLabel value={maintenanceForm.scheduleDayOfWeek} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduleDayOfWeek: e.target.value }))}>
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                                    <SelectItem key={d} value={d} text={d} />
                                ))}
                            </Select>
                            <NumberInput
                                id="maint-hour"
                                label="Schedule hour"
                                hideLabel
                                min={0}
                                max={23}
                                value={maintenanceForm.scheduleHour}
                                onChange={(_e: React.SyntheticEvent, state: { value: string | number }) => setMaintenanceForm(prev => ({ ...prev, scheduleHour: Number(state.value) || 0 }))}
                                helperText="Hour (0-23)"
                                size="md"
                            />
                            <span className="maintenance-windows__time-separator">:</span>
                            <NumberInput
                                id="maint-minute"
                                label="Schedule minute"
                                hideLabel
                                min={0}
                                max={59}
                                step={5}
                                value={maintenanceForm.scheduleMinute}
                                onChange={(_e: React.SyntheticEvent, state: { value: string | number }) => setMaintenanceForm(prev => ({ ...prev, scheduleMinute: Number(state.value) || 0 }))}
                                helperText="Minute (0-59)"
                                size="md"
                            />
                            <span className="maintenance-windows__timezone-label">UTC</span>
                        </div>
                    </div>

                    <div className="maintenance-windows__field-group">
                        <label className="cds--label maintenance-windows__field-label">Duration</label>
                        <div className="maintenance-windows__field-row">
                            <NumberInput
                                id="maint-dur-value"
                                label="Duration value"
                                hideLabel
                                min={1}
                                max={168}
                                value={maintenanceForm.durationValue}
                                onChange={(_e: React.SyntheticEvent, state: { value: string | number }) => setMaintenanceForm(prev => ({ ...prev, durationValue: Number(state.value) || 1 }))}
                                size="md"
                            />
                            <Select id="maint-dur-unit" labelText="Duration unit" hideLabel value={maintenanceForm.durationUnit} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, durationUnit: e.target.value }))}>
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

            {/* Maintenance Delete Modal */}
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
                <p className="maintenance-windows__delete-confirm">
                    Are you sure you want to delete <strong>&quot;{selectedMaintenance?.name}&quot;</strong>? Alert suppression for this window will be removed.
                </p>
            </Modal>
        </>
    );
}
