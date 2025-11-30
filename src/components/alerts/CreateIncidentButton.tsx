/**
 * CreateIncidentButton Component
 * Triggers ServiceNow incident creation from an alert
 *
 * @architecture docs/arch/Output&Integration/Component.puml
 * "AgentsAPI --> TicketingConnector : Send incident creation"
 *
 * @see docs/arch/Output&Integration/Class.puml
 * "class TicketingConnector { +createIncident(alert: Alert) }"
 */

import { useState } from 'react';
import { Button, InlineLoading, Link, Modal } from '@carbon/react';
import { ServiceDesk, Launch, CheckmarkFilled } from '@carbon/icons-react';
import { ticketingService, type Incident } from '../../services/TicketingService';
import type { Alert } from '../../models';

interface CreateIncidentButtonProps {
  alert: Alert;
  size?: 'sm' | 'md' | 'lg';
  kind?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
}

/**
 * Button to create a ServiceNow incident from an alert
 */
export function CreateIncidentButton({
  alert,
  size = 'sm',
  kind = 'tertiary',
}: CreateIncidentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isEnabled = ticketingService.isEnabled();

  if (!isEnabled) {
    return null; // Don't render if ticketing is disabled
  }

  const handleCreateIncident = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ticketingService.createIncidentFromAlert(alert);

      if (result.success && result.incident) {
        setIncident(result.incident);
        setShowModal(true);
      } else {
        setError(result.error || 'Failed to create incident');
      }
    } catch {
      setError('Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  if (incident) {
    return (
      <>
        <Button
          kind="ghost"
          size={size}
          renderIcon={CheckmarkFilled}
          onClick={() => setShowModal(true)}
        >
          Incident Created
        </Button>

        <Modal
          open={showModal}
          onRequestClose={() => setShowModal(false)}
          modalHeading="Incident Created"
          primaryButtonText="Close"
          onRequestSubmit={() => setShowModal(false)}
          size="sm"
        >
          <div className="create-incident-modal">
            <p className="create-incident-modal__success">
              <CheckmarkFilled size={24} className="create-incident-modal__icon" />
              Incident successfully created in {ticketingService.getProvider()}.
            </p>

            <dl className="create-incident-modal__details">
              <dt>Incident ID</dt>
              <dd>{incident.externalId || incident.id}</dd>

              <dt>Title</dt>
              <dd>{incident.title}</dd>

              <dt>Status</dt>
              <dd>{incident.status}</dd>
            </dl>

            {incident.externalUrl && (
              <Link
                href={incident.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                renderIcon={Launch}
              >
                View in {ticketingService.getProvider()}
              </Link>
            )}
          </div>
        </Modal>
      </>
    );
  }

  if (loading) {
    return <InlineLoading description="Creating incident..." />;
  }

  return (
    <>
      <Button
        kind={kind}
        size={size}
        renderIcon={ServiceDesk}
        onClick={handleCreateIncident}
        disabled={loading}
      >
        Create Incident
      </Button>

      {error && (
        <Modal
          open={!!error}
          onRequestClose={() => setError(null)}
          modalHeading="Error"
          primaryButtonText="Close"
          onRequestSubmit={() => setError(null)}
          size="sm"
        >
          <p>{error}</p>
        </Modal>
      )}
    </>
  );
}
