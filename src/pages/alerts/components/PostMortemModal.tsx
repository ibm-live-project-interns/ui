/**
 * Copyright IBM Corp. 2026
 *
 * Post-Mortem Section & Modal
 * Displays existing post-mortem data for resolved alerts and provides
 * a creation modal for new post-mortem reports.
 */

import React, { useCallback } from 'react';
import {
  Tile,
  Button,
  Tag,
  SkeletonText,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
} from '@carbon/react';
import {
  DocumentTasks,
  Add,
  TrashCan,
} from '@carbon/icons-react';

import { EmptyState } from '@/components/ui';
import type { DetailedAlert } from '@/features/alerts/types';
import { alertDataService } from '@/features/alerts/services';
import type {
  PostMortem,
  PostMortemActionItem,
} from '@/features/alerts/services/alertService';
import { useToast } from '@/contexts';
import { useFetchData, useFormModal } from '@/shared/hooks';
import { logger } from '@/shared/utils/logger';

// ==========================================
// Types & Constants
// ==========================================

interface PostMortemFormValues extends Record<string, unknown> {
  title: string;
  root_cause_category: string;
  impact_description: string;
  action_items: PostMortemActionItem[];
  prevention_measures: string;
}

const INITIAL_POST_MORTEM: PostMortemFormValues = {
  title: '',
  root_cause_category: 'unknown',
  impact_description: '',
  action_items: [{ description: '', assignee: '', due_date: '' }],
  prevention_measures: '',
};

const ROOT_CAUSE_CATEGORIES = [
  { value: 'human_error', text: 'Human Error' },
  { value: 'software_bug', text: 'Software Bug' },
  { value: 'hardware_failure', text: 'Hardware Failure' },
  { value: 'network_issue', text: 'Network Issue' },
  { value: 'configuration_change', text: 'Configuration Change' },
  { value: 'capacity', text: 'Capacity' },
  { value: 'external', text: 'External' },
  { value: 'unknown', text: 'Unknown' },
];

interface PostMortemSectionProps {
  alert: DetailedAlert;
}

// ==========================================
// Component
// ==========================================

