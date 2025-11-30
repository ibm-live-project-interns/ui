import { useRef, useEffect } from 'react';
import {
  Layer,
  Button,
  Checkbox,
  FormGroup,
  IconButton,
} from '@carbon/react';
import { Close, Filter } from '@carbon/icons-react';
import type { AlertSeverity, AlertStatus } from '../../models';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeverities: AlertSeverity[];
  selectedStatuses: AlertStatus[];
  onSeverityChange: (severities: AlertSeverity[]) => void;
  onStatusChange: (statuses: AlertStatus[]) => void;
  onApply: () => void;
  onClear: () => void;
}

const severityOptions: { id: AlertSeverity; label: string }[] = [
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
  { id: 'info', label: 'Informational' },
];

const statusOptions: { id: AlertStatus; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
];

/**
 * FilterPanel - IBM-style side panel filter
 * Slides in from the right side, similar to IBM's filter pattern
 * @see https://carbondesignsystem.com/patterns/filtering
 */
export function FilterPanel({
  isOpen,
  onClose,
  selectedSeverities,
  selectedStatuses,
  onSeverityChange,
  onStatusChange,
  onApply,
  onClear,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSeverityToggle = (severity: AlertSeverity, checked: boolean) => {
    if (checked) {
      onSeverityChange([...selectedSeverities, severity]);
    } else {
      onSeverityChange(selectedSeverities.filter(s => s !== severity));
    }
  };

  const handleStatusToggle = (status: AlertStatus, checked: boolean) => {
    if (checked) {
      onStatusChange([...selectedStatuses, status]);
    } else {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    }
  };

  const activeFilterCount = selectedSeverities.length + selectedStatuses.length;

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="filter-panel__overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="filter-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Filter alerts"
      >
        <Layer>
          {/* Header */}
          <div className="filter-panel__header">
            <div className="filter-panel__title-row">
              <Filter size={20} />
              <h2 className="filter-panel__title">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="filter-panel__count">{activeFilterCount}</span>
              )}
            </div>
            <IconButton
              kind="ghost"
              size="sm"
              label="Close filters"
              onClick={onClose}
            >
              <Close size={20} />
            </IconButton>
          </div>

          {/* Filter Content */}
          <div className="filter-panel__content">
            {/* Severity Filters */}
            <FormGroup legendText="Severity" className="filter-panel__group">
              {severityOptions.map((option) => (
                <Checkbox
                  key={option.id}
                  id={`severity-${option.id}`}
                  labelText={option.label}
                  checked={selectedSeverities.includes(option.id)}
                  onChange={(_, { checked }) => handleSeverityToggle(option.id, checked)}
                />
              ))}
            </FormGroup>

            {/* Status Filters */}
            <FormGroup legendText="Status" className="filter-panel__group">
              {statusOptions.map((option) => (
                <Checkbox
                  key={option.id}
                  id={`status-${option.id}`}
                  labelText={option.label}
                  checked={selectedStatuses.includes(option.id)}
                  onChange={(_, { checked }) => handleStatusToggle(option.id, checked)}
                />
              ))}
            </FormGroup>
          </div>

          {/* Footer Actions */}
          <div className="filter-panel__footer">
            <Button kind="secondary" onClick={onClear} disabled={activeFilterCount === 0}>
              Clear all
            </Button>
            <Button kind="primary" onClick={onApply}>
              Apply filters
            </Button>
          </div>
        </Layer>
      </div>
    </>
  );
}
