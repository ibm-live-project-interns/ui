import { useEffect, useCallback } from 'react';
import { useAlertState } from '../state/useAlertState';
import { alertService } from '../../services/AlertService';
import type { AlertFilters, AlertStatus } from '../../models/Alert';

/**
 * useAlerts - Hook that combines alert state with service calls
 * Provides high-level API for alert operations
 */
export function useAlerts(autoFetch: boolean = true) {
  const {
    alerts,
    selectedAlert,
    filters,
    loading,
    error,
    setAlerts,
    updateAlert,
    selectAlert,
    setFilters,
    setLoading,
    setError,
  } = useAlertState();

  /**
   * Fetch alerts from service
   */
  const fetchAlerts = useCallback(async (customFilters?: AlertFilters) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAlerts = await alertService.fetchAlerts(customFilters || filters);
      setAlerts(fetchedAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    }
  }, [filters, setAlerts, setLoading, setError]);

  /**
   * Update alert status
   */
  const updateAlertStatus = useCallback(async (id: string, status: AlertStatus) => {
    try {
      const updated = await alertService.updateAlertStatus(id, status);
      if (updated) {
        updateAlert(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
    }
  }, [updateAlert, setError]);

  /**
   * Apply filters and refetch
   */
  const applyFilters = useCallback(async (newFilters: AlertFilters) => {
    setFilters(newFilters);
    await fetchAlerts(newFilters);
  }, [setFilters, fetchAlerts]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchAlerts();
    }
  }, [autoFetch, fetchAlerts]);

  return {
    // State
    alerts,
    selectedAlert,
    filters,
    loading,
    error,
    // Actions
    fetchAlerts,
    updateAlertStatus,
    selectAlert,
    applyFilters,
  };
}
