/**
 * ThresholdRulesTab
 *
 * Manages threshold rule CRUD operations with DataTable, expandable rows,
 * and global settings side panel. Extracted from ConfigurationPage.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@/contexts';
import { useComingSoon, ComingSoonModal } from '@/components/ui';
import { useFetchData } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';
import { API_ENDPOINTS } from '@/shared/config';
import type { Rule, Channel, GlobalSettings, RuleEditForm } from '../types';
import {
    httpClient,
    DEFAULT_RULE_FORM,
    parseCondition,
    composeCondition,
    parseDuration,
    composeDuration,
} from '../types';

// Child components
import { RulesDataTable } from '../components/RulesDataTable';
import { RuleFormModal } from '../components/RuleFormModal';
import { DeleteRuleModal } from '../components/DeleteRuleModal';
import { SettingsSidePanel } from '../components/SettingsSidePanel';

import '@/styles/pages/_threshold-rules.scss';

interface ThresholdRulesTabProps {
    onNavigateToChannels: () => void;
}

export function ThresholdRulesTab({ onNavigateToChannels }: ThresholdRulesTabProps) {
    const { addToast } = useToast();
    const { open: comingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

    // Global settings state (mutable -- toggled locally before API call)
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        maintenanceMode: false,
        autoResolve: true,
        aiCorrelation: true,
    });

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [editForm, setEditForm] = useState<RuleEditForm>(DEFAULT_RULE_FORM);

    // Fetch all config data via useFetchData
    const { data: configData, isLoading: rulesLoading, refetch: refetchConfig } = useFetchData(
        async (_signal) => {
            // Fetch rules and channels in parallel; global settings has its own fallback
            const [rulesData, channelsData] = await Promise.all([
                httpClient.fetchGet<Rule[]>(API_ENDPOINTS.CONFIG_RULES).catch((e) => {
                    logger.error('Failed to fetch rules', e);
                    return [] as Rule[];
                }),
                httpClient.fetchGet<Channel[]>(API_ENDPOINTS.CONFIG_CHANNELS).catch((e) => {
                    logger.error('Failed to fetch channels for side panel', e);
                    return [] as Channel[];
                }),
            ]);

            // Global settings with localStorage fallback
            let gs: GlobalSettings = { maintenanceMode: false, autoResolve: true, aiCorrelation: true };
            try {
                const data = await httpClient.fetchGet<{
                    maintenance_mode?: boolean;
                    auto_resolve_enabled?: boolean;
                    ai_correlation_enabled?: boolean;
                }>(API_ENDPOINTS.CONFIG_GLOBAL_SETTINGS);
                gs = {
                    maintenanceMode: data.maintenance_mode ?? false,
                    autoResolve: data.auto_resolve_enabled ?? true,
                    aiCorrelation: data.ai_correlation_enabled ?? true,
                };
            } catch {
                try {
                    const stored = localStorage.getItem('global-config-settings');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        gs = {
                            maintenanceMode: parsed.maintenanceMode ?? false,
                            autoResolve: parsed.autoResolve ?? true,
                            aiCorrelation: parsed.aiCorrelation ?? true,
                        };
                    }
                } catch {
                    // Use defaults
                }
            }

            return {
                rules: Array.isArray(rulesData) ? rulesData : [],
                channels: Array.isArray(channelsData) ? channelsData : [],
                globalSettings: gs,
            };
        },
        [],
        {
            onError: (err) => {
                addToast('error', 'Error', 'Failed to load configuration data');
                logger.error('Failed to load configuration data', err);
            },
        }
    );

    const rules = configData?.rules ?? [];
    const channels = configData?.channels ?? [];

    // Sync global settings from fetch result into mutable state on initial load.
    // Use a ref to avoid overwriting optimistic toggle updates on subsequent refetches.
    const gsInitializedRef = useRef(false);
    useEffect(() => {
        if (configData?.globalSettings && !gsInitializedRef.current) {
            setGlobalSettings(configData.globalSettings);
            gsInitializedRef.current = true;
        }
    }, [configData]);

    // Wrap refetchConfig for CRUD handlers (they only need rules refreshed)
    const fetchRules = useCallback(async () => {
        refetchConfig();
    }, [refetchConfig]);

    // Toggle global setting
    const handleToggleGlobalSetting = useCallback(async (key: keyof GlobalSettings) => {
        const previous = { ...globalSettings };
        const updated = { ...globalSettings, [key]: !globalSettings[key] };
        setGlobalSettings(updated);

        const payload = {
            maintenance_mode: updated.maintenanceMode,
            auto_resolve_enabled: updated.autoResolve,
            ai_correlation_enabled: updated.aiCorrelation,
        };

        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_GLOBAL_SETTINGS, payload);
        } catch {
            setGlobalSettings(previous);
            addToast('error', 'Update Failed', `Failed to update ${key}. Reverted to previous value.`);
            try {
                localStorage.setItem('global-config-settings', JSON.stringify(previous));
            } catch {
                // silent
            }
        }
    }, [globalSettings, addToast]);

    // Rule CRUD handlers
    const handleOpenEditModal = useCallback((rule: Rule) => {
        setSelectedRule(rule);
        const cond = parseCondition(rule.condition);
        const dur = parseDuration(rule.duration || '5 minutes');
        setEditForm({
            name: rule.name,
            description: rule.description,
            conditionMetric: cond.metric,
            conditionOperator: cond.operator,
            conditionValue: typeof cond.value === 'number' ? cond.value : Number(cond.value) || 0,
            durationValue: dur.value,
            durationUnit: dur.unit,
            severity: rule.severity,
        });
        setEditModalOpen(true);
    }, []);

    const handleOpenDeleteModal = useCallback((rule: Rule) => {
        setSelectedRule(rule);
        setDeleteModalOpen(true);
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!selectedRule) return;
        const payload = {
            name: editForm.name,
            description: editForm.description,
            condition: composeCondition(editForm.conditionMetric, editForm.conditionOperator, editForm.conditionValue),
            duration: composeDuration(editForm.durationValue, editForm.durationUnit),
            severity: editForm.severity,
        };
        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_RULE_BY_ID(selectedRule.id), payload);
            await fetchRules();
            setEditModalOpen(false);
            addToast('success', 'Success', `Rule "${editForm.name}" updated successfully`);
        } catch {
            addToast('error', 'Error', 'Failed to update rule');
        }
    }, [selectedRule, editForm, fetchRules, addToast]);

    const handleConfirmDelete = useCallback(async () => {
        if (!selectedRule) return;
        try {
            await httpClient.fetchDelete(API_ENDPOINTS.CONFIG_RULE_BY_ID(selectedRule.id));
            await fetchRules();
            setDeleteModalOpen(false);
            addToast('success', 'Success', `Rule "${selectedRule.name}" deleted`);
        } catch {
            addToast('error', 'Error', 'Failed to delete rule');
        }
    }, [selectedRule, fetchRules, addToast]);

    const handleDuplicateRule = useCallback(async (rule: Rule) => {
        try {
            await httpClient.fetchPost(API_ENDPOINTS.CONFIG_RULES, {
                name: `${rule.name} (Copy)`,
                description: rule.description,
                condition: rule.condition,
                duration: rule.duration,
                severity: rule.severity,
                enabled: rule.enabled,
            });
            await fetchRules();
            addToast('success', 'Success', 'Rule duplicated successfully');
        } catch {
            addToast('error', 'Error', 'Failed to duplicate rule');
        }
    }, [fetchRules, addToast]);

    const handleCreateNewRule = useCallback(async () => {
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
            setEditForm(DEFAULT_RULE_FORM);
            addToast('success', 'Success', `New rule "${editForm.name || 'New Rule'}" created`);
        } catch {
            addToast('error', 'Error', 'Failed to create rule');
        }
    }, [editForm, fetchRules, addToast]);

    const handleToggleRule = useCallback(async (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;
        try {
            await httpClient.fetchPut(API_ENDPOINTS.CONFIG_RULE_BY_ID(id), { enabled: !rule.enabled });
            await fetchRules();
        } catch {
            addToast('error', 'Error', 'Failed to toggle rule');
        }
    }, [rules, fetchRules, addToast]);

    const handleOpenNewRuleModal = useCallback(() => {
        setEditForm(DEFAULT_RULE_FORM);
        setNewRuleModalOpen(true);
    }, []);

    const handleImport = useCallback(() => {
        showComingSoon({
            name: 'Configuration Import',
            description: 'Importing threshold rules from a file is currently under development. You can create rules manually using the "New Rule" button.',
        });
    }, [showComingSoon]);

    return (
        <>
            {/* Rules Table */}
            <div className="rules-section threshold-rules__rules-section">
                <RulesDataTable
                    rules={rules}
                    loading={rulesLoading}
                    onNewRule={handleOpenNewRuleModal}
                    onEditRule={handleOpenEditModal}
                    onDuplicateRule={handleDuplicateRule}
                    onDeleteRule={handleOpenDeleteModal}
                    onToggleRule={handleToggleRule}
                    onImport={handleImport}
                />
            </div>

            {/* Settings Side Panel */}
            <SettingsSidePanel
                maintenanceMode={globalSettings.maintenanceMode}
                autoResolve={globalSettings.autoResolve}
                aiCorrelation={globalSettings.aiCorrelation}
                onToggleSetting={handleToggleGlobalSetting}
                channels={channels}
                onNavigateToChannels={onNavigateToChannels}
            />

            {/* Edit Rule Modal */}
            <RuleFormModal
                open={editModalOpen}
                mode="edit"
                editForm={editForm}
                onFormChange={setEditForm}
                onClose={() => setEditModalOpen(false)}
                onSubmit={handleSaveEdit}
            />

            {/* Delete Rule Modal */}
            <DeleteRuleModal
                open={deleteModalOpen}
                rule={selectedRule}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            {/* New Rule Modal */}
            <RuleFormModal
                open={newRuleModalOpen}
                mode="new"
                editForm={editForm}
                onFormChange={setEditForm}
                onClose={() => setNewRuleModalOpen(false)}
                onSubmit={handleCreateNewRule}
            />

            {/* Coming Soon Modal */}
            <ComingSoonModal open={comingSoonOpen} onClose={hideComingSoon} feature={comingSoonFeature} />
        </>
    );
}
