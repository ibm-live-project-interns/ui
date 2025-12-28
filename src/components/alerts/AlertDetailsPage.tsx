import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tile, Button, Tag, Breadcrumb, BreadcrumbItem, ProgressBar, SkeletonText } from '@carbon/react';
import { ArrowLeft, Time, Chip, Activity, IbmWatsonxCodeAssistant, Copy, Checkmark, WarningAlt, Information, ArrowRight } from '@carbon/icons-react';
import { AlertActions } from './AlertActions';
import '@/styles/AlertDetailsPage.scss';

// Types and config from consolidated constants
import { SEVERITY_CONFIG, type DetailedAlert, type Severity } from '@/constants';

// Mock data
import { MOCK_ALERT_DETAIL } from '@/__mocks__/alerts.mock';

interface KPICardProps {
    icon: React.ComponentType<{ size: number }>;
    iconClass: string;
    label: string;
    value: string | number;
    subtitle?: string;
    showProgress?: boolean;
    severity?: boolean;
}

const KPICard = ({ icon: Icon, iconClass, label, value, subtitle, showProgress, severity }: KPICardProps) => (
    <Tile className={`alert-kpi-tile ${severity ? 'alert-kpi-tile--severity' : ''}`}>
        <div className={`alert-kpi-icon ${iconClass}`}>
            <Icon size={24} />
        </div>
        <div className="alert-kpi-content">
            <div className="alert-kpi-label">{label}</div>
            <div className="alert-kpi-value">{value}</div>
            {showProgress ? (
                <ProgressBar
                    label={`${value}`}
                    className="alert-kpi-progress"
                    value={typeof value === 'number' ? value : parseInt(String(value))}
                    max={100}
                    hideLabel
                />
            ) : (
                <div className="alert-kpi-subtitle">{subtitle}</div>
            )}
        </div>
    </Tile>
);

export function AlertDetailsPage() {
    const { alertId } = useParams<{ alertId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState<DetailedAlert>(MOCK_ALERT_DETAIL);
    const [copiedTrap, setCopiedTrap] = useState(false);

    useEffect(() => {
        const loadAlert = async () => {
            setIsLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Failed to load alert:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAlert();
    }, [alertId]);

    const handleCopyTrap = async () => {
        try {
            await navigator.clipboard.writeText(alert.rawData);
            setCopiedTrap(true);
            setTimeout(() => setCopiedTrap(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleAcknowledge = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAlert({ ...alert, status: 'acknowledged' });
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const handleCreateTicket = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Failed to create ticket:', error);
        }
    };

    const handleDismiss = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAlert({ ...alert, status: 'dismissed' });
            navigate('/priority-alerts');
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="alert-details-page alert-details-page--loading">
                <SkeletonText className="alert-details-page__skeleton" />
            </div>
        );
    }

    // Get severity config
    const severityConfig = SEVERITY_CONFIG[alert.severity];

    return (
        <div className="alert-details-page">
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
                        <p className="alert-details-page__subtitle">{alert.device.name} • Interface Down Event</p>
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
                <KPICard icon={WarningAlt} iconClass="alert-kpi-icon--red" label="Severity Level" value={severityConfig.label} subtitle="Priority 1" severity />
                <KPICard icon={IbmWatsonxCodeAssistant} iconClass="alert-kpi-icon--purple" label="AI Confidence" value={`${alert.confidence}%`} showProgress />
                <KPICard icon={Time} iconClass="alert-kpi-icon--blue" label="Time Elapsed" value={alert.timestamp.relative || ''} subtitle={`Detected at ${alert.timestamp.absolute}`} />
                <KPICard icon={Activity} iconClass="alert-kpi-icon--orange" label="Similar Events" value={alert.similarEvents} subtitle="Last 30 days" />
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
                            <div className="alert-card__meta"><Information size={16} />Source: {alert.extendedDevice.ip}</div>
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
                                <span>{alert.aiAnalysis.businessImpact}</span>
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
                            {Object.entries({
                                'Device Name': alert.extendedDevice.name,
                                'IP Address': alert.extendedDevice.ip,
                                'Location': alert.extendedDevice.location,
                                'Vendor': alert.extendedDevice.vendor,
                                'Model': alert.extendedDevice.model,
                                'Interface': alert.extendedDevice.interface,
                                'Interface Alias': alert.extendedDevice.interfaceAlias,
                            }).map(([label, value]) => (
                                <div key={label} className="alert-card__row">
                                    <span className="alert-card__label">{label}</span>
                                    <span className={`alert-card__value ${label === 'Interface' ? 'alert-card__value--highlight' : ''}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </Tile>

                    <Tile className="alert-card">
                        <div className="alert-card__header">
                            <Activity size={20} />
                            <h3 className="alert-card__title">Similar Historical Alerts</h3>
                        </div>
                        <div className="alert-card__historical-list">
                            {alert.history.map((item) => {
                                const itemConfig = SEVERITY_CONFIG[item.severity as Severity];
                                return (
                                    <button key={item.id} className="alert-card__historical-item" onClick={() => navigate(`/alerts/${item.id}`)}>
                                        <div className="alert-card__historical-header">
                                            <span className="alert-card__historical-timestamp">{item.timestamp}</span>
                                            <Tag type={itemConfig.tagType} size="sm">
                                                {itemConfig.label}
                                            </Tag>
                                        </div>
                                        <h4 className="alert-card__historical-title">{item.title}</h4>
                                        <p className="alert-card__historical-resolution">{item.resolution}</p>
                                    </button>
                                );
                            })}
                        </div>
                        <Button kind="ghost" size="sm" renderIcon={ArrowRight} className="alert-card__view-all" onClick={() => navigate(`/alerts/historical?device=${alert.extendedDevice.name}`)}>
                            View All Historical Alerts
                        </Button>
                    </Tile>
                </div>
            </div>
        </div>
    );
}

export default AlertDetailsPage;
