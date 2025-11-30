import { createContext, useReducer, useContext, type ReactNode } from 'react';
import { alertReducer, initialAlertState } from './alertReducer';
import type { AlertState, AlertAction } from './types';

/**
 * Alert context type
 */
interface AlertContextType {
  state: AlertState;
  dispatch: React.Dispatch<AlertAction>;
}

/**
 * Alert context
 */
const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * Alert provider props
 */
interface AlertProviderProps {
  children: ReactNode;
}

/**
 * AlertProvider - Provides alert state to the component tree
 */
export function AlertProvider({ children }: AlertProviderProps) {
  const [state, dispatch] = useReducer(alertReducer, initialAlertState);

  return (
    <AlertContext.Provider value={{ state, dispatch }}>
      {children}
    </AlertContext.Provider>
  );
}

/**
 * useAlertContext - Access alert context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within AlertProvider');
  }
  return context;
}
