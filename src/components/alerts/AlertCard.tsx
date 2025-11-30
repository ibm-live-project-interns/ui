import { ClickableTile, Tag } from '@carbon/react';
import { Warning, WarningAlt, Information, CheckmarkFilled } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import type { FormattedAlert, AlertSeverity } from '../../models';

interface AlertCardProps {
  alert: FormattedAlert;
  compact?: boolean;
}

function getSeverityIcon(severity: AlertSeverity) {
  const iconProps = { size: 20 };

  switch (severity) {
    case 'critical':
      return <Warning {...iconProps} className="alert-card__icon--critical" />;
    case 'high':
      return <WarningAlt {...iconProps} className="alert-card__icon--high" />;
    case 'medium':
      return <WarningAlt {...iconProps} className="alert-card__icon--medium" />;
    case 'low':
      return <CheckmarkFilled {...iconProps} className="alert-card__icon--low" />;
    case 'info':
    default:
      return <Information {...iconProps} className="alert-card__icon--info" />;
  }
}

export function AlertCard({ alert, compact = false }: AlertCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/alerts/${alert.id}`);
  };

  if (compact) {
    return (
      <ClickableTile className="alert-card alert-card--compact" onClick={handleClick}>
        <div className="alert-card__header">
          {getSeverityIcon(alert.severity)}
          <span className="alert-card__device">{alert.device.hostname}</span>
          <Tag type={alert.severityKind} size="sm">
            {alert.severityLabel}
          </Tag>
        </div>
        <p className="alert-card__snippet">{alert.explanationSnippet}</p>
        <span className="alert-card__time">{alert.relativeTime}</span>
      </ClickableTile>
    );
  }

  return (
    <ClickableTile className="alert-card" onClick={handleClick}>
      <div className="alert-card__header">
        <div className="alert-card__title-row">
          {getSeverityIcon(alert.severity)}
          <span className="alert-card__device">{alert.device.hostname}</span>
        </div>
        <div className="alert-card__tags">
          <Tag type={alert.severityKind} size="sm">
            {alert.severityLabel}
          </Tag>
          <Tag type={alert.status === 'active' ? 'red' : 'gray'} size="sm">
            {alert.statusLabel}
          </Tag>
        </div>
      </div>

      <p className="alert-card__explanation">{alert.explanationSnippet}</p>

      <div className="alert-card__footer">
        <div className="alert-card__meta">
          <span className="alert-card__source">{alert.sourceTypeLabel}</span>
          <span className="alert-card__separator">•</span>
          <span className="alert-card__ip">{alert.device.ipAddress}</span>
        </div>
        <span className="alert-card__time">{alert.relativeTime}</span>
      </div>
    </ClickableTile>
  );
}
