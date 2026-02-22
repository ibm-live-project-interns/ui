/**
 * Copyright IBM Corp. 2026
 *
 * TicketDetailPanel - Right panel of the split-view ticket layout.
 * Shows ticket header, tabs (Overview | Activity | Related Alerts),
 * SLA timer, resolution actions, and linked alerts.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Tag,
  Tile,
  SkeletonText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextArea,
} from '@carbon/react';
import {
  Checkmark,
  UserMultiple,
  Time,
  Activity,
  ArrowRight,
  Link as LinkIcon,
} from '@carbon/icons-react';

import { EmptyState, SLATimer, ActivityTimeline } from '@/components';
import type { ActivityEntry } from '@/components/ui/ActivityTimeline';
import type { TicketInfo } from '@/shared/services';
import type { TicketComment } from '@/features/tickets/services/ticketService';
import {
  getPriorityTag,
  getTicketStatusTag,
} from '@/shared/constants/tickets';
import { formatRelativeTime, isLinkableAlertId } from './ticketHelpers';

// ==========================================
// Props
// ==========================================

export interface TicketDetailPanelProps {
  ticket: TicketInfo;
  comments: TicketComment[];
  isLoadingComments: boolean;
  activityEntries: ActivityEntry[];
  detailTab: number;
  onTabChange: (index: number) => void;
  onResolve: () => void;
  onAddComment: (content: string) => void;
  onViewFull: () => void;
}

// ==========================================
// Component
// ==========================================

export const TicketDetailPanel = React.memo(function TicketDetailPanel({
  ticket,
  comments,
  isLoadingComments,
  activityEntries,
  detailTab,
  onTabChange,
  onResolve,
  onAddComment,
  onViewFull,
}: TicketDetailPanelProps) {
  const [newComment, setNewComment] = useState('');
  const navigate = useNavigate();

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  const hasLinkableAlert = isLinkableAlertId(ticket.alertId);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  return (
    <div className="ticket-detail-panel">
      {/* Header */}
      <div className="ticket-detail-panel__header">
        <div className="ticket-detail-panel__header-top">
          <div className="ticket-detail-panel__id-row">
            <span className="ticket-detail-panel__ticket-id">{ticket.ticketNumber}</span>
            {getPriorityTag(ticket.priority, 'md')}
            {getTicketStatusTag(ticket.status as 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed', 'md')}
          </div>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={ArrowRight}
            onClick={onViewFull}
            title="Open full ticket details"
          >
            Full View
          </Button>
        </div>
        <h3 className="ticket-detail-panel__title">{ticket.title}</h3>
        <div className="ticket-detail-panel__meta">
          <span className="ticket-detail-panel__meta-item">
            <UserMultiple size={14} />
            {ticket.assignedTo || 'Unassigned'}
          </span>
          <span className="ticket-detail-panel__meta-item">
            <Time size={14} />
            {formatRelativeTime(ticket.createdAt)}
          </span>
          {ticket.deviceName && (
            <span className="ticket-detail-panel__meta-item">
              <LinkIcon size={14} />
              {ticket.deviceName}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs selectedIndex={detailTab} onChange={(data) => onTabChange(data.selectedIndex)}>
        <TabList aria-label="Ticket detail tabs" contained>
          <Tab>Overview</Tab>
          <Tab>Activity</Tab>
          <Tab>Related Alerts</Tab>
        </TabList>
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel className="ticket-detail-panel__tab-content">
            {/* SLA Timer */}
            <SLATimer
              createdAt={ticket.createdAt}
              priority={ticket.priority}
              isResolved={isResolved}
            />

            {/* Description */}
            <div className="ticket-detail-panel__section">
              <h4 className="ticket-detail-panel__section-title">Description</h4>
              <p className="ticket-detail-panel__description">
                {ticket.description || 'No description provided.'}
              </p>
            </div>

            {/* Device link */}
            {ticket.deviceName && ticket.deviceName !== 'Unknown' && ticket.deviceName !== 'Manual Entry' && (
              <div className="ticket-detail-panel__section">
                <h4 className="ticket-detail-panel__section-title">Linked Device</h4>
                <Tag type="cyan" size="md">{ticket.deviceName}</Tag>
              </div>
            )}

            {/* Resolution Notes / Resolve Action */}
            {!isResolved && (
              <div className="ticket-detail-panel__section ticket-detail-panel__resolve-section">
                <h4 className="ticket-detail-panel__section-title">Resolution Notes</h4>
                <TextArea
                  id="detail-resolve-notes"
                  labelText="Resolution notes"
                  hideLabel
                  placeholder="Add resolution details..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="ticket-detail-panel__resolve-actions">
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                  >
                    Post Note
                  </Button>
                  <Button
                    kind="primary"
                    size="sm"
                    renderIcon={Checkmark}
                    onClick={onResolve}
                  >
                    Resolve Ticket
                  </Button>
                </div>
              </div>
            )}

            {isResolved && (
              <div className="ticket-detail-panel__section">
                <Tag type="green" size="md">Resolved</Tag>
              </div>
            )}
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel className="ticket-detail-panel__tab-content">
            {isLoadingComments ? (
              <div className="ticket-detail-panel__loading">
                <SkeletonText paragraph lineCount={4} />
              </div>
            ) : (
              <ActivityTimeline entries={activityEntries} initialLimit={10} />
            )}
          </TabPanel>

          {/* Related Alerts Tab */}
          <TabPanel className="ticket-detail-panel__tab-content">
            {hasLinkableAlert ? (
              <div className="ticket-detail-panel__section">
                <h4 className="ticket-detail-panel__section-title">Linked Alert</h4>
                <Tile className="ticket-detail-panel__alert-card">
                  <div className="ticket-detail-panel__alert-card-content">
                    <span className="ticket-number">{ticket.alertId}</span>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={ArrowRight}
                      onClick={() => navigate(`/alerts/${ticket.alertId}`)}
                    >
                      View Alert
                    </Button>
                  </div>
                </Tile>
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No related alerts"
                description="This ticket was created manually and has no linked alerts"
                size="sm"
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
});
