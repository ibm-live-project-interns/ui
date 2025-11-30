/**
 * Example: Using State Management with Context + Reducer
 * Demonstrates centralized state management for alerts
 */

import { AlertProvider } from '../application/state';
import { useAlerts } from '../application/hooks/useAlerts';
import { AlertViewModel } from '../presentation/viewmodels/AlertViewModel';

/**
 * Example 1: Basic usage with auto-fetch
 */
function AlertList() {
  const { alerts, loading, error } = useAlerts();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {alerts.map(alert => {
        const vm = new AlertViewModel(alert);
        return (
          <div key={alert.id}>
            <h3>{vm.severityLabel}</h3>
            <p>{vm.explanationSnippet}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Example 2: With filtering
 */
function FilteredAlertList() {
  const { alerts, applyFilters, loading } = useAlerts();

  const handleFilterBySeverity = (severity: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyFilters({ severity: [severity as any] });
  };

  return (
    <div>
      <button onClick={() => handleFilterBySeverity('critical')}>
        Critical Only
      </button>
      <button onClick={() => applyFilters({})}>Clear Filters</button>
      {loading ? <div>Loading...</div> : <div>{alerts.length} alerts</div>}
    </div>
  );
}

/**
 * Example 3: With status updates
 */
function AlertWithActions() {
  const { alerts, updateAlertStatus, selectAlert, selectedAlert } = useAlerts();

  const handleAcknowledge = async (id: string) => {
    await updateAlertStatus(id, 'acknowledged');
  };

  return (
    <div>
      {alerts.map(alert => (
        <div key={alert.id}>
          <span onClick={() => selectAlert(alert)}>
            {alert.id} - {alert.severity}
          </span>
          <button onClick={() => handleAcknowledge(alert.id)}>
            Acknowledge
          </button>
        </div>
      ))}
      {selectedAlert && <div>Selected: {selectedAlert.id}</div>}
    </div>
  );
}

/**
 * Example 4: App with provider
 */
export function AppWithStateManagement() {
  return (
    <AlertProvider>
      <div>
        <h1>Alerts Dashboard</h1>
        <FilteredAlertList />
        <AlertList />
        <AlertWithActions />
      </div>
    </AlertProvider>
  );
}
