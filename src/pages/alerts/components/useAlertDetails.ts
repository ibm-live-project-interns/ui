/**
 * Copyright IBM Corp. 2026
 *
 * useAlertDetails - Custom hook encapsulating all state, data fetching,
 * action handlers, and derived data for the Alert Details page.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { DetailedAlert, PriorityAlert } from '@/features/alerts/types';
import { alertDataService } from '@/features/alerts/services';
import { ticketDataService } from '@/features/tickets/services';
import { findSimilarAlerts } from '@/shared/utils/alertSimilarity';
import { SEVERITY_CONFIG } from '@/shared/constants';
import { ROUTES } from '@/shared/constants/routes';
import { useToast } from '@/contexts';
import { logger } from '@/shared/utils/logger';

// ==========================================
// Return type
// ==========================================

export interface UseAlertDetailsReturn {
    // Data
    alert: DetailedAlert | null;
    isLoading: boolean;
    error: string | null;
    isReanalyzing: boolean;
    similarAlerts: Array<PriorityAlert & { similarityScore: number }>;
    isLoadingSimilar: boolean;

    // Derived
    severityConfig: typeof SEVERITY_CONFIG[keyof typeof SEVERITY_CONFIG];

    // Actions
    handleAcknowledge: (id: string) => Promise<void>;
    handleCreateTicket: (id: string, ticketData: { title: string; description: string; priority: string }) => Promise<void>;
    handleDismiss: (id: string) => Promise<void>;
    handleReanalyze: () => Promise<void>;
    navigateToAlerts: () => void;
    navigateToDashboard: () => void;
    navigateToAlert: (alertId: string) => void;
    navigateToDeviceAlerts: (deviceName: string) => void;
}

// ==========================================
// Hook
// ==========================================

export function useAlertDetails(): UseAlertDetailsReturn {
    const { alertId } = useParams<{ alertId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState<DetailedAlert | null>(null);
    const [similarAlerts, setSimilarAlerts] = useState<Array<PriorityAlert & { similarityScore: number }>>([]);
    const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const { addToast } = useToast();

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
                logger.error('Failed to load alert', err);
                setError('Failed to load alert details');
                addToast('error', 'Load Failed', 'Could not load alert details');
            } finally {
                setIsLoading(false);
            }
        };

        loadAlert();
    }, [alertId, addToast]);

    // Load similar alerts when alert changes or AI analysis is updated
    useEffect(() => {
        const loadSimilarAlerts = async () => {
            if (!alert) return;

            setIsLoadingSimilar(true);
            try {
                // Fetch all alerts (we'll filter for resolved ones in the similarity algorithm)
                const allAlerts = await alertDataService.getAlerts();

                // Calculate similarity and find top matches
                const similar = findSimilarAlerts(alert, allAlerts, {
                    minSimilarityScore: 0.25,
                    maxResults: 5,
                    excludeCurrentAlert: true,
                });

                setSimilarAlerts(similar);

                // Log for debugging
                if (similar.length > 0) {
                    logger.info(`Found ${similar.length} similar alerts with scores:`,
                        similar.map(a => ({ id: a.id, score: a.similarityScore.toFixed(3) }))
                    );
                }
            } catch (err) {
                logger.error('Failed to load similar alerts', err);
                // Don't show toast for this - it's not critical
                setSimilarAlerts([]);
            } finally {
                setIsLoadingSimilar(false);
            }
        };

        loadSimilarAlerts();
    }, [alert?.id, alert?.aiAnalysis]); // Re-fetch when alert or AI analysis changes

    const handleAcknowledge = useCallback(async (id: string) => {
        try {
            await alertDataService.acknowledgeAlert(id);
            if (alert && alert.id === id) {
                setAlert({ ...alert, status: 'acknowledged' });
            }
            addToast('success', 'Acknowledged', `Alert ${id} has been acknowledged successfully`);
        } catch (err) {
            logger.error('Failed to acknowledge alert', err);
            addToast('error', 'Action Failed', 'Could not acknowledge alert');
        }
    }, [alert, addToast]);

    const handleCreateTicket = useCallback(async (id: string, ticketData: { title: string; description: string; priority: string }) => {
        try {
            const newTicket = await ticketDataService.createTicket({
                alertId: id,
                title: ticketData.title,
                description: ticketData.description,
                priority: ticketData.priority as 'critical' | 'high' | 'medium' | 'low',
                category: alert?.category || 'general',
                deviceName: alert?.device.name,
            });
            addToast('success', 'Ticket Created', `Ticket ${newTicket.ticketNumber} created for alert ${id}`);
        } catch (err) {
            logger.error('Failed to create ticket', err);
            addToast('error', 'Ticket Failed', 'Could not create support ticket');
        }
    }, [alert, addToast]);

    const handleDismiss = useCallback(async (id: string) => {
        try {
            await alertDataService.dismissAlert(id);
            addToast('success', 'Dismissed', `Alert ${id} has been dismissed`);
            setTimeout(() => navigate(ROUTES.PRIORITY_ALERTS), 1500);
        } catch (err) {
            logger.error('Failed to dismiss alert', err);
            addToast('error', 'Action Failed', 'Could not dismiss alert');
        }
    }, [addToast, navigate]);

    const handleReanalyze = useCallback(async () => {
        if (!alert) return;
        setIsReanalyzing(true);
        try {
            await alertDataService.reanalyzeAlert(alert.id);
            // Reload alert data to get fresh AI analysis
            const freshData = await alertDataService.getAlertById(alert.id);
            if (freshData) {
                setAlert(freshData);
            }
            addToast('success', 'AI Re-analysis Complete', 'Watson AI has re-analyzed this alert with fresh insights');
        } catch (err) {
            logger.error('Failed to re-analyze alert', err);
            addToast('error', 'Re-analysis Failed', 'Could not contact AI service. Please try again.');
        } finally {
            setIsReanalyzing(false);
        }
    }, [alert, addToast]);

    // Navigation helpers
    const navigateToAlerts = useCallback(() => navigate(ROUTES.PRIORITY_ALERTS), [navigate]);
    const navigateToDashboard = useCallback(() => navigate(ROUTES.DASHBOARD), [navigate]);
    const navigateToAlert = useCallback((alertId: string) => navigate(`/alerts/${alertId}`), [navigate]);
    const navigateToDeviceAlerts = useCallback((deviceName: string) =>
        navigate(`${ROUTES.PRIORITY_ALERTS}?device=${encodeURIComponent(deviceName)}`),
    [navigate]);

    // Severity config derivation
    const severityConfig = alert
        ? (SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info)
        : SEVERITY_CONFIG.info;

    return {
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
        navigateToDashboard,
        navigateToAlert,
        navigateToDeviceAlerts,
    };
}
