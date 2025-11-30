import type { AlertState, AlertAction } from './types';

/**
 * Initial alert state
 */
export const initialAlertState: AlertState = {
  alerts: [],
  selectedAlert: null,
  filters: {},
  loading: false,
  error: null,
};

/**
 * Alert reducer - handles all alert state updates
 */
export function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case 'SET_ALERTS':
      return {
        ...state,
        alerts: action.payload,
        loading: false,
        error: null,
      };

    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
      };

    case 'UPDATE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload.id ? action.payload : alert
        ),
        selectedAlert:
          state.selectedAlert?.id === action.payload.id
            ? action.payload
            : state.selectedAlert,
      };

    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload),
        selectedAlert:
          state.selectedAlert?.id === action.payload ? null : state.selectedAlert,
      };

    case 'SELECT_ALERT':
      return {
        ...state,
        selectedAlert: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'RESET':
      return initialAlertState;

    default:
      return state;
  }
}
