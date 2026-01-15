import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tile, Button, Tag, Breadcrumb, BreadcrumbItem, SkeletonText, InlineNotification, ToastNotification } from '@carbon/react';
import { ArrowLeft, Time, Chip, Activity, IbmWatsonxCodeAssistant, Copy, Checkmark, WarningAlt, Information, ArrowRight } from '@carbon/icons-react';
import { AlertActions } from './AlertActions';
import '@/styles/AlertDetailsPage.scss';

// Types and config from consolidated constants
import { KPICard } from '@/components';
import { SEVERITY_CONFIG, type DetailedAlert, type Severity } from '@/constants';
import { alertDataService, ticketDataService } from '@/services';

// Toast message type
interface ToastMessage {
    id: string;
    kind: 'success' | 'error' | 'info' | 'warning';
    title: string;
    subtitle: string;
}

export function AlertDetailsPage() {
    const { alertId } = useParams<{ alertId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState<DetailedAlert | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedTrap, setCopiedTrap] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Helper to add a toast
    const addToast = (kind: ToastMessage['kind'], title: string, subtitle: string) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, kind, title, subtitle }]);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    useEffect(() => {
        const loadAlert = async () => {
            if (!alertId) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await alertDataService.getAlertById(alertId);
                if (data) {
                    setAlert(data);
                } else {
                    setError('Alert not found');
                }
            } catch (err) {
                console.error('Failed to load alert:', err);
                setError('Failed to load alert details');
            } finally {
                setIsLoading(false);
            }
        };
        loadAlert();
    }, [alertId]);

    const handleCopyTrap = async () => {
        if (!alert) return;
        try {
            await navigator.clipboard.writeText(alert.rawData);
            setCopiedTrap(true);
            addToast('success', 'Copied', 'Raw data copied to clipboard');
            setTimeout(() => setCopiedTrap(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            addToast('error', 'Copy Failed', 'Could not copy to clipboard');
        }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            await alertDataService.acknowledgeAlert(id);
            if (alert && alert.id === id) {
                setAlert({ ...alert, status: 'acknowledged' });
            }
            addToast('success', 'Acknowledged', `Alert ${id} has been acknowledged successfully`);
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            addToast('error', 'Action Failed', 'Could not acknowledge alert');
        }
    };

    const handleCreateTicket = async (id: string, ticketData: { title: string; description: string; priority: string }) => {
        try {
            // Use ticketDataService to persist the ticket
            const newTicket = await ticketDataService.createTicket({
                alertId: id,
                title: ticketData.title,
                description: ticketData.description,
                priority: ticketData.priority as 'critical' | 'high' | 'medium' | 'low',
                deviceName: alert?.device.name,
            });
            addToast('success', 'Ticket Created', `Ticket ${newTicket.ticketNumber} created for alert ${id}`);
        } catch (error) {
            console.error('Failed to create ticket:', error);
            addToast('error', 'Ticket Failed', 'Could not create support ticket');
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            await alertDataService.dismissAlert(id);
            addToast('success', 'Dismissed', `Alert ${id} has been dismissed`);
            // Navigate after a short delay so user sees the toast
            setTimeout(() => navigate('/priority-alerts'), 1500);
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
            addToast('error', 'Action Failed', 'Could not dismiss alert');
        }
    };

    if (isLoading) {
        return (
            <div className="alert-details-page alert-details-page--loading">
                <SkeletonText className="alert-details-page__skeleton" />
            </div>
        );
    }

    if (error || !alert) {
        return (
            <div className="alert-details-page">
                <InlineNotification
                    kind="error"
                    title="Error"
                    subtitle={error || 'Alert not found'}
                />
                <Button kind="ghost" onClick={() => navigate('/priority-alerts')} renderIcon={ArrowLeft}>
                    Back to Alerts
                </Button>
            </div>
        );
    }

    // Get severity config
    const severityConfig = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;

    return (
        <div className="alert-details-page">
            {/* Toast Notifications Container */}
            <div className="alert-details-page__toast-container">
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        kind={toast.kind}
                        title={toast.title}
                        subtitle={toast.subtitle}
                        timeout={5000}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

            {/* Breadcrumb */}
            <Breadcrumb noTrailingSlash className="alert-details-page__breadcrumb">
                <BreadcrumbItem>
                    <Link to="/priority-alerts">Priority Alerts</Link>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>Alert Details</BreadcrumbItem>
            </Breadcrumb>

            {/* Header */}
            <div className="alert-details-page__header">
                <div className="alert-details-page__header-left">
                    <Button kind="ghost" size="sm" renderIcon={ArrowLeft} iconDescription="Back" hasIconOnly onClick={() => navigate('/priority-alerts')} />
                    <div className="alert-details-page__header-content">
                        <h1 className="alert-details-page__title">Alert Details</h1>
                        <p className="alert-details-page__subtitle">{alert.device.name} • {alert.aiTitle}</p>
                    </div>
                </div>
                <div className="alert-details-page__header-right">
                    <AlertActions
                        alertId={alert.id}
                        currentStatus={alert.status}
                        onAcknowledge={handleAcknowledge}
                        onCreateTicket={handleCreateTicket}
                        onDismiss={handleDismiss}
                    />
                </div>
            </div>

            {/* KPI Row */}
            <div className="alert-kpi-row">
                <KPICard
                    id="severity"
                    IconComponent={WarningAlt}
                    color="red"
                    label="Severity Level"
                    value={severityConfig.label}
                    footnote={`Priority ${severityConfig.priority}`}
                />
                <KPICard
                    id="confidence"
                    IconComponent={IbmWatsonxCodeAssistant}
                    color="purple"
                    label="AI Confidence"
                    value={`${alert.confidence}%`}
                    footnote="Model v2.4"
                />
                <KPICard
                    id="time"
                    IconComponent={Time}
                    color="blue"
                    label="Time Elapsed"
                    value={alert.timestamp.relative || ''}
                    subtitle={`Detected at ${alert.timestamp.absolute.split(' ')[1] || ''} UTC`}
                    footnote="Resolution SLA: 1h"
                />
                <KPICard
                    id="similar"
                    IconComponent={Activity}
                    color="orange"
                    label="Similar Events"
                    value={alert.similarEvents}
                    subtitle="Last 30 days"
                    footnote="In same subnet"
                />
            </div>

            {/* Main Content */}
            <div className="alert-details-page__content-grid">
                {/* Row 1: Raw Trap Data + AI Explanation */}
                <div className="alert-details-page__row">
                    <Tile className="alert-card">
                        <div className="alert-card__header">
                            <h3 className="alert-card__title">Raw SNMP Trap Data</h3>
                            <Button kind="ghost" size="sm" renderIcon={copiedTrap ? Checkmark : Copy} iconDescription={copiedTrap ? 'Copied' : 'Copy'} hasIconOnly onClick={handleCopyTrap} />
                        </div>
                        <pre className="alert-card__code"><code>{alert.rawData}</code></pre>
                        <div className="alert-card__footer">
                            <div className="alert-card__meta"><Information size={16} />Source: {alert.extendedDevice?.ip || alert.device.ip}</div>
                            <div className="alert-card__meta"><Time size={16} />{alert.timestamp.absolute}</div>
                        </div>
                    </Tile>

                    <Tile className="alert-card">
                        <div className="alert-card__header">
                            <div className="alert-card__icon">
                                <IbmWatsonxCodeAssistant size={24} />
                            </div>
                            <h3 className="alert-card__title">AI-Generated Explanation</h3>
                        </div>

                        <div className="alert-card__section">
                            <h4 className="alert-card__section-title">Summary</h4>
                            <p className="alert-card__text">{alert.aiAnalysis.summary}</p>
                        </div>

                        <div className="alert-card__section">
                            <h4 className="alert-card__section-title">Root Cause Analysis</h4>
                            <ul className="alert-card__list">
                                {alert.aiAnalysis.rootCauses.map((cause: string, index: number) => (
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
                                <span style={{ marginLeft: '0.5rem' }}>{alert.aiAnalysis.businessImpact}</span>
                            </div>
                        </div>

                        <div className="alert-card__section">
                            <h4 className="alert-card__section-title alert-card__section-title--actions">Recommended Actions</h4>
                            <div className="alert-card__actions-list">
                                {alert.aiAnalysis.recommendedActions.map((action: string, index: number) => (
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
                                // Use extendedDevice if available, otherwise fall back to basic device info
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
                                return Object.entries(deviceData).map(([label, value]) => (
                                    <div key={label} className="alert-card__row">
                                        <span className="alert-card__label">{label}</span>
                                        <span className={`alert-card__value ${label === 'Interface' ? 'alert-card__value--highlight' : ''}`}>{value || 'N/A'}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </Tile>

                    <Tile className="alert-card">
                        <div className="alert-card__header">
                            <Activity size={20} />
                            <h3 className="alert-card__title">Similar Historical Alerts</h3>
                        </div>
                        <div className="alert-card__historical-list">
                            {alert.history.map((item) => {
                                const itemConfig = SEVERITY_CONFIG[item.severity as Severity] || SEVERITY_CONFIG.info;
                                return (
                                    <div key={item.id} className="alert-card__historical-item" title={`Resolution: ${item.resolution}`}>
                                        <div className="alert-card__historical-header">
                                            <span className="alert-card__historical-timestamp">{item.timestamp}</span>
                                            <Tag type={itemConfig.tagType} size="sm">
                                                {itemConfig.label}
                                            </Tag>
                                        </div>
                                        <h4 className="alert-card__historical-title">{item.title}</h4>
                                        <p className="alert-card__historical-resolution">{item.resolution}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <Button kind="ghost" size="sm" renderIcon={ArrowRight} className="alert-card__view-all" onClick={() => navigate(`/priority-alerts?device=${encodeURIComponent(alert.device.name)}`)}>
                            View All Historical Alerts
                        </Button>
                    </Tile>
                </div>
            </div>
        </div>
    );
}

export default AlertDetailsPage;
