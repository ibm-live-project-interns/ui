/**
 * Example: Using Strategy Pattern for data fetching
 * Demonstrates switching between Mock and API data sources
 */

import { useEffect, useState } from 'react';
import { alertService } from '../services/AlertService';
import type { Alert } from '../models';

/**
 * Example 1: Using Mock Strategy (default)
 */
export function AlertListWithMockData() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Uses mock strategy by default
    alertService.fetchAlerts().then(setAlerts);
  }, []);

  return <div>{alerts.length} alerts loaded</div>;
}

/**
 * Example 2: Switching to API Strategy
 */
export function AlertListWithApiData() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Switch to API strategy
    alertService.useApiStrategy();
    alertService.fetchAlerts().then(setAlerts);
  }, []);

  return <div>{alerts.length} alerts loaded</div>;
}

/**
 * Example 3: Runtime Strategy Switching
 */
export function AlertListWithToggle() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [useMock, setUseMock] = useState(true);

  useEffect(() => {
    // Switch strategy based on state
    if (useMock) {
      alertService.useMockStrategy();
    } else {
      alertService.useApiStrategy();
    }
    
    alertService.fetchAlerts().then(setAlerts);
  }, [useMock]);

  return (
    <div>
      <button onClick={() => setUseMock(!useMock)}>
        Switch to {useMock ? 'API' : 'Mock'} Data
      </button>
      <div>{alerts.length} alerts loaded</div>
    </div>
  );
}

/**
 * Example 4: Environment-based Strategy
 */
// eslint-disable-next-line react-refresh/only-export-components
export function setupDataStrategy() {
  if (import.meta.env.MODE === 'production') {
    alertService.useApiStrategy();
  } else {
    alertService.useMockStrategy();
  }
}
