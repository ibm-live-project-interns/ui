import type { Alert, AlertFilters } from '../../models/Alert';

/**
 * Alert state shape
 */
export interface AlertState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  filters: AlertFilters;
  loading: boolean;
  error: string | null;
}

/**
 * Alert actions
 */
export type AlertAction =
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'UPDATE_ALERT'; payload: Alert }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'SELECT_ALERT'; payload: Alert | null }
  | { type: 'SET_FILTERS'; payload: AlertFilters }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };
