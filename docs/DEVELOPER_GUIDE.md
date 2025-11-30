# Developer Guide

Practical examples of how to work with the codebase. All examples are from `src/examples/` - working code you can reference.

## Using Dependency Injection

Services are injected via hooks, not imported directly. This makes testing easier and lets you swap implementations.

```typescript
// src/examples/AlertListWithDI.example.tsx
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
```

**Why this matters:** You can easily mock `alertService` in tests or swap it for a different implementation without changing component code.

## Using Strategy Pattern

Switch between mock and real data sources at runtime. Useful for development vs production.

```typescript
// src/examples/StrategyPattern.example.tsx

// Example 1: Using Mock Strategy (default)
export function AlertListWithMockData() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Uses mock strategy by default
    alertService.fetchAlerts().then(setAlerts);
  }, []);

  return <div>{alerts.length} alerts loaded</div>;
}

// Example 2: Switching to API Strategy
export function AlertListWithApiData() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Switch to API strategy
    alertService.useApiStrategy();
    alertService.fetchAlerts().then(setAlerts);
  }, []);

  return <div>{alerts.length} alerts loaded</div>;
}

// Example 3: Runtime Strategy Switching
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

// Example 4: Environment-based Strategy
export function setupDataStrategy() {
  if (import.meta.env.MODE === 'production') {
    alertService.useApiStrategy();
  } else {
    alertService.useMockStrategy();
  }
}
```

**Why this matters:** Develop with fast mock data, deploy with real APIs. No code changes needed.

## Error Handling

Centralized error handling with automatic logging and fallback values.

```typescript
// src/examples/ErrorHandling.example.ts
import { withErrorBoundary } from '../core/utils/errorBoundary';
import { logError } from '../core/utils/errorLogger';

// Example 1: Basic error boundary with default value
async function fetchAlertsWithFallback() {
  const alerts = await withErrorBoundary(
    async () => {
      const response = await fetch('/api/alerts');
      return response.json();
    },
    {
      context: 'fetchAlerts',
      defaultValue: [], // Return empty array on error
    }
  );

  return alerts; // Always returns an array, never throws
}

// Example 2: Error boundary with custom error handling
async function fetchAlertWithRetry(id: string) {
  const alert = await withErrorBoundary(
    async () => {
      const response = await fetch(`/api/alerts/${id}`);
      if (!response.ok) throw new Error('Alert not found');
      return response.json();
    },
    {
      context: 'fetchAlertById',
      defaultValue: null,
      onError: (error) => {
        // Custom error handling
        console.error('Failed to fetch alert:', error);
        // Could trigger a retry, show notification, etc.
      },
    }
  );

  return alert;
}

// Example 3: Manual error logging
function handleUserAction() {
  try {
    // Some operation
    performAction();
  } catch (error) {
    logError(error, {
      context: 'handleUserAction',
      severity: 'high',
      metadata: { userId: 'user123' },
    });
    // Handle error gracefully
  }
}

// Example 4: Error boundary in React component
function AlertDetail({ id }: { id: string }) {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlert = async () => {
      const data = await withErrorBoundary(
        async () => {
          const response = await fetch(`/api/alerts/${id}`);
          return response.json();
        },
        {
          context: 'AlertDetail.loadAlert',
          defaultValue: null,
        }
      );

      setAlert(data);
      setLoading(false);
    };

    loadAlert();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!alert) return <div>Alert not found</div>;

  return <div>{alert.title}</div>;
}
```

**Why this matters:** Errors are logged automatically, components never crash, users see fallback UI.

## State Management

Global state for alerts using Context + Reducer pattern.

```typescript
// src/examples/StateManagement.example.tsx
import { useAlerts } from '../application/hooks/useAlerts';
import { AlertViewModel } from '../presentation/viewmodels/AlertViewModel';

// Example 1: Basic usage
export function AlertList() {
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

// Example 2: Filtering alerts
export function FilteredAlertList() {
  const { alerts, applyFilters } = useAlerts();

  const showCriticalOnly = () => {
    applyFilters({ severity: ['critical'] });
  };

  const showActiveOnly = () => {
    applyFilters({ status: ['active'] });
  };

  const clearFilters = () => {
    applyFilters({});
  };

  return (
    <div>
      <button onClick={showCriticalOnly}>Critical Only</button>
      <button onClick={showActiveOnly}>Active Only</button>
      <button onClick={clearFilters}>Clear Filters</button>
      <div>{alerts.length} alerts</div>
    </div>
  );
}

// Example 3: Refreshing data
export function AlertListWithRefresh() {
  const { alerts, loading, refreshAlerts } = useAlerts();

  return (
    <div>
      <button onClick={refreshAlerts} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <div>{alerts.length} alerts</div>
    </div>
  );
}
```

**Why this matters:** State is shared across components, no prop drilling, single source of truth.

## Using ViewModels

ViewModels prepare data for display. All formatting logic in one place.

```typescript
import { AlertViewModel } from '@/presentation/viewmodels';

const vm = new AlertViewModel(alert);

// Severity
vm.severityLabel;      // "Critical"
vm.severityKind;       // "red" (for Carbon Tag)
vm.severityPriority;   // 1

// Status
vm.statusLabel;        // "Active"
vm.statusColor;        // "#da1e28"
vm.isActive;           // true

// Time
vm.formattedTime;      // "2025-01-30 11:30:45"
vm.relativeTime;       // "2 hours ago"

// Text
vm.explanationSnippet; // First 150 chars
vm.deviceInfo;         // "server-01 (192.168.1.10)"

// Logic
vm.canCreateTicket;    // true/false
vm.hasRecommendedActions; // true/false
```

**Component example:**
```typescript
function AlertCard({ alert }) {
  const vm = new AlertViewModel(alert);

  return (
    <Tile>
      <Tag kind={vm.severityKind}>{vm.severityLabel}</Tag>
      <h3>{vm.deviceInfo}</h3>
      <p>{vm.explanationSnippet}</p>
      <time>{vm.relativeTime}</time>
      {vm.canCreateTicket && <Button>Create Ticket</Button>}
    </Tile>
  );
}
```

**Why this matters:** Change formatting once, updates everywhere. Components stay simple.

## Using Factories

Factories create objects from API responses. Handles edge cases and data normalization.

```typescript
import { alertFactory } from '@/domain/factories';

// Create alert from API response
// Handles snake_case, camelCase, missing fields, etc.
const alert = alertFactory.createFromApiResponse(apiData);

// Create summary for list views
const summary = alertFactory.createSummary(alert);
```

**Why this matters:** API responses are messy. Factories normalize them into clean objects.

## Using Mappers

Mappers provide consistent labels and colors across the app.

```typescript
import { severityMapper, statusMapper } from '@/domain/mappers';

// Get severity info
const info = severityMapper.getSeverityInfo('critical');
// { label: 'Critical', kind: 'red', priority: 1 }

// Use in a component
<Tag kind={info.kind}>{info.label}</Tag>

// Get status info
const statusInfo = statusMapper.getStatusInfo('active');
// { label: 'Active', color: '#24a148' }
```

**Available mappers:**
- `severityMapper` - Alert severity (critical, high, medium, low, info)
- `statusMapper` - Alert status (active, acknowledged, resolved, dismissed)
- `sourceTypeMapper` - Source type (snmp_trap, syslog)

**Why this matters:** One place to change labels/colors. Consistency across the app.

## Carbon Components

Here are the main patterns:

### DataTable
```typescript
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@carbon/react';

<DataTable
  rows={rows}
  headers={headers}
  render={({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
    <Table {...getTableProps()}>
      <TableHead>
        <TableRow>
          {headers.map(header => (
            <TableHeader {...getHeaderProps({ header })}>
              {header.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow {...getRowProps({ row })}>
            {row.cells.map(cell => (
              <TableCell key={cell.id}>{cell.value}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )}
/>
```

### Tag
```typescript
import { Tag } from '@carbon/react';

<Tag type="red">Critical</Tag>
<Tag type="orange">High</Tag>
<Tag type="yellow">Medium</Tag>
<Tag type="blue">Info</Tag>
```

### Tile
```typescript
import { Tile } from '@carbon/react';

<Tile>
  <h3>Title</h3>
  <p>Content</p>
</Tile>
```

### Button
```typescript
import { Button } from '@carbon/react';

<Button kind="primary" onClick={handleClick}>Primary</Button>
<Button kind="secondary">Secondary</Button>
<Button kind="danger">Delete</Button>
```

## Common Patterns

### Component with ViewModel
```typescript
function AlertCard({ alert }) {
  const vm = new AlertViewModel(alert);

  return (
    <Tile>
      <Tag kind={vm.severityKind}>{vm.severityLabel}</Tag>
      <p>{vm.explanationSnippet}</p>
      <time>{vm.relativeTime}</time>
    </Tile>
  );
}
```

### Component with State
```typescript
function AlertList() {
  const { alerts, loading, applyFilters } = useAlerts();

  return (
    <div>
      <Button onClick={() => applyFilters({ severity: ['critical'] })}>
        Show Critical
      </Button>
      {alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
    </div>
  );
}
```

### Component with Service
```typescript
function AlertDetail({ id }) {
  const alertService = useService(ServiceTokens.AlertService);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    alertService.fetchAlertById(id).then(setAlert);
  }, [id]);

  if (!alert) return <div>Loading...</div>;

  const vm = new AlertViewModel(alert);
  return <div>{vm.severityLabel}</div>;
}
```

> Note: For runnable, working code examples, see `src/examples/`. Developer Guide only contains snippets for documentation purposes.
