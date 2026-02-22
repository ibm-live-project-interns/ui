/**
 * Copyright IBM Corp. 2026
 *
 * OverridesTab - Override management for On-Call page.
 * Shows override info and action to create new overrides.
 */

import React from 'react';
import { Button } from '@carbon/react';
import { Add, WarningAlt } from '@carbon/icons-react';

import { EmptyState } from '@/components/ui';

// ==========================================
// Props
// ==========================================

export interface OverridesTabProps {
  hasActiveSchedules: boolean;
  onAddOverride: () => void;
}

// ==========================================
// Component
// ==========================================

export const OverridesTab = React.memo(function OverridesTab({
  hasActiveSchedules,
  onAddOverride,
}: OverridesTabProps) {
  return (
    <div className="oncall-page__section">
      <div className="u-action-bar-right">
        <Button
          kind="primary"
          size="sm"
          renderIcon={Add}
          onClick={onAddOverride}
          disabled={!hasActiveSchedules}
        >
          Add Override
        </Button>
      </div>

      <EmptyState
        title="Override management"
        description="Use the 'Add Override' button to create temporary schedule overrides. Overrides are tied to existing schedules."
        icon={WarningAlt}
        action={
          hasActiveSchedules
            ? {
                label: 'Add Override',
                onClick: onAddOverride,
              }
            : undefined
        }
      />
    </div>
  );
});
