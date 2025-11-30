/**
 * Example: Using Dependency Injection in components
 */

import { useEffect, useState } from 'react';
import type { Alert } from '../models';
import { useService } from '../application/hooks/useService';
import { ServiceTokens } from '../core/di/ServiceTokens';
import { AlertViewModel } from '../presentation/viewmodels/AlertViewModel';

export function AlertListWithDI() {
  const alertService = useService(ServiceTokens.AlertService);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    alertService.fetchAlerts().then(setAlerts);
  }, [alertService]);

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
