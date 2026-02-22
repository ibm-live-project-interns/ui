/**
 * Copyright IBM Corp. 2026
 *
 * Container Log Modal Component
 * Modal dialog for viewing Docker container log output with
 * configurable line count and refresh capability.
 */

import React from 'react';
import {
  Modal,
  Button,
  Dropdown,
  InlineNotification,
  Loading,
} from '@carbon/react';
import { Renew } from '@carbon/icons-react';

// ==========================================
// Types
// ==========================================

interface ContainerLogModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Name of the service whose logs are being viewed */
  serviceName: string;
  /** The raw log content string */
  logsContent: string;
  /** Whether logs are currently loading */
  logsLoading: boolean;
  /** Error message if log fetch failed */
  logsError: string | null;
  /** Whether Docker is unavailable */
  logsDockerUnavailable: boolean;
  /** Currently selected number of log lines */
  logLines: string;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when line count changes */
  onLogLinesChange: (lines: string) => void;
  /** Callback when refresh button is clicked */
  onRefreshLogs: () => void;
}

// ==========================================
// Constants
// ==========================================

const LOG_LINE_OPTIONS = [
  { id: '50', text: '50 lines' },
  { id: '100', text: '100 lines' },
  { id: '200', text: '200 lines' },
  { id: '500', text: '500 lines' },
  { id: '1000', text: '1000 lines' },
];

// ==========================================
// Component
// ==========================================

export const ContainerLogModal = React.memo(function ContainerLogModal({
  open,
  serviceName,
  logsContent,
  logsLoading,
  logsError,
  logsDockerUnavailable,
  logLines,
  onClose,
  onLogLinesChange,
  onRefreshLogs,
}: ContainerLogModalProps) {
  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading={`Logs: ${serviceName}`}
      passiveModal
      size="lg"
      className="service-status-page__logs-modal"
    >
      <div className="logs-modal-controls">
        <Dropdown
          id="log-lines-dropdown"
          titleText="Lines"
          label="Select line count"
          items={LOG_LINE_OPTIONS}
          itemToString={(item: { id: string; text: string } | null) => item?.text ?? ''}
          selectedItem={LOG_LINE_OPTIONS.find((o) => o.id === logLines) ?? LOG_LINE_OPTIONS[1]}
          onChange={({ selectedItem }: { selectedItem: { id: string; text: string } | null }) => {
            if (selectedItem) {
              onLogLinesChange(selectedItem.id);
            }
          }}
          size="sm"
        />
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Renew}
          onClick={onRefreshLogs}
          disabled={logsLoading}
        >
          Refresh
        </Button>
      </div>

      {logsDockerUnavailable && (
        <InlineNotification
          kind="info"
          title="Docker not available"
          subtitle="Log retrieval requires Docker socket access. To enable, mount /var/run/docker.sock into the api-gateway container."
          lowContrast
          hideCloseButton
          className="u-notification-gap"
        />
      )}

      {logsError && !logsDockerUnavailable && (
        <InlineNotification
          kind="warning"
          title="Log retrieval issue"
          subtitle={logsError}
          lowContrast
          hideCloseButton
          className="u-notification-gap"
        />
      )}

      <div className="logs-modal-content">
        {logsLoading ? (
          <div className="logs-loading">
            <Loading withOverlay={false} small description="Loading logs..." />
            <span>Fetching logs...</span>
          </div>
        ) : (
          <pre className="logs-output">{logsContent || 'No log output available.'}</pre>
        )}
      </div>
    </Modal>
  );
});
