import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tile, Button, Tag, SkeletonText, InlineNotification, ToastNotification } from '@carbon/react';
import { Time, Chip, Activity, IbmWatsonxCodeAssistant, WarningAlt, ArrowRight, ArrowLeft, Checkmark, Renew } from '@carbon/icons-react';
import { AlertActions } from './components/AlertActions';
import { RawTrapData } from './components/RawTrapData';
import '@/styles/pages/_alert-details.scss';

// Types and config from new structure
import { KPICard, PageHeader } from '@/components/ui';
import { SEVERITY_CONFIG } from '@/shared/constants';
import type { DetailedAlert } from '@/features/alerts/types';
import type { Severity } from '@/shared/types';
import { alertDataService } from '@/features/alerts/services';
import { ticketDataService } from '@/features/tickets/services';
import { normalizeAlert } from '@/shared/utils/normalizeAlert';


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
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isReanalyzing, setIsReanalyzing] = useState(false);

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
                    const normalized = normalizeAlert(data) as DetailedAlert;

                    setAlert(normalized);
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

    const handleReanalyze = async () => {
        if (!alert) return;
        setIsReanalyzing(true);
        try {
            const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${baseUrl}/api/v1/alerts/${alert.id}/reanalyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!resp.ok) throw new Error(`Re-analysis failed: ${resp.status}`);
            // Reload alert data to get fresh AI analysis
            const freshData = await alertDataService.getAlertById(alert.id);
            if (freshData) {
                const normalized = normalizeAlert(freshData) as DetailedAlert;
                setAlert(normalized);
            }
            addToast('success', 'AI Re-analysis Complete', 'Watson AI has re-analyzed this alert with fresh insights');
        } catch (err) {
            console.error('Failed to re-analyze alert:', err);
            addToast('error', 'Re-analysis Failed', 'Could not contact AI service. Please try again.');
        } finally {
            setIsReanalyzing(false);
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

            {/* Page Header with breadcrumbs, title, badges, and actions */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Priority Alerts', href: '/priority-alerts' },
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
                        color: alert.status === 'open' ? '#0f62fe' : alert.status === 'acknowledged' ? '#24a148' : '#a8a8a8',
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

            {/* Content wrapper with padding - matches ui-revamp-idea */}
            <div className="alert-details-page__content">
                {/* KPI Row */}
                <div className="alert-kpi-row">
                    <KPICard
                        id="severity"
                        icon={WarningAlt}
                        iconColor="#da1e28"
                        label="Severity Level"
                        value={severityConfig.label}
                        subtitle={`Priority ${severityConfig.priority}`}
                        severity="critical"
                    />
                    <KPICard
                        id="confidence"
                        icon={IbmWatsonxCodeAssistant}
                        iconColor="#8a3ffc"
                        label="AI Confidence"
                        value={`${alert.confidence}%`}
                        subtitle="Model v2.4"
                        severity="info"
                    />
                    <KPICard
                        id="time"
                        icon={Time}
                        iconColor="#0f62fe"
                        label="Time Elapsed"
                        value={typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp?.relative || 'N/A')}
                        subtitle={`Detected at ${typeof alert.timestamp === 'string' ? alert.timestamp : (alert.timestamp?.absolute?.split(' ')[1] || '')} UTC`}
                        severity="info"
                    />
                    <KPICard
                        id="similar"
                        icon={Activity}
                        iconColor="#ff832b"
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
                                    style={{ marginLeft: 'auto' }}
                                >
                                    {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
                                </Button>
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
                                    return Object.entries(deviceData).map(([label, value]) => {
                                        // Ensure value is always a string primitive
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
                            <div className="alert-card__historical-list">
                                {alert.history.map((item) => {
                                    const itemConfig = SEVERITY_CONFIG[item.severity as Severity] || SEVERITY_CONFIG.info;
                                    return (
                                        <div
                                            key={item.id}
                                            className="alert-card__historical-item"
                                            title={`Resolution: ${item.resolution}`}
                                            onClick={() => item.id && item.id.startsWith('ALT') && navigate(`/alerts/${item.id}`)}
                                            style={{ cursor: item.id?.startsWith('ALT') ? 'pointer' : 'default' }}
                                        >
                                            <div className="alert-card__historical-header">
                                                <span className="alert-card__historical-timestamp">{typeof item.timestamp === 'string' ? item.timestamp : (item.timestamp as any)?.relative || 'N/A'}</span>
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
                            <Button kind="ghost" size="sm" renderIcon={ArrowRight} className="alert-card__view-all" onClick={() => navigate(`/priority-alerts?device=${encodeURIComponent(String(alert.device?.name || ''))}`)}>
                                View All Historical Alerts
                            </Button>
                        </Tile>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AlertDetailsPage;
