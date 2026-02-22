/**
 * Copyright IBM Corp. 2026
 *
 * useRunbooks - Custom hook encapsulating all state, data fetching,
 * form handling, and CRUD logic for the Runbooks page.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DropdownFilterConfig } from '@/components/ui/FilterBar';
import type { KPICardProps } from '@/components/ui/KPICard';
import { logger } from '@/shared/utils/logger';
import { useFetchData } from '@/shared/hooks';
import { useToast } from '@/contexts';

import { runbookService } from './runbookService';
import {
    CATEGORY_FILTER_OPTIONS,
    EMPTY_RUNBOOK_FORM,
    DEFAULT_STATS,
    nextStepId,
    generateRunbookKPIData,
} from './types';
import type {
    RunbookStats,
    FilterOption,
} from './types';
import type { Runbook, RunbookFormData } from './RunbookModals';

// ==========================================
// Return type
// ==========================================

export interface UseRunbooksReturn {
    // Data
    runbooks: Runbook[];
    stats: RunbookStats;
    isLoading: boolean;
    errorMessage: string;
    setErrorMessage: (msg: string) => void;

    // Filter state
    searchInput: string;
    setSearchInput: (value: string) => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    selectedCategory: FilterOption;
    filterDropdowns: DropdownFilterConfig[];
    clearAllFilters: () => void;

    // KPI
    kpiData: KPICardProps[];

    // Modal state
    isCreateModalOpen: boolean;
    isDetailModalOpen: boolean;
    isDeleteModalOpen: boolean;
    editingRunbook: Runbook | null;
    viewingRunbook: Runbook | null;
    deletingRunbook: Runbook | null;
    formData: RunbookFormData;
    stepIds: string[];
    formErrors: Record<string, string>;
    isSaving: boolean;
    isDeleting: boolean;

    // Actions
    fetchRunbooks: () => void;
    handleOpenCreateModal: () => void;
    handleOpenEditModal: (runbook: Runbook) => void;
    handleCloseCreateModal: () => void;
    handleSaveRunbook: () => Promise<void>;
    handleAddStep: () => void;
    handleRemoveStep: (index: number) => void;
    handleStepChange: (index: number, value: string) => void;
    handleViewRunbook: (runbook: Runbook) => Promise<void>;
    handleCloseDetailModal: () => void;
    handleOpenDeleteModal: (runbook: Runbook) => void;
    handleConfirmDelete: () => Promise<void>;
    handleCloseDeleteModal: () => void;
    onFormChange: (update: Partial<RunbookFormData>) => void;
}

// ==========================================
// Hook
// ==========================================

export function useRunbooks(): UseRunbooksReturn {
    // Error message for CRUD operations (separate from fetch error)
    const [errorMessage, setErrorMessage] = useState('');

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FilterOption>(CATEGORY_FILTER_OPTIONS[0]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // FilterBar dropdown configs
    const filterDropdowns: DropdownFilterConfig[] = useMemo(() => [
        {
            id: 'category-filter',
            label: 'Category',
            options: CATEGORY_FILTER_OPTIONS,
            selectedItem: selectedCategory,
            onChange: (item) => {
                setSelectedCategory(item || CATEGORY_FILTER_OPTIONS[0]);
            },
        },
    ], [selectedCategory]);

    const clearAllFilters = useCallback(() => {
        setSearchInput('');
        setSearchQuery('');
        setSelectedCategory(CATEGORY_FILTER_OPTIONS[0]);
    }, []);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRunbook, setEditingRunbook] = useState<Runbook | null>(null);
    const [viewingRunbook, setViewingRunbook] = useState<Runbook | null>(null);
    const [deletingRunbook, setDeletingRunbook] = useState<Runbook | null>(null);
    const [formData, setFormData] = useState<RunbookFormData>({ ...EMPTY_RUNBOOK_FORM });
    const [stepIds, setStepIds] = useState<string[]>([nextStepId()]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast notifications
    const { addToast } = useToast();

    // ==========================================
    // Data Fetching
    // ==========================================

    const { data: fetchResult, isLoading, refetch: fetchRunbooks } = useFetchData(
        async (_signal) => {
            const response = await runbookService.getRunbooks({
                search: searchQuery || undefined,
                category: selectedCategory.id !== 'all' ? selectedCategory.id : undefined,
            });
            return response;
        },
        [searchQuery, selectedCategory],
        {
            onError: (err) => {
                logger.error('Failed to fetch runbooks', err);
                setErrorMessage('Failed to load runbooks. Please try again.');
                addToast('error', 'Load Failed', 'Failed to load runbooks. Please try again.');
            },
        }
    );

    const runbooks = fetchResult?.runbooks ?? [];
    const stats = fetchResult?.stats ?? { ...DEFAULT_STATS };

    // KPI data derived from stats
    const kpiData = useMemo(() => generateRunbookKPIData(stats), [stats]);

    // ==========================================
    // Form Handling
    // ==========================================

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.title.trim()) errors.title = 'Title is required';
        if (!formData.category) errors.category = 'Category is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        const nonEmptySteps = formData.steps.filter((s) => s.trim() !== '');
        if (nonEmptySteps.length === 0) errors.steps = 'At least one step is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenCreateModal = () => {
        setEditingRunbook(null);
        setFormData({ ...EMPTY_RUNBOOK_FORM });
        setStepIds([nextStepId()]);
        setFormErrors({});
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (runbook: Runbook) => {
        setEditingRunbook(runbook);
        setFormData({
            title: runbook.title,
            category: runbook.category,
            description: runbook.description,
            steps: runbook.steps.map((s) => s.instruction),
            related_alert_types: runbook.related_alert_types || [],
        });
        setStepIds(runbook.steps.map(() => nextStepId()));
        setFormErrors({});
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setEditingRunbook(null);
        setFormData({ ...EMPTY_RUNBOOK_FORM });
        setStepIds([nextStepId()]);
        setFormErrors({});
        setIsSaving(false);
    };

    const handleSaveRunbook = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        setErrorMessage('');
        try {
            const cleanedData: RunbookFormData = {
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim(),
                steps: formData.steps.filter((s) => s.trim() !== '').map((s) => s.trim()),
            };

            if (editingRunbook) {
                await runbookService.updateRunbook(editingRunbook.id, cleanedData);
            } else {
                await runbookService.createRunbook(cleanedData);
            }

            handleCloseCreateModal();
            await fetchRunbooks();
            addToast('success', 'Runbook Saved', `Runbook "${cleanedData.title}" has been ${editingRunbook ? 'updated' : 'created'}.`);
        } catch (error) {
            logger.error('Runbook save failed', error);
            const msg = error instanceof Error ? error.message : 'Failed to save runbook. Please try again.';
            setErrorMessage(msg);
            addToast('error', 'Save Failed', msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStep = () => {
        setFormData((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
        setStepIds((prev) => [...prev, nextStepId()]);
    };

    const handleRemoveStep = (index: number) => {
        setFormData((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
        setStepIds((prev) => prev.filter((_, i) => i !== index));
    };

    const handleStepChange = (index: number, value: string) => {
        setFormData((prev) => {
            const newSteps = [...prev.steps];
            newSteps[index] = value;
            return { ...prev, steps: newSteps };
        });
    };

    // ==========================================
    // Detail & Delete
    // ==========================================

    const handleViewRunbook = async (runbook: Runbook) => {
        try {
            const response = await runbookService.getRunbook(runbook.id);
            setViewingRunbook(response.runbook);
        } catch (err) {
            logger.warn('Failed to fetch full runbook details, using cached data', err);
            setViewingRunbook(runbook);
        }
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setViewingRunbook(null);
    };

    const handleOpenDeleteModal = (runbook: Runbook) => {
        setDeletingRunbook(runbook);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingRunbook(null);
        setIsDeleting(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRunbook) return;

        setErrorMessage('');
        setIsDeleting(true);
        try {
            const deletedName = deletingRunbook.title;
            await runbookService.deleteRunbook(deletingRunbook.id);
            setIsDeleteModalOpen(false);
            setDeletingRunbook(null);

            if (viewingRunbook && viewingRunbook.id === deletingRunbook.id) {
                handleCloseDetailModal();
            }

            await fetchRunbooks();
            addToast('success', 'Runbook Deleted', `Runbook "${deletedName}" has been deleted.`);
        } catch (error) {
            logger.error('Runbook delete failed', error);
            const msg = error instanceof Error ? error.message : 'Failed to delete runbook. Please try again.';
            setErrorMessage(msg);
            addToast('error', 'Delete Failed', msg);
        } finally {
            setIsDeleting(false);
        }
    };

    const onFormChange = (update: Partial<RunbookFormData>) => {
        setFormData((prev) => ({ ...prev, ...update }));
    };

    return {
        runbooks,
        stats,
        isLoading,
        errorMessage,
        setErrorMessage,
        searchInput,
        setSearchInput,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        filterDropdowns,
        clearAllFilters,
        kpiData,
        isCreateModalOpen,
        isDetailModalOpen,
        isDeleteModalOpen,
        editingRunbook,
        viewingRunbook,
        deletingRunbook,
        formData,
        stepIds,
        formErrors,
        isSaving,
        isDeleting,
        fetchRunbooks,
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseCreateModal,
        handleSaveRunbook,
        handleAddStep,
        handleRemoveStep,
        handleStepChange,
        handleViewRunbook,
        handleCloseDetailModal,
        handleOpenDeleteModal,
        handleConfirmDelete,
        handleCloseDeleteModal,
        onFormChange,
    };
}
