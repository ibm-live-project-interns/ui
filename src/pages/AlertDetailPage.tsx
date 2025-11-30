import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Grid,
  Column,
  Tag,
  Button,
  InlineLoading,
  InlineNotification,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
} from '@carbon/react';
import { CheckmarkFilled, Close, Network_2, Time, Location } from '@carbon/icons-react';
import { alertService } from '../services';
import { AlertViewModel } from '../presentation/viewmodels/AlertViewModel';
import { getSeverityKind } from '../constants/severity';
import {
  ExplanationPanel,
  RecommendedActionsList,
  AlertSourceInfo,
  KnowledgeInsights,
  CreateIncidentButton,
  AlertDetailSkeleton,
} from '../components/alerts';
import type { Alert, RecommendedAction } from '../models';

/** Alert detail: AI explanation + recommended actions @see docs/arch/UI/README.md */
export function AlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>();

  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchAlert = useCallback(async () => {
    if (!alertId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await alertService.fetchAlertById(alertId);

      if (!data) {
        setError('Alert not found');
        return;
      }

      setAlert(data);
    } catch {
      setError('Failed to load alert details');
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  const handleStatusUpdate = async (status: 'acknowledged' | 'resolved' | 'dismissed') => {
    if (!alert) return;

    try {
      setUpdatingStatus(true);
      const updated = await alertService.updateAlertStatus(alert.id, status);
      if (updated) {
        setAlert(updated);
      }
    } catch {
      setError('Failed to update alert status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExecuteAction = (action: RecommendedAction) => {
    console.log('Execute action:', action);
  };

  if (loading) {
    return <AlertDetailSkeleton />;
  }

  if (error || !alert) {
    return (
      <Grid className="alert-detail-page">
        <Column lg={16} md={8} sm={4}>
          <Breadcrumb noTrailingSlash className="alert-detail-page__breadcrumb">
            <BreadcrumbItem>
              <Link to="/">Home</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to="/alerts">Alerts</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>Error</BreadcrumbItem>
          </Breadcrumb>
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error || 'Alert not found'}
            hideCloseButton
          />
        </Column>
      </Grid>
    );
  }

  const vm = new AlertViewModel(alert);

  return (
    <div className="alert-detail-page">
      {/* IBM-style Breadcrumb Navigation */}
      <Breadcrumb noTrailingSlash className="alert-detail-page__breadcrumb">
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link to="/alerts">Alerts</Link>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          {alert.device.hostname}
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Compact Header Bar */}
      <header className="alert-detail-page__topbar">
        <div className="alert-detail-page__topbar-info">
          <h1 className="alert-detail-page__hostname">{alert.device.hostname}</h1>
          <div className="alert-detail-page__tags">
            <Tag type={getSeverityKind(alert.severity)} size="sm">
              {vm.severityLabel}
            </Tag>
            <Tag type={alert.status === 'active' ? 'red' : 'gray'} size="sm">
              {vm.statusLabel}
            </Tag>
          </div>
        </div>

        <div className="alert-detail-page__topbar-actions">
          {alert.status === 'active' && (
            <Button
              kind="secondary"
              size="sm"
              onClick={() => handleStatusUpdate('acknowledged')}
              disabled={updatingStatus}
            >
              Acknowledge
            </Button>
          )}
          {alert.status !== 'resolved' && (
            <Button
              kind="primary"
              size="sm"
              renderIcon={CheckmarkFilled}
              onClick={() => handleStatusUpdate('resolved')}
              disabled={updatingStatus}
            >
              Resolve
            </Button>
          )}
          {alert.status !== 'dismissed' && alert.status !== 'resolved' && (
            <IconButton
              kind="ghost"
              size="sm"
              label="Dismiss"
              onClick={() => handleStatusUpdate('dismissed')}
              disabled={updatingStatus}
            >
              <Close size={16} />
            </IconButton>
          )}
          <CreateIncidentButton alert={alert} />
          {updatingStatus && <InlineLoading description="" />}
        </div>
      </header>

      {/* Device Meta Info */}
      <div className="alert-detail-page__meta-bar">
        <span className="alert-detail-page__meta-item">
          <Network_2 size={16} />
          {vm.sourceTypeLabel}
        </span>
        <span className="alert-detail-page__meta-item">
          {alert.device.ipAddress}
        </span>
        {alert.device.deviceType && (
          <span className="alert-detail-page__meta-item">
            {alert.device.deviceType}
          </span>
        )}
        {alert.device.location && (
          <span className="alert-detail-page__meta-item">
            <Location size={16} />
            {alert.device.location}
          </span>
        )}
        <span className="alert-detail-page__meta-item">
          <Time size={16} />
          {vm.relativeTime}
        </span>
      </div>

      {/* Content Grid - Single column layout that stacks properly */}
      <Grid className="alert-detail-page__content" narrow>
        {/* AI Explanation Panel - Full width */}
        <Column lg={16} md={8} sm={4}>
          <ExplanationPanel explanation={alert.explanation} />
        </Column>

        {/* Knowledge Insights from RAG - Full width */}
        <Column lg={16} md={8} sm={4}>
          <KnowledgeInsights entries={alert.knowledgeEntries} />
        </Column>

        {/* Recommended Actions - Full width */}
        <Column lg={16} md={8} sm={4}>
          <RecommendedActionsList
            actions={alert.recommendedActions}
            onExecuteAction={handleExecuteAction}
          />
        </Column>

        {/* Device Info and Raw Log Data - Side by side on large, stacked on small */}
        <Column lg={8} md={4} sm={4}>
          <AlertSourceInfo alert={alert} showDeviceOnly />
        </Column>

        <Column lg={8} md={4} sm={4}>
          <AlertSourceInfo alert={alert} showRawLogOnly />
        </Column>
      </Grid>
    </div>
  );
}
