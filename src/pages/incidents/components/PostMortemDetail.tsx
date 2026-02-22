/**
 * Post-Mortem Expanded Row Detail
 *
 * Shows root cause, impact, timeline, action items, and prevention measures
 * inside the expanded row of the post-mortem DataTable.
 */

import React from 'react';
import { Tag } from '@carbon/react';

import type { PostMortem } from '@/shared/services';
import { parseJsonField } from './postmortem.types';
import type { TimelineEntry, ActionItem } from './postmortem.types';

interface PostMortemDetailProps {
  postMortem: PostMortem;
}

export const PostMortemDetail = React.memo(function PostMortemDetail({ postMortem }: PostMortemDetailProps) {
  const timeline = parseJsonField<TimelineEntry[]>(postMortem.timeline);
  const actionItems = parseJsonField<ActionItem[]>(postMortem.action_items);

  return (
    <div className="post-mortems-page__detail">
      {/* Root Cause + Impact */}
      <div className="post-mortems-page__detail-grid">
        <div className="post-mortems-page__detail-section">
          <span className="post-mortems-page__detail-label">Root Cause</span>
          <span className="post-mortems-page__detail-text">
            {postMortem.root_cause || 'Not documented'}
          </span>
        </div>
        <div className="post-mortems-page__detail-section">
          <span className="post-mortems-page__detail-label">Impact</span>
          <span className="post-mortems-page__detail-text">
            {postMortem.impact_description || 'Not documented'}
          </span>
        </div>
      </div>

      {/* Timeline */}
      {Array.isArray(timeline) && timeline.length > 0 && (
        <div className="post-mortems-page__detail-section">
          <span className="post-mortems-page__detail-label">Timeline</span>
          <div className="post-mortems-page__timeline">
            {timeline.map((entry, idx) => (
              <div key={idx} className="post-mortems-page__timeline-entry">
                <span className="post-mortems-page__timeline-time">
                  {entry.time}
                </span>
                <span className="post-mortems-page__timeline-event">
                  {entry.event}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {Array.isArray(actionItems) && actionItems.length > 0 && (
        <div className="post-mortems-page__detail-section">
          <span className="post-mortems-page__detail-label">Action Items</span>
          <div className="post-mortems-page__action-items">
            {actionItems.map((item, idx) => (
              <div key={idx} className="post-mortems-page__action-item">
                <span className="post-mortems-page__action-item-text">
                  {item.item}
                </span>
                <span className="post-mortems-page__action-item-assignee">
                  {item.assignee}
                </span>
                <Tag
                  type={
                    item.status === 'completed'
                      ? 'green'
                      : item.status === 'in-progress'
                        ? 'blue'
                        : 'gray'
                  }
                  size="sm"
                >
                  {item.status}
                </Tag>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prevention Measures */}
      {postMortem.prevention_measures && (
        <div className="post-mortems-page__detail-section">
          <span className="post-mortems-page__detail-label">Prevention Measures</span>
          <div className="post-mortems-page__prevention">
            {postMortem.prevention_measures}
          </div>
        </div>
      )}
    </div>
  );
});
