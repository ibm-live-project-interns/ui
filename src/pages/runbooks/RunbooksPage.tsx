/**
 * Copyright IBM Corp. 2026
 *
 * Runbooks & Knowledge Base Page
 * Displays operational runbooks for common network incidents.
 * Supports searching, filtering by category, creating/editing runbooks,
 * and viewing full runbook detail with numbered steps.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    ClickableTile,
    Tag,
    Modal,
    TextInput,
    TextArea,
    Select,
    SelectItem,
    Button,
    Search,
    Dropdown,
    Tile,
    SkeletonText,
    InlineNotification,
    IconButton,
} from '@carbon/react';
import {
    Add,
    Book,
    Category,
    Edit,
    TrashCan,
    Close,
    Renew,
    Time,
    View,
    ArrowRight,
    StarFilled,
    DocumentBlank,
} from '@carbon/icons-react';

// Reusable components
import { KPICard, PageHeader, EmptyState } from '@/components';
import type { KPICardProps } from '@/components/ui/KPICard';

// Config
import { HttpService } from '@/shared/api';
import { env } from '@/shared/config';
import { ROUTES } from '@/shared/constants/routes';

// Styles
import '@/styles/components/_kpi-card.scss';
import '@/styles/pages/_runbooks.scss';

// ==========================================
// Types
// ==========================================

interface RunbookStep {
    order: number;
    instruction: string;
}

interface Runbook {
    id: number;
    title: string;
    category: string;
    description: string;
    steps: RunbookStep[];
    related_alert_types: string[];
    author: string;
    last_updated: string;
    usage_count: number;
    created_at: string;
}

interface RunbookStats {
    total_runbooks: number;
    total_categories: number;
    most_used_title: string;
    most_used_count: number;
    recently_updated: string;
    recently_updated_at: string;
}

interface RunbooksResponse {
    runbooks: Runbook[];
    total: number;
    stats: RunbookStats;
}

interface RunbookFormData {
    title: string;
    category: string;
    description: string;
    steps: string[];
    related_alert_types: string[];
}

interface FilterOption {
    id: string;
    text: string;
}

// ==========================================
// Runbook API Service
// ==========================================

class RunbookService extends HttpService {
    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath, 'RunbookService');
    }

    async getRunbooks(params: {
        search?: string;
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<RunbooksResponse> {
        const queryParts: string[] = [];
        if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
        if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
        if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);

        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        try {
            return await this.get<RunbooksResponse>(`/runbooks${query}`);
        } catch (error) {
            console.warn('[RunbookService] GET /runbooks not available, returning empty:', error);
            return {
                runbooks: [],
                total: 0,
                stats: {
                    total_runbooks: 0,
                    total_categories: 0,
                    most_used_title: 'N/A',
                    most_used_count: 0,
                    recently_updated: 'N/A',
                    recently_updated_at: '',
                },
            };
        }
    }

    async getRunbook(id: number): Promise<{ runbook: Runbook }> {
        return await this.get<{ runbook: Runbook }>(`/runbooks/${id}`);
    }

    async createRunbook(data: RunbookFormData): Promise<{ runbook: Runbook; message: string }> {
        return await this.post<{ runbook: Runbook; message: string }>('/runbooks', data);
    }

    async updateRunbook(id: number, data: RunbookFormData): Promise<{ runbook: Runbook; message: string }> {
        return await this.put<{ runbook: Runbook; message: string }>(`/runbooks/${id}`, data);
    }

    async deleteRunbook(id: number): Promise<{ message: string }> {
        return await this.delete<{ message: string }>(`/runbooks/${id}`);
    }
}

const runbookService = new RunbookService();

// ==========================================
// Constants
// ==========================================

const CATEGORY_FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', text: 'All Categories' },
    { id: 'Hardware', text: 'Hardware' },
    { id: 'Network', text: 'Network' },
    { id: 'Software', text: 'Software' },
    { id: 'Security', text: 'Security' },
];

const CATEGORY_TAG_TYPES: Record<string, 'red' | 'blue' | 'purple' | 'teal' | 'warm-gray'> = {
    Hardware: 'red',
    Network: 'blue',
    Software: 'purple',
    Security: 'teal',
};

const EMPTY_FORM: RunbookFormData = {
    title: '',
    category: '',
    description: '',
    steps: [''],
    related_alert_types: [],
};

// Counter for unique step IDs -- array indices cause reconciliation issues when reordering
let stepIdCounter = 0;
const nextStepId = () => `step-${++stepIdCounter}`;

// ==========================================
// Helpers
// ==========================================

function formatDate(isoString: string): string {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return isoString;
    }
}

function formatRelativeDate(isoString: string): string {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return formatDate(isoString);
    } catch {
        return isoString;
    }
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trimEnd() + '...';
}

// ==========================================
// Component
// ==========================================

export function RunbooksPage() {
    // Data state
    const [runbooks, setRunbooks] = useState<Runbook[]>([]);
    const [stats, setStats] = useState<RunbookStats>({
        total_runbooks: 0,
        total_categories: 0,
        most_used_title: 'N/A',
        most_used_count: 0,
        recently_updated: 'N/A',
        recently_updated_at: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FilterOption>(CATEGORY_FILTER_OPTIONS[0]);

    // Debounce search to avoid firing API call on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRunbook, setEditingRunbook] = useState<Runbook | null>(null);
    const [viewingRunbook, setViewingRunbook] = useState<Runbook | null>(null);
    const [deletingRunbook, setDeletingRunbook] = useState<Runbook | null>(null);
    const [formData, setFormData] = useState<RunbookFormData>({ ...EMPTY_FORM });
    // Stable step IDs for React key (instead of array index)
    const [stepIds, setStepIds] = useState<string[]>([nextStepId()]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    // Track delete operation loading state
    const [isDeleting, setIsDeleting] = useState(false);

    // ==========================================
    // Data Fetching
    // ==========================================

    const fetchRunbooks = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await runbookService.getRunbooks({
                search: searchQuery || undefined,
                category: selectedCategory.id !== 'all' ? selectedCategory.id : undefined,
            });
            setRunbooks(response.runbooks || []);
            if (response.stats) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('[RunbooksPage] Failed to fetch runbooks:', error);
            setErrorMessage('Failed to load runbooks. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedCategory]);

    useEffect(() => {
        let isMounted = true;
        const doFetch = async () => {
            if (!isMounted) return;
            await fetchRunbooks();
        };
        doFetch();
        return () => { isMounted = false; };
    }, [fetchRunbooks]);

    // ==========================================
    // KPI Data
    // ==========================================

    const kpiData = useMemo((): KPICardProps[] => [
        {
            id: 'total-runbooks',
            label: 'Total Runbooks',
            value: stats.total_runbooks,
            icon: Book,
            iconColor: '#0f62fe',
            severity: 'info' as const,
            subtitle: 'Knowledge base articles',
        },
        {
            id: 'categories',
            label: 'Categories',
            value: stats.total_categories,
            icon: Category,
            iconColor: '#8a3ffc',
            severity: 'neutral' as const,
            subtitle: 'Hardware, Network, Software, Security',
        },
        {
            id: 'most-used',
            label: 'Most Used Runbook',
            value: stats.most_used_count,
            icon: StarFilled,
            iconColor: '#f1c21b',
            severity: 'success' as const,
            subtitle: truncateText(stats.most_used_title, 40),
        },
        {
            id: 'recently-updated',
            label: 'Recently Updated',
            value: formatRelativeDate(stats.recently_updated_at),
            icon: Time,
            iconColor: '#198038',
            severity: 'success' as const,
            subtitle: truncateText(stats.recently_updated, 40),
        },
    ], [stats]);

    // ==========================================
    // Form Handling
    // ==========================================

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }
        if (!formData.category) {
            errors.category = 'Category is required';
        }
        if (!formData.description.trim()) {
            errors.description = 'Description is required';
        }
        const nonEmptySteps = formData.steps.filter((s) => s.trim() !== '');
        if (nonEmptySteps.length === 0) {
            errors.steps = 'At least one step is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenCreateModal = () => {
        setEditingRunbook(null);
        setFormData({ ...EMPTY_FORM });
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
        setFormData({ ...EMPTY_FORM });
        setStepIds([nextStepId()]);
        setFormErrors({});
        setIsSaving(false);
    };

    const handleSaveRunbook = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        setErrorMessage('');
        try {
            // Filter out empty steps
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
        } catch (error) {
            console.error('[RunbooksPage] Save failed:', error);
            setErrorMessage(
                error instanceof Error ? error.message : 'Failed to save runbook. Please try again.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStep = () => {
        setFormData((prev) => ({
            ...prev,
            steps: [...prev.steps, ''],
        }));
        setStepIds((prev) => [...prev, nextStepId()]);
    };

    const handleRemoveStep = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
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
    // Detail View
    // ==========================================

    const handleViewRunbook = async (runbook: Runbook) => {
        try {
            // Fetch full details (also increments usage count)
            const response = await runbookService.getRunbook(runbook.id);
            setViewingRunbook(response.runbook);
        } catch {
            // Fallback to the data we already have
            setViewingRunbook(runbook);
        }
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setViewingRunbook(null);
    };

    // ==========================================
    // Delete
    // ==========================================

    const handleOpenDeleteModal = (runbook: Runbook) => {
        setDeletingRunbook(runbook);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRunbook) return;

        setErrorMessage('');
        setIsDeleting(true);
        try {
            await runbookService.deleteRunbook(deletingRunbook.id);
            setIsDeleteModalOpen(false);
            setDeletingRunbook(null);

            // If the detail modal is also open for this runbook, close it
            if (viewingRunbook && viewingRunbook.id === deletingRunbook.id) {
                handleCloseDetailModal();
            }

            await fetchRunbooks();
        } catch (error) {
            console.error('[RunbooksPage] Delete failed:', error);
            setErrorMessage(
                error instanceof Error ? error.message : 'Failed to delete runbook. Please try again.'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // ==========================================
    // Loading Skeleton
    // ==========================================

    if (isLoading && runbooks.length === 0) {
        return (
            <div className="runbooks-page">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: ROUTES.DASHBOARD },
                        { label: 'Runbooks', active: true },
                    ]}
                    title="Runbooks & Knowledge Base"
                    subtitle="Loading runbook data..."
                    showBorder
                />

                <div className="runbooks-page__content">
                    <div className="kpi-row">
                        {[1, 2, 3, 4].map((i) => (
                            <Tile key={i} className="kpi-card-skeleton">
                                <SkeletonText width="60%" />
                                <SkeletonText heading width="40%" />
                                <SkeletonText width="80%" />
                            </Tile>
                        ))}
                    </div>

                    <div className="runbooks-page__grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Tile key={i} className="runbooks-page__card-skeleton">
                                <SkeletonText width="70%" />
                                <SkeletonText width="40%" />
                                <SkeletonText width="90%" />
                                <SkeletonText width="60%" />
                            </Tile>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // Render
    // ==========================================

    return (
        <div className="runbooks-page">
            {/* Page Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: ROUTES.DASHBOARD },
                    { label: 'Runbooks', active: true },
                ]}
                title="Runbooks & Knowledge Base"
                subtitle="Operational procedures and troubleshooting guides for common network incidents"
                showBorder
                actions={[
                    {
                        label: 'Refresh',
                        onClick: fetchRunbooks,
                        variant: 'secondary',
                        icon: Renew,
                    },
                    {
                        label: 'Create Runbook',
                        onClick: handleOpenCreateModal,
                        variant: 'primary',
                        icon: Add,
                    },
                ]}
            />

            <div className="runbooks-page__content">
                {/* Error Banner */}
                {errorMessage && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={errorMessage}
                        onCloseButtonClick={() => setErrorMessage('')}
                        className="runbooks-page__notification"
                    />
                )}

                {/* KPI Row */}
                <div className="kpi-row">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} {...kpi} />
                    ))}
                </div>

                {/* Search & Filter Bar */}
                <div className="runbooks-page__filters">
                    <Search
                        size="lg"
                        placeholder="Search runbooks by title, description, or author..."
                        labelText="Search runbooks"
                        value={searchInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchInput(e.target.value);
                        }}
                        onClear={() => {
                            setSearchInput('');
                            setSearchQuery('');
                        }}
                        className="runbooks-page__search"
                    />

                    <Dropdown
                        id="category-filter"
                        label="Category"
                        titleText=""
                        items={CATEGORY_FILTER_OPTIONS}
                        itemToString={(item: FilterOption | null) => item?.text || ''}
                        selectedItem={selectedCategory}
                        onChange={({ selectedItem }: { selectedItem: FilterOption | null }) => {
                            setSelectedCategory(selectedItem || CATEGORY_FILTER_OPTIONS[0]);
                        }}
                        size="lg"
                    />
                </div>

                {/* Results Summary */}
                {(searchQuery || selectedCategory.id !== 'all') && (
                    <div className="runbooks-page__filter-summary">
                        Showing {runbooks.length} runbook{runbooks.length !== 1 ? 's' : ''}
                        {selectedCategory.id !== 'all' ? ` in ${selectedCategory.text}` : ''}
                        {searchQuery ? ` matching "${searchQuery}"` : ''}
                    </div>
                )}

                {/* Runbook Grid */}
                {runbooks.length === 0 && !isLoading ? (
                    <Tile className="runbooks-page__empty-state">
                        <EmptyState
                            icon={DocumentBlank}
                            title="No runbooks found"
                            description={
                                searchQuery || selectedCategory.id !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Get started by creating your first runbook.'
                            }
                            size="lg"
                            action={
                                !searchQuery && selectedCategory.id === 'all'
                                    ? { label: 'Create Runbook', onClick: handleOpenCreateModal }
                                    : undefined
                            }
                        />
                    </Tile>
                ) : (
                    <div className="runbooks-page__grid">
                        {runbooks.map((runbook) => (
                            <ClickableTile
                                key={runbook.id}
                                className="runbooks-page__card"
                                onClick={() => handleViewRunbook(runbook)}
                            >
                                <div className="runbooks-page__card-header">
                                    <Tag
                                        type={CATEGORY_TAG_TYPES[runbook.category] || 'warm-gray'}
                                        size="sm"
                                    >
                                        {runbook.category}
                                    </Tag>
                                    <div className="runbooks-page__card-actions">
                                        <IconButton
                                            kind="ghost"
                                            size="sm"
                                            label="Edit runbook"
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                handleOpenEditModal(runbook);
                                            }}
                                        >
                                            <Edit size={16} />
                                        </IconButton>
                                        <IconButton
                                            kind="ghost"
                                            size="sm"
                                            label="Delete runbook"
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                handleOpenDeleteModal(runbook);
                                            }}
                                        >
                                            <TrashCan size={16} />
                                        </IconButton>
                                    </div>
                                </div>

                                <h4 className="runbooks-page__card-title">{runbook.title}</h4>

                                <p className="runbooks-page__card-description">
                                    {truncateText(runbook.description, 120)}
                                </p>

                                <div className="runbooks-page__card-meta">
                                    <span className="runbooks-page__card-meta-item">
                                        <DocumentBlank size={14} />
                                        {runbook.steps.length} step{runbook.steps.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="runbooks-page__card-meta-item">
                                        <View size={14} />
                                        {runbook.usage_count} uses
                                    </span>
                                    <span className="runbooks-page__card-meta-item">
                                        <Time size={14} />
                                        {formatRelativeDate(runbook.last_updated)}
                                    </span>
                                </div>

                                <div className="runbooks-page__card-footer">
                                    <span className="runbooks-page__card-author">
                                        By {runbook.author}
                                    </span>
                                    <ArrowRight size={16} className="runbooks-page__card-arrow" />
                                </div>
                            </ClickableTile>
                        ))}
                    </div>
                )}
            </div>

            {/* ==========================================
                Create / Edit Runbook Modal
                ========================================== */}
            <Modal
                open={isCreateModalOpen}
                onRequestClose={handleCloseCreateModal}
                onRequestSubmit={handleSaveRunbook}
                modalHeading={editingRunbook ? 'Edit Runbook' : 'Create New Runbook'}
                primaryButtonText={isSaving ? 'Saving...' : editingRunbook ? 'Update Runbook' : 'Create Runbook'}
                secondaryButtonText="Cancel"
                primaryButtonDisabled={isSaving}
                size="lg"
                hasScrollingContent
            >
                <div className="runbooks-page__form">
                    <TextInput
                        id="runbook-title"
                        labelText="Title"
                        placeholder="e.g., High CPU Utilization: Diagnosis and Mitigation"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        invalid={!!formErrors.title}
                        invalidText={formErrors.title}
                    />

                    <Select
                        id="runbook-category"
                        labelText="Category"
                        value={formData.category}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setFormData((prev) => ({ ...prev, category: e.target.value }))
                        }
                        invalid={!!formErrors.category}
                        invalidText={formErrors.category}
                    >
                        <SelectItem value="" text="Select a category..." />
                        <SelectItem value="Hardware" text="Hardware" />
                        <SelectItem value="Network" text="Network" />
                        <SelectItem value="Software" text="Software" />
                        <SelectItem value="Security" text="Security" />
                    </Select>

                    <TextArea
                        id="runbook-description"
                        labelText="Description"
                        placeholder="Describe the purpose and scope of this runbook..."
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        invalid={!!formErrors.description}
                        invalidText={formErrors.description}
                        rows={3}
                    />

                    <div className="runbooks-page__form-steps">
                        <div className="runbooks-page__form-steps-header">
                            <span className="runbooks-page__form-steps-label">
                                Steps
                                {formErrors.steps && (
                                    <span className="runbooks-page__form-steps-error">
                                        {' '} - {formErrors.steps}
                                    </span>
                                )}
                            </span>
                            <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Add}
                                onClick={handleAddStep}
                            >
                                Add Step
                            </Button>
                        </div>

                        {formData.steps.map((step, index) => (
                            <div key={stepIds[index] || `fallback-${index}`} className="runbooks-page__form-step-row">
                                <span className="runbooks-page__form-step-number">
                                    {index + 1}.
                                </span>
                                <TextInput
                                    id={`runbook-step-${index}`}
                                    labelText=""
                                    hideLabel
                                    placeholder={`Step ${index + 1} instruction...`}
                                    value={step}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        handleStepChange(index, e.target.value)
                                    }
                                />
                                {formData.steps.length > 1 && (
                                    <IconButton
                                        kind="ghost"
                                        size="sm"
                                        label="Remove step"
                                        onClick={() => handleRemoveStep(index)}
                                    >
                                        <Close size={16} />
                                    </IconButton>
                                )}
                            </div>
                        ))}
                    </div>

                    <TextInput
                        id="runbook-alert-types"
                        labelText="Related Alert Types (comma-separated)"
                        placeholder="e.g., high_cpu, cpu_threshold, process_runaway"
                        value={formData.related_alert_types.join(', ')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev) => ({
                                ...prev,
                                related_alert_types: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s !== ''),
                            }))
                        }
                    />
                </div>
            </Modal>

            {/* ==========================================
                Runbook Detail Modal
                ========================================== */}
            <Modal
                open={isDetailModalOpen}
                onRequestClose={handleCloseDetailModal}
                passiveModal
                modalHeading={viewingRunbook?.title || 'Runbook Detail'}
                size="lg"
                hasScrollingContent
            >
                {viewingRunbook && (
                    <div className="runbooks-page__detail">
                        <div className="runbooks-page__detail-header">
                            <Tag
                                type={CATEGORY_TAG_TYPES[viewingRunbook.category] || 'warm-gray'}
                                size="md"
                            >
                                {viewingRunbook.category}
                            </Tag>
                            <div className="runbooks-page__detail-meta">
                                <span>By {viewingRunbook.author}</span>
                                <span>Updated {formatDate(viewingRunbook.last_updated)}</span>
                                <span>{viewingRunbook.usage_count} views</span>
                            </div>
                        </div>

                        <p className="runbooks-page__detail-description">
                            {viewingRunbook.description}
                        </p>

                        <h4 className="runbooks-page__detail-section-title">
                            Procedure ({viewingRunbook.steps.length} steps)
                        </h4>
                        <ol className="runbooks-page__detail-steps">
                            {viewingRunbook.steps.map((step) => (
                                <li key={step.order} className="runbooks-page__detail-step">
                                    <span className="runbooks-page__detail-step-number">
                                        {step.order}
                                    </span>
                                    <span className="runbooks-page__detail-step-text">
                                        {step.instruction}
                                    </span>
                                </li>
                            ))}
                        </ol>

                        {viewingRunbook.related_alert_types &&
                            viewingRunbook.related_alert_types.length > 0 && (
                                <>
                                    <h4 className="runbooks-page__detail-section-title">
                                        Related Alert Types
                                    </h4>
                                    <div className="runbooks-page__detail-tags">
                                        {viewingRunbook.related_alert_types.map((alertType) => (
                                            <Tag key={alertType} type="cool-gray" size="sm">
                                                {alertType}
                                            </Tag>
                                        ))}
                                    </div>
                                </>
                            )}

                        <div className="runbooks-page__detail-actions">
                            <Button
                                kind="secondary"
                                size="md"
                                renderIcon={Edit}
                                onClick={() => {
                                    handleCloseDetailModal();
                                    handleOpenEditModal(viewingRunbook);
                                }}
                            >
                                Edit Runbook
                            </Button>
                            <Button
                                kind="danger--ghost"
                                size="md"
                                renderIcon={TrashCan}
                                onClick={() => {
                                    handleCloseDetailModal();
                                    handleOpenDeleteModal(viewingRunbook);
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ==========================================
                Delete Confirmation Modal
                ========================================== */}
            <Modal
                open={isDeleteModalOpen}
                onRequestClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingRunbook(null);
                    setIsDeleting(false);
                }}
                onRequestSubmit={handleConfirmDelete}
                danger
                modalHeading="Delete Runbook"
                primaryButtonText={isDeleting ? 'Deleting...' : 'Delete'}
                primaryButtonDisabled={isDeleting}
                secondaryButtonText="Cancel"
                size="sm"
            >
                <p>
                    Are you sure you want to delete the runbook{' '}
                    <strong>{deletingRunbook?.title}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}

export default RunbooksPage;
