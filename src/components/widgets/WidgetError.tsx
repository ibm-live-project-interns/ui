/**
 * Copyright IBM Corp. 2026
 *
 * WidgetError - Error fallback for dashboard widgets.
 * Displays an error message with a retry action using Carbon design tokens.
 */

import { memo } from 'react';
import { Tile, Button } from '@carbon/react';
import { WarningAlt, Renew } from '@carbon/icons-react';

interface WidgetErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const WidgetError = memo(function WidgetError({ message, onRetry, className }: WidgetErrorProps) {
  return (
    <Tile className={`widget widget--error ${className || ''}`}>
      <WarningAlt size={24} className="widget-error__icon" />
      <span className="widget-error__message">
        {message}
      </span>
      {onRetry && (
        <Button kind="ghost" size="sm" renderIcon={Renew} onClick={onRetry}>
          Retry
        </Button>
      )}
    </Tile>
  );
});