export const PostMortemSection = React.memo(function PostMortemSection({ alert }: PostMortemSectionProps) {
  const { addToast } = useToast();

  // Only fetch post-mortem data for resolved alerts -- non-resolved alerts always 404
  const { data: existingPostMortem, isLoading, refetch } = useFetchData<PostMortem | null>(
    () => alert.status === 'resolved'
      ? alertDataService.getAlertPostMortem(alert.id)
      : Promise.resolve(null),
    [alert.id, alert.status],
    { onError: () => { /* 404 is expected when no post-mortem exists */ } }
  );

  const postMortemModal = useFormModal<PostMortemFormValues>({
    ...INITIAL_POST_MORTEM,
    title: `Post-Mortem: ${alert.aiTitle || alert.id}`,
  });

  const handleAddActionItem = useCallback(() => {
    const current = postMortemModal.values.action_items as PostMortemActionItem[];
    postMortemModal.setField('action_items', [...current, { description: '', assignee: '', due_date: '' }]);
  }, [postMortemModal]);

  const handleRemoveActionItem = useCallback((index: number) => {
    const current = postMortemModal.values.action_items as PostMortemActionItem[];
    if (current.length <= 1) return;
    postMortemModal.setField('action_items', current.filter((_, i) => i !== index));
  }, [postMortemModal]);

  const handleActionItemChange = useCallback((index: number, field: keyof PostMortemActionItem, value: string) => {
    const current = [...(postMortemModal.values.action_items as PostMortemActionItem[])];
    current[index] = { ...current[index], [field]: value };
    postMortemModal.setField('action_items', current);
  }, [postMortemModal]);

  const handleSubmitPostMortem = async () => {
    postMortemModal.setSubmitting(true);
    try {
      await alertDataService.createAlertPostMortem(alert.id, {
        title: postMortemModal.values.title as string,
        root_cause_category: postMortemModal.values.root_cause_category as string,
        impact_description: postMortemModal.values.impact_description as string,
        action_items: postMortemModal.values.action_items as PostMortemActionItem[],
        prevention_measures: postMortemModal.values.prevention_measures as string,
      });
      addToast('success', 'Post-Mortem Created', 'Post-mortem report has been saved.');
      postMortemModal.close();
      refetch();
    } catch (err) {
      logger.error('Failed to create post-mortem', err);
      addToast('error', 'Failed to Create Post-Mortem', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      postMortemModal.setSubmitting(false);
    }
  };

  // Only show for resolved alerts
  if (alert.status !== 'resolved') return null;

  if (isLoading) {
    return (
      <Tile className="alert-card alert-enrichment-card">
        <div className="alert-card__header">
          <DocumentTasks size={20} />
          <h3 className="alert-card__title">Post-Mortem</h3>
        </div>
        <SkeletonText lineCount={3} />
      </Tile>
    );
  }

  const categoryLabel = ROOT_CAUSE_CATEGORIES.find(
    (c) => c.value === existingPostMortem?.root_cause_category
  )?.text;

  return (
    <>
      <Tile className="alert-card alert-enrichment-card">
        <div className="alert-card__header">
          <DocumentTasks size={20} />
          <h3 className="alert-card__title">Post-Mortem</h3>
        </div>
        {existingPostMortem ? (
          <div className="alert-enrichment__postmortem-summary">
            <h4 className="alert-enrichment__postmortem-title">{existingPostMortem.title}</h4>
            <div className="alert-card__row">
              <span className="alert-card__label">Root Cause</span>
              <Tag size="sm" type="red">
                {categoryLabel || existingPostMortem.root_cause_category}
              </Tag>
            </div>
            <div className="alert-card__row">
              <span className="alert-card__label">Impact</span>
              <span className="alert-card__value">{existingPostMortem.impact_description}</span>
            </div>
            {existingPostMortem.action_items?.length > 0 && (
              <div className="alert-enrichment__postmortem-actions">
                <h5 className="alert-card__section-title">Action Items</h5>
                {existingPostMortem.action_items.map((item, i) => (
                  <div key={i} className="alert-enrichment__postmortem-action-item">
                    <span className="alert-card__action-number">{i + 1}</span>
                    <div>
                      <div>{item.description}</div>
                      <div className="alert-enrichment__postmortem-action-meta">
                        {item.assignee && <Tag size="sm" type="blue">{item.assignee}</Tag>}
                        {item.due_date && <span>Due: {item.due_date}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {existingPostMortem.prevention_measures && (
              <div className="alert-card__section">
                <h5 className="alert-card__section-title">Prevention Measures</h5>
                <p className="alert-card__text">{existingPostMortem.prevention_measures}</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            size="sm"
            title="No post-mortem yet"
            description="Create a post-mortem to document root cause, impact, and prevention measures."
            action={{
              label: 'Create Post-Mortem',
              onClick: () => postMortemModal.open(),
              icon: Add,
            }}
          />
        )}
      </Tile>

      {/* Post-Mortem Creation Modal */}
      <Modal
        open={postMortemModal.isOpen}
        onRequestClose={postMortemModal.close}
        modalHeading="Create Post-Mortem Report"
        primaryButtonText={postMortemModal.isSubmitting ? 'Saving...' : 'Save Post-Mortem'}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleSubmitPostMortem}
        primaryButtonDisabled={postMortemModal.isSubmitting || !(postMortemModal.values.title as string)?.trim()}
        size="lg"
      >
        <div className="alert-enrichment__postmortem-form">
          <TextInput
            id="pm-title"
            labelText="Title"
            placeholder="Post-mortem title"
            value={postMortemModal.values.title as string}
            onChange={(e) => postMortemModal.setField('title', e.target.value)}
          />

          <Select
            id="pm-root-cause"
            labelText="Root Cause Category"
            value={postMortemModal.values.root_cause_category as string}
            onChange={(e) => postMortemModal.setField('root_cause_category', e.target.value)}
          >
            {ROOT_CAUSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} text={cat.text} />
            ))}
          </Select>

          <TextArea
            id="pm-impact"
            labelText="Impact Description"
            placeholder="Describe the impact of this incident..."
            value={postMortemModal.values.impact_description as string}
            onChange={(e) => postMortemModal.setField('impact_description', e.target.value)}
            rows={3}
          />

          <div className="alert-enrichment__postmortem-action-items">
            <div className="alert-enrichment__postmortem-action-header">
              <h4>Action Items</h4>
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={handleAddActionItem}>
                Add Item
              </Button>
            </div>
            {(postMortemModal.values.action_items as PostMortemActionItem[]).map((item, idx) => (
              <div key={idx} className="alert-enrichment__postmortem-action-row">
                <TextInput
                  id={`pm-action-${idx}`}
                  labelText={`Action ${idx + 1}`}
                  placeholder="Describe the action item"
                  value={item.description}
                  onChange={(e) => handleActionItemChange(idx, 'description', e.target.value)}
                  size="md"
                />
                <TextInput
                  id={`pm-assignee-${idx}`}
                  labelText="Assignee"
                  placeholder="Assignee name"
                  value={item.assignee}
                  onChange={(e) => handleActionItemChange(idx, 'assignee', e.target.value)}
                  size="md"
                />
                <TextInput
                  id={`pm-due-${idx}`}
                  labelText="Due Date"
                  placeholder="YYYY-MM-DD"
                  value={item.due_date}
                  onChange={(e) => handleActionItemChange(idx, 'due_date', e.target.value)}
                  size="md"
                />
                <Button
                  kind="danger--ghost"
                  size="sm"
                  hasIconOnly
                  iconDescription="Remove"
                  renderIcon={TrashCan}
                  onClick={() => handleRemoveActionItem(idx)}
                  disabled={(postMortemModal.values.action_items as PostMortemActionItem[]).length <= 1}
                />
              </div>
            ))}
          </div>

          <TextArea
            id="pm-prevention"
            labelText="Prevention Measures"
            placeholder="What steps will prevent this from happening again?"
            value={postMortemModal.values.prevention_measures as string}
            onChange={(e) => postMortemModal.setField('prevention_measures', e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </>
  );
});
