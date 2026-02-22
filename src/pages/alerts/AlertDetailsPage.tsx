import {
    Tile,
    Button,
    Tag,
    SkeletonText,
    InlineNotification,
} from '@carbon/react';
import {
    Time,
    Chip,
    Activity,
    IbmWatsonxCodeAssistant,
    WarningAlt,
    ArrowRight,
    ArrowLeft,
    Checkmark,
    Renew,
} from '@carbon/icons-react';

import { AlertActions } from './components/AlertActions';
import { RawTrapData } from './components/RawTrapData';
import { LinkedTicketsSection, SuggestedRunbooksSection, RelatedAlertsSection, OnCallCard } from './components/AlertSections';
import { PostMortemSection } from './components/PostMortemModal';
import { useAlertDetails } from './components/useAlertDetails';

import { KPICard, PageHeader } from '@/components/ui';
import { PageLayout } from '@/components/layout';
import { SEVERITY_CONFIG } from '@/shared/constants';
import { ROUTES } from '@/shared/constants/routes';
import type { Severity } from '@/shared/types';

import '@/styles/pages/_alert-details.scss';

// ==========================================
// Main Page Component
// ==========================================

export function AlertDetailsPage() {
    const {
        alert,
        isLoading,
        error,
        isReanalyzing,
        similarAlerts,
        isLoadingSimilar,
        severityConfig,
        handleAcknowledge,
        handleCreateTicket,
        handleDismiss,
        handleReanalyze,
        navigateToAlerts,
        navigateToAlert,
        navigateToDeviceAlerts,
    } = useAlertDetails();

    if (isLoading) {
        return (
            <PageLayout>
                <div className="alert-details-page alert-details-page--loading">
                    <SkeletonText className="alert-details-page__skeleton" />
                </div>
            </PageLayout>
        );
    }

    if (error || !alert) {
        return (
            <PageLayout>
                <div className="alert-details-page">
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={error || 'Alert not found'}
                    />
                    <Button kind="ghost" onClick={navigateToAlerts} renderIcon={ArrowLeft}>
                        Back to Alerts
                    </Button>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="alert-details-page">
                {/* Page Header with breadcrumbs, title, badges, and actions */}
                <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', href: ROUTES.DASHBOARD },
                        { label: 'Priority Alerts', href: ROUTES.PRIORITY_ALERTS },
                        { label: `Alert #${alert.id}`, active: true },
                    ]}
                    showBreadcrumbs={true}
                    title={alert.aiTitle || `Alert ${alert.id}`}
                    subtitle={`${alert.device.name} • ${alert.device.ip}`}
                    badges={[
                        {
                            text: severityConfig.label,
                            color: severityConfig.color,
                            variant: 'filled' as const
                        },
                        {
                            text: alert.status.charAt(0).toUpperCase() + alert.status.slice(1),
                            color: alert.status === 'open' ? 'var(--cds-interactive, #0f62fe)' : alert.status === 'acknowledged' ? 'var(--cds-support-success, #24a148)' : 'var(--cds-text-placeholder, #a8a8a8)',
                            variant: 'outline' as const
                        },
                    ]}
                    showBorder={true}
                    rightContent={
                        <AlertActions
                            alertId={alert.id}
                            currentStatus={alert.status}
                            onAcknowledge={handleAcknowledge}
                            onCreateTicket={handleCreateTicket}
                            onDismiss={handleDismiss}
                        />
                    }
                />

                {/* Content wrapper */}
                <div className="alert-details-page__content">
                    {/* KPI Row */}
                    <div className="alert-kpi-row">
                        <KPICard
                            id="severity"
                            icon={WarningAlt}
                            iconColor="var(--cds-support-error, #da1e28)"
                            label="Severity Level"
                            value={severityConfig.label}
                            subtitle={`Priority ${severityConfig.priority}`}
                            severity="critical"
                        />
                        <KPICard
                            id="confidence"
                            icon={IbmWatsonxCodeAssistant}
                            iconColor="var(--cds-support-info, #8a3ffc)"
                            label="AI Confidence"
                            value={`${alert.confidence}%`}
                            subtitle="Model v2.4"
                            severity="info"
                        />
                        <KPICard
                            id="time"
                            icon={Time}
                            iconColor="var(--cds-interactive, #0f62fe)"
                            label="Time Elapsed"
                            value={typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp?.relative || 'N/A')}
                            subtitle={`Detected at ${typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp?.absolute?.split(' ')[1] || '')} UTC`}
                            severity="info"
                        />
                        <KPICard
                            id="similar"
                            icon={Activity}
                            iconColor="var(--cds-support-warning, #ff832b)"
                            label="Similar Events"
                            value={alert.similarEvents}
                            subtitle="Last 30 days"
                            severity="major"
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="alert-details-page__content-grid">
                        {/* Row 1: Raw Trap Data + AI Explanation */}
                        <div className="alert-details-page__row">
                            <RawTrapData
                                data={alert.rawData}
                                sourceIp={alert.extendedDevice?.ip || alert.device.ip}
                                timestamp={typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp?.absolute || 'N/A')}
                            />

                            <Tile className="alert-card">
                                <div className="alert-card__header">
                                    <div className="alert-card__icon">
                                        <IbmWatsonxCodeAssistant size={24} />
                                    </div>
                                    <h3 className="alert-card__title">AI-Generated Explanation</h3>
                                    <Button
                                        kind="ghost"
                                        size="sm"
                                        renderIcon={Renew}
                                        onClick={handleReanalyze}
                                        disabled={isReanalyzing}
                                        className="alert-card__reanalyze-btn"
                                    >
                                        {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
                                    </Button>
                                </div>

                                <div className="alert-card__section">
                                    <h4 className="alert-card__section-title">Summary</h4>
                                    <p className="alert-card__text">{alert.aiAnalysis?.summary || 'Analysis pending'}</p>
                                </div>

                                <div className="alert-card__section">
                                    <h4 className="alert-card__section-title">Root Cause Analysis</h4>
                                    <ul className="alert-card__list">
                                        {(alert.aiAnalysis?.rootCauses || []).map((cause: string, index: number) => (
                                            <li key={index} className="alert-card__list-item">
                                                <Checkmark size={16} className="alert-card__list-icon" />
                                                <span>{cause}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="alert-card__section">
                                    <h4 className="alert-card__section-title alert-card__section-title--impact">Business Impact</h4>
                                    <div className="alert-card__impact-box">
                                        <WarningAlt size={20} />
                                        <span className="alert-card__impact-text">{alert.aiAnalysis?.businessImpact || 'Impact assessment pending'}</span>
                                    </div>
                                </div>

                                <div className="alert-card__section">
                                    <h4 className="alert-card__section-title alert-card__section-title--actions">Recommended Actions</h4>
                                    <div className="alert-card__actions-list">
                                        {(alert.aiAnalysis?.recommendedActions || []).map((action: string, index: number) => (
                                            <div key={index} className="alert-card__action-item">
                                                <span className="alert-card__action-number">{index + 1}</span>
                                                <span>{action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Tile>
                        </div>

                        {/* Row 2: Device Info + Historical Alerts */}
                        <div className="alert-details-page__row">
                            <Tile className="alert-card">
                                <div className="alert-card__header">
                                    <Chip size={20} />
                                    <h3 className="alert-card__title">Device Information</h3>
                                </div>
                                <div className="alert-card__rows">
                                    {(() => {
                                        const deviceData = alert.extendedDevice ? {
                                            'Device Name': alert.extendedDevice.name,
                                            'IP Address': alert.extendedDevice.ip,
                                            'Location': alert.extendedDevice.location,
                                            'Vendor': alert.extendedDevice.vendor,
                                            'Model': alert.extendedDevice.model,
                                            'Interface': alert.extendedDevice.interface,
                                            'Interface Alias': alert.extendedDevice.interfaceAlias,
                                        } : {
                                            'Device Name': alert.device.name,
                                            'IP Address': alert.device.ip,
                                            'Model': alert.device.model || 'N/A',
                                            'Vendor': alert.device.vendor || 'N/A',
                                        };
                                        return Object.entries(deviceData).map(([label, value]) => {
                                            const displayValue = typeof value === 'string' ? value : (typeof value === 'number' ? String(value) : 'N/A');
                                            return (
                                                <div key={label} className="alert-card__row">
                                                    <span className="alert-card__label">{label}</span>
                                                    <span className={`alert-card__value ${label === 'Interface' ? 'alert-card__value--highlight' : ''}`}>{displayValue || 'N/A'}</span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </Tile>

                            <Tile className="alert-card">
                                <div className="alert-card__header">
                                    <Activity size={20} />
                                    <h3 className="alert-card__title">Similar Historical Alerts</h3>
                                </div>
                                {isLoadingSimilar ? (
                                    <div className="alert-card__loading">
                                        <SkeletonText />
                                    </div>
                                ) : similarAlerts.length > 0 ? (
                                    <>
                                        <div className="alert-card__historical-list">
                                            {similarAlerts.map((item) => {
                                                const itemConfig = SEVERITY_CONFIG[item.severity as Severity] || SEVERITY_CONFIG.info;
                                                const tsValue = typeof item.timestamp === 'string'
                                                    ? item.timestamp
                                                    : item.timestamp?.absolute;
                                                const displayTimestamp = tsValue
                                                    ? new Date(tsValue).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : 'N/A';
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="alert-card__historical-item alert-card__historical-item--navigable"
                                                        title={`Similarity: ${(item.similarityScore * 100).toFixed(1)}% | Status: ${item.status}`}
                                                        onClick={() => navigateToAlert(item.id)}
                                                    >
                                                        <div className="alert-card__historical-header">
                                                            <span className="alert-card__historical-timestamp">{displayTimestamp}</span>
                                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                <span className="alert-card__similarity-score" title="AI-powered similarity score">
                                                                    {(item.similarityScore * 100).toFixed(0)}% match
                                                                </span>
                                                                <Tag type={itemConfig.tagType} size="sm">
                                                                    {itemConfig.label}
                                                                </Tag>
                                                            </div>
                                                        </div>
                                                        <h4 className="alert-card__historical-title">{item.aiTitle}</h4>
                                                        <p className="alert-card__historical-resolution">
                                                            {item.aiAnalysis?.rootCauses?.[0]
                                                                ? `Root Cause: ${item.aiAnalysis.rootCauses[0]}`
                                                                : item.aiSummary.substring(0, 80) + '...'}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Button kind="ghost" size="sm" renderIcon={ArrowRight} className="alert-card__view-all" onClick={() => navigateToDeviceAlerts(String(alert.device?.name || ''))}>
                                            View All Historical Alerts
                                        </Button>
                                    </>
                                ) : (
                                    <div className="alert-card__empty">
                                        <p>No similar historical alerts found</p>
                                        <p className="alert-card__empty-hint">
                                            AI analysis will help find similar incidents once this alert is resolved
                                        </p>
                                    </div>
                                )}
                            </Tile>
                        </div>

                        {/* Row 3: Enrichment Section - Linked Tickets + Suggested Runbooks + On-Call */}
                        <div className="alert-details-page__enrichment-row">
                            <LinkedTicketsSection alertId={alert.id} />
                            <SuggestedRunbooksSection
                                category={alert.category || 'general'}
                                severity={alert.severity}
                                alertTitle={alert.aiTitle}
                            />
                            <OnCallCard />
                        </div>

                        {/* Row 4: Related Alerts + Post-Mortem */}
                        <div className="alert-details-page__row">
                            <RelatedAlertsSection
                                deviceName={alert.device.name}
                                currentAlertId={alert.id}
                            />
                            <PostMortemSection alert={alert} />
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

export default AlertDetailsPage;
