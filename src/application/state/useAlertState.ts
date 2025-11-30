import { useCallback } from 'react';
import { useAlertContext } from './AlertContext';
import type { Alert, AlertFilters } from '../../models/Alert';

/**
 * useAlertState - Custom hook for alert state management
 * Provides convenient methods for updating alert state
 */
export function useAlertState() {
  const { state, dispatch } = useAlertContext();

  const setAlerts = useCallback((alerts: Alert[]) => {
    dispatch({ type: 'SET_ALERTS', payload: alerts });
  }, [dispatch]);

  const addAlert = useCallback((alert: Alert) => {
    dispatch({ type: 'ADD_ALERT', payload: alert });
  }, [dispatch]);

  const updateAlert = useCallback((alert: Alert) => {
    dispatch({ type: 'UPDATE_ALERT', payload: alert });
  }, [dispatch]);

  const removeAlert = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ALERT', payload: id });
  }, [dispatch]);

  const selectAlert = useCallback((alert: Alert | null) => {
    dispatch({ type: 'SELECT_ALERT', payload: alert });
  }, [dispatch]);

  const setFilters = useCallback((filters: AlertFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, [dispatch]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  return {
    // State
    alerts: state.alerts,
    selectedAlert: state.selectedAlert,
    filters: state.filters,
    loading: state.loading,
    error: state.error,
    // Actions
    setAlerts,
    addAlert,
    updateAlert,
    removeAlert,
    selectAlert,
    setFilters,
    setLoading,
    setError,
    reset,
  };
}
