/**
 * useAlert Hook
 *
 * Fetches and manages alert detail data.
 * Uses AlertDataService which automatically switches between mock/API.
 *
 * Usage:
 *   const { alert, loading, error } = useAlert(alertId);
 */

import { useState, useEffect, useCallback } from 'react';
import { alertDataService } from '@/shared/services';
import type { DetailedAlert } from '@/features/alerts/types/alert.types';

interface UseAlertReturn {
    alert: DetailedAlert | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useAlert(alertId: string | undefined): UseAlertReturn {
    const [alert, setAlert] = useState<DetailedAlert | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAlert = useCallback(async () => {
        if (!alertId) {
            setAlert(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await alertDataService.getAlertById(alertId);
            if (data) {
                setAlert(data);
            } else {
                setError(`Alert ${alertId} not found`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch alert');
        } finally {
            setLoading(false);
        }
    }, [alertId]);

    useEffect(() => {
        fetchAlert();
    }, [fetchAlert]);

    return {
        alert,
        loading,
        error,
        refresh: fetchAlert,
    };
}
