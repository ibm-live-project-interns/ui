/**
 * Copyright IBM Corp. 2026
 *
 * RunbookCard - Individual runbook card display.
 * Shows category tag, title, description, step count, usage, date, and author.
 */

import React from 'react';
import {
  ClickableTile,
  Tag,
  IconButton,
} from '@carbon/react';
import {
  Edit,
  TrashCan,
  Time,
  View,
  ArrowRight,
  DocumentBlank,
} from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

export interface Runbook {
  id: number;
  title: string;
  category: string;
  description: string;
  steps: { order: number; instruction: string }[];
  related_alert_types: string[];
  author: string;
  last_updated: string;
  usage_count: number;
  created_at: string;
}

// ==========================================
// Constants
// ==========================================

const CATEGORY_TAG_TYPES: Record<string, 'red' | 'blue' | 'purple' | 'teal' | 'warm-gray'> = {
  Hardware: 'red',
  Network: 'blue',
  Software: 'purple',
  Security: 'teal',
};

// ==========================================
// Helpers (imported from shared types)
// ==========================================

import { formatRelativeDate, truncateText } from './types';

// ==========================================
// Props
// ==========================================

export interface RunbookCardProps {
  runbook: Runbook;
  onView: (runbook: Runbook) => void;
  onEdit: (runbook: Runbook) => void;
  onDelete: (runbook: Runbook) => void;
}

// ==========================================
// Component
// ==========================================

export const RunbookCard = React.memo(function RunbookCard({
  runbook,
  onView,
  onEdit,
  onDelete,
}: RunbookCardProps) {
  return (
    <ClickableTile
      className="runbooks-page__card"
      onClick={() => onView(runbook)}
      aria-label={`View runbook: ${runbook.title}`}
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
              onEdit(runbook);
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
              onDelete(runbook);
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
  );
});
