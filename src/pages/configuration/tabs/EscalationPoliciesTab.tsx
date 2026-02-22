/**
 * EscalationPoliciesTab
 *
 * Manages escalation policy CRUD operations with DataTable and modals.
 * Extracted from ConfigurationPage.
 */

import { useState, useCallback } from 'react';
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
    TextArea,
    Select,
    SelectItem,
} from '@carbon/react';
import { Add } from '@carbon/icons-react';

import { useToast } from '@/contexts';
import { useFetchData } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';
import { API_ENDPOINTS } from '@/shared/config';
import type { Policy, PolicyForm } from '../types';
import {
    httpClient,
    POLICIES_HEADERS,
    DEFAULT_POLICY_FORM,
} from '../types';

export function EscalationPoliciesTab() {
    const { addToast } = useToast();

    // Data fetching via useFetchData
    const { data: rawPolicies, isLoading, refetch: fetchPolicies } = useFetchData(
        async (_signal) => {
            const data = await httpClient.fetchGet<Policy[]>(API_ENDPOINTS.CONFIG_POLICIES);
            return Array.isArray(data) ? data : [];
        },
        [],
        {
            onError: (err) => {
                logger.error('Failed to fetch policies', err);
                addToast('error', 'Error', 'Failed to load escalation policies');
            },
        }
    );
    const policies = rawPolicies ?? [];

    // Modal states
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyDeleteOpen, setPolicyDeleteOpen] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [policyForm, setPolicyForm] = useState<PolicyForm>(DEFAULT_POLICY_FORM);
    const [policyIsEdit, setPolicyIsEdit] = useState(false);

    // Policy handlers
    const openPolicyModal = (policy?: Policy) => {
        if (policy) {
            setPolicyIsEdit(true);
            setSelectedPolicy(policy);
            setPolicyForm({ name: policy.name, description: policy.description, steps: policy.steps });
        } else {
            setPolicyIsEdit(false);
            setSelectedPolicy(null);
            setPolicyForm(DEFAULT_POLICY_FORM);
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
        } catch {
            addToast('error', 'Error', 'Failed to save policy');
        }
    };

    const handleDeletePolicy = async () => {
        if (!selectedPolicy) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_POLICY_BY_ID(selectedPolicy.id));
            await fetchPolicies();
            setPolicyDeleteOpen(false);
            addToast('success', 'Success', `Policy "${selectedPolicy.name}" deleted`);
        } catch {
            addToast('error', 'Error', 'Failed to delete policy');
        }
    };

    const handleDuplicatePolicy = async (policy: Policy) => {
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_POLICIES, {
                name: `${policy.name} (Copy)`,
                description: policy.description,
                steps: policy.steps,
                active: policy.active,
            });
            await fetchPolicies();
            addToast('success', 'Success', 'Policy duplicated');
        } catch {
            addToast('error', 'Error', 'Failed to duplicate policy');
        }
    };

    return (
        <>
            <div className="configuration-tab__content">
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
                                        <TableRow>{headers.map(h => { const { key: _key, ...hp } = getHeaderProps({ header: h }); return <TableHeader {...hp} key={h.key}>{h.header}</TableHeader>; })}</TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map(row => {
                                            const policy = policies.find(p => p.id === row.id);
                                            if (!policy) return null;
                                            const { key: _rowKey, ...rowProps } = getRowProps({ row });
                                            return (
                                                <TableRow {...rowProps} key={row.id}>
                                                    <TableCell className="configuration-table__name-cell">{policy.name}</TableCell>
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

            {/* Policy Create/Edit Modal */}
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
                <div className="configuration-modal__form">
                    <TextInput
                        id="policy-name"
                        labelText="Policy Name"
                        value={policyForm.name}
                        onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Critical Infrastructure"
                        required
                        invalid={!policyForm.name}
                        invalidText="Policy name is required"
                    />
                    <TextArea
                        id="policy-description"
                        labelText="Escalation Steps"
                        value={policyForm.description}
                        onChange={(e) => setPolicyForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="e.g., Notify on-call > Manager > Director"
                        rows={3}
                    />
                    <Select
                        id="policy-steps"
                        labelText="Number of Steps"
                        value={String(policyForm.steps)}
                        onChange={(e) => setPolicyForm(prev => ({ ...prev, steps: parseInt(e.target.value) || 1 }))}
                    >
                        <SelectItem value="1" text="1 step" />
                        <SelectItem value="2" text="2 steps" />
                        <SelectItem value="3" text="3 steps" />
                        <SelectItem value="4" text="4 steps" />
                        <SelectItem value="5" text="5 steps" />
                    </Select>
                </div>
            </Modal>

            {/* Policy Delete Modal */}
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
                <p className="configuration-modal__confirm-text">
                    Are you sure you want to delete <strong>&quot;{selectedPolicy?.name}&quot;</strong>? Active alerts using this policy will fall back to the default escalation.
                </p>
            </Modal>
        </>
    );
}
