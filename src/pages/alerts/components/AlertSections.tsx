/**
 * Copyright IBM Corp. 2026
 *
 * Alert Detail Sections
 * Extracted sub-components for the AlertDetailsPage enrichment sections:
 * - LinkedTicketsSection: tickets linked to this alert
 * - SuggestedRunbooksSection: runbooks matching alert category/severity
 * - RelatedAlertsSection: alerts from the same device
 * - OnCallCard: current on-call personnel
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tile,
  Tag,
  SkeletonText,
} from '@carbon/react';
import {
  Time,
  Activity,
  Ticket,
  Book,
  UserAvatar,
  Add,
  Phone,
} from '@carbon/icons-react';

import { EmptyState } from '@/components/ui';
import { SEVERITY_CONFIG } from '@/shared/constants';
import { ROUTES } from '@/shared/constants/routes';
import { alertDataService } from '@/features/alerts/services';
import type {
  LinkedTicket,
  SuggestedRunbook,
  OnCallScheduleEntry,
} from '@/features/alerts/services/alertService';
import { useToast } from '@/contexts';
import { useFetchData } from '@/shared/hooks';

// ==========================================
// LinkedTicketsSection
// ==========================================

export const LinkedTicketsSection = React.memo(function LinkedTicketsSection({ alertId }: { alertId: string }) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: tickets, isLoading } = useFetchData<LinkedTicket[]>(
    () => alertDataService.getAlertTickets(alertId),
    [alertId],
    { onError: (err) => addToast('error', 'Failed to load tickets', err.message) }
  );

  if (isLoading) {
    return (
      <Tile className="alert-card alert-enrichment-card">
        <div className="alert-card__header">
          <Ticket size={20} />
          <h3 className="alert-card__title">Linked Tickets</h3>
        </div>
        <SkeletonText lineCount={2} />
      </Tile>
    );
  }

  const ticketList = tickets || [];

  return (
    <Tile className="alert-card alert-enrichment-card">
      <div className="alert-card__header">
        <Ticket size={20} />
        <h3 className="alert-card__title">Linked Tickets</h3>
        <Tag size="sm" type="gray">{ticketList.length}</Tag>
      </div>
      {ticketList.length === 0 ? (
        <EmptyState
          size="sm"
          title="No linked tickets"
          description="No tickets have been created for this alert yet."
          action={{
            label: 'Create Ticket',
            onClick: () => navigate(`${ROUTES.TICKETS}?alertId=${alertId}`),
            icon: Add,
          }}
        />
      ) : (
        <div className="alert-enrichment__ticket-tags">
          {ticketList.map((t) => (
            <Tag
              key={t.id}
              type={t.status === 'resolved' ? 'green' : t.status === 'in_progress' ? 'blue' : 'gray'}
              size="md"
              className="alert-enrichment__ticket-tag"
              onClick={() => navigate(`/tickets/${t.id}`)}
              title={t.title}
            >
              {t.ticket_number || t.id} - {t.status}
            </Tag>
          ))}
        </div>
      )}
    </Tile>
  );
});

// ==========================================
// SuggestedRunbooksSection
// ==========================================

export const SuggestedRunbooksSection = React.memo(function SuggestedRunbooksSection({
  category,
  severity,
  alertTitle,
}: {
  category: string;
  severity: string;
  alertTitle?: string;
}) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: runbooks, isLoading } = useFetchData<SuggestedRunbook[]>(
    () => alertDataService.getSuggestedRunbooks(category, severity, alertTitle),
    [category, severity, alertTitle],
    { onError: (err) => addToast('error', 'Failed to load runbook suggestions', err.message) }
  );

  if (isLoading) {
    return (
      <Tile className="alert-card alert-enrichment-card">
        <div className="alert-card__header">
          <Book size={20} />
          <h3 className="alert-card__title">Suggested Runbooks</h3>
        </div>
        <SkeletonText lineCount={3} />
      </Tile>
    );
  }

  const runbookList = runbooks || [];

  return (
    <Tile className="alert-card alert-enrichment-card">
      <div className="alert-card__header">
        <Book size={20} />
        <h3 className="alert-card__title">Suggested Runbooks</h3>
      </div>
      {runbookList.length === 0 ? (
        <EmptyState
          size="sm"
          title="No matching runbooks"
          description="No runbooks match this alert's category and severity."
        />
      ) : (
        <div className="alert-enrichment__runbook-list">
          {runbookList.slice(0, 3).map((rb) => (
            <div
              key={rb.id}
              className="alert-enrichment__runbook-card"
              onClick={() => navigate(`${ROUTES.RUNBOOKS}?highlight=${rb.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`${ROUTES.RUNBOOKS}?highlight=${rb.id}`);
                }
              }}
            >
              <div className="alert-enrichment__runbook-title">{rb.title}</div>
              <div className="alert-enrichment__runbook-meta">
                <Tag size="sm" type="cool-gray">{rb.category}</Tag>
                <span className="alert-enrichment__runbook-time">
                  <Time size={14} /> {rb.estimated_time || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Tile>
  );
});

// ==========================================
// RelatedAlertsSection
// ==========================================

export const RelatedAlertsSection = React.memo(function RelatedAlertsSection({
  deviceName,
  currentAlertId,
}: {
  deviceName: string;
  currentAlertId: string;
}) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: relatedAlerts, isLoading } = useFetchData(
    () => alertDataService.getAlerts('24h'),
    [deviceName],
    { onError: (err) => addToast('error', 'Failed to load related alerts', err.message) }
  );

  const filteredAlerts = useMemo(() => {
    if (!relatedAlerts) return [];
    return relatedAlerts
      .filter((a) => a.device?.name === deviceName && a.id !== currentAlertId)
      .slice(0, 5);
  }, [relatedAlerts, deviceName, currentAlertId]);

  if (isLoading) {
    return (
      <Tile className="alert-card alert-enrichment-card">
        <div className="alert-card__header">
          <Activity size={20} />
          <h3 className="alert-card__title">Related Alerts (Same Device)</h3>
        </div>
        <SkeletonText lineCount={3} />
      </Tile>
    );
  }

  return (
    <Tile className="alert-card alert-enrichment-card">
      <div className="alert-card__header">
        <Activity size={20} />
        <h3 className="alert-card__title">Related Alerts (Same Device)</h3>
        <Tag size="sm" type="gray">{filteredAlerts.length}</Tag>
      </div>
      {filteredAlerts.length === 0 ? (
        <EmptyState
          size="sm"
          title="No related alerts"
          description="No other alerts from this device in the last 24 hours."
        />
      ) : (
        <div className="alert-enrichment__related-list">
          {filteredAlerts.map((a) => {
            const cfg = SEVERITY_CONFIG[a.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
            return (
              <div
                key={a.id}
                className="alert-enrichment__related-item"
                onClick={() => navigate(`/alerts/${a.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/alerts/${a.id}`);
                  }
                }}
              >
                <Tag type={cfg.tagType} size="sm">{cfg.label}</Tag>
                <span className="alert-enrichment__related-title">{a.aiTitle || 'Alert'}</span>
                <span className="alert-enrichment__related-time">
                  {typeof a.timestamp === 'string' ? a.timestamp : a.timestamp?.relative || 'N/A'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Tile>
  );
});

// ==========================================
// OnCallCard
// ==========================================

export const OnCallCard = React.memo(function OnCallCard() {
  const { addToast } = useToast();

  const { data: schedules, isLoading } = useFetchData<OnCallScheduleEntry[]>(
    () => alertDataService.getOnCallSchedules(),
    [],
    { onError: (err) => addToast('error', 'Failed to load on-call', err.message) }
  );

  // Find currently active on-call
  const activeOnCall = useMemo(() => {
    if (!schedules || schedules.length === 0) return null;
    const now = new Date();
    const active = schedules.find((s) => {
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      return now >= start && now <= end;
    });
    return active || schedules[0]; // Fall back to first entry
  }, [schedules]);

  if (isLoading) {
    return (
      <Tile className="alert-card alert-enrichment-card alert-enrichment-card--compact">
        <div className="alert-card__header">
          <Phone size={20} />
          <h3 className="alert-card__title">Current On-Call</h3>
        </div>
        <SkeletonText lineCount={2} />
      </Tile>
    );
  }

  if (!activeOnCall) {
    return (
      <Tile className="alert-card alert-enrichment-card alert-enrichment-card--compact">
        <div className="alert-card__header">
          <Phone size={20} />
          <h3 className="alert-card__title">Current On-Call</h3>
        </div>
        <EmptyState
          size="sm"
          title="No on-call schedule"
          description="No active on-call rotation found."
        />
      </Tile>
    );
  }

  return (
    <Tile className="alert-card alert-enrichment-card alert-enrichment-card--compact">
      <div className="alert-card__header">
        <Phone size={20} />
        <h3 className="alert-card__title">Current On-Call</h3>
      </div>
      <div className="alert-enrichment__oncall-info">
        <div className="alert-enrichment__oncall-person">
          <UserAvatar size={32} />
          <div>
            <div className="alert-enrichment__oncall-name">{activeOnCall.name}</div>
            <div className="alert-enrichment__oncall-role">{activeOnCall.role || activeOnCall.rotation_type}</div>
          </div>
        </div>
        {activeOnCall.contact && (
          <div className="alert-enrichment__oncall-contact">{activeOnCall.contact}</div>
        )}
      </div>
    </Tile>
  );
});
