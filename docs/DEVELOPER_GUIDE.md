# Developer Guide

Practical examples for working with this codebase.

## Using the Data Service

All data fetching goes through `alertDataService`:

```typescript
import { alertDataService } from '@/services';

// Get all alerts
const alerts = await alertDataService.getAlerts();

// Get alert by ID
const alert = await alertDataService.getAlertById('alert-123');

// Get active alert count
const count = await alertDataService.getActiveAlertCount();

// Get chart data
const chartData = await alertDataService.getAlertsOverTime('24h');
```

The service automatically uses mock or API based on `env.useMockData`.

## Types and Constants

All alert types are in `src/constants/alerts.tsx`:

```typescript
import {
  Severity,       // 'critical' | 'major' | 'minor' | 'info'
  AlertStatus,    // 'new' | 'acknowledged' | 'in-progress' | 'resolved' | 'dismissed'
  PriorityAlert,  // Full alert data
  DetailedAlert,  // Alert with AI analysis
  SEVERITY_CONFIG, // Colors, icons, labels for each severity
} from '@/constants';
```

## Using Severity Helpers

```typescript
import { getSeverityTag, getSeverityIcon, SEVERITY_CONFIG } from '@/constants';

// Get a Carbon Tag for a severity
const tag = getSeverityTag('critical'); // <Tag type="red">Critical</Tag>

// Get an icon
const icon = getSeverityIcon('critical', 24);

// Get config directly
const config = SEVERITY_CONFIG['critical'];
// { label: 'Critical', color: '#da1e28', tagType: 'red', icon: ErrorFilled, ... }
```

## React Hooks

### useAlert

Fetches a single alert by ID:

```typescript
import { useAlert } from '@/hooks/useAlert';

function AlertDetail({ id }: { id: string }) {
  const { alert, loading, error, refresh } = useAlert(id);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage text={error} />;

  return <div>{alert.aiTitle}</div>;
}
```

### useRealTimeAlerts

Fetches alerts with real-time updates (WebSocket or polling):

```typescript
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts';

function AlertList() {
  const { alerts, loading, isConnected, connectionType, refresh } = useRealTimeAlerts();

  return (
    <div>
      <p>Connection: {connectionType}</p>
      {alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
    </div>
  );
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_USE_MOCK` | Use mock data | `true` in dev |
| `VITE_API_BASE_URL` | API base URL | `http://localhost:8080` |
| `VITE_WS_ENDPOINT` | WebSocket URL | `ws://localhost:8080/ws` |
| `VITE_ENABLE_WEBSOCKET` | Enable WebSocket | `false` in dev |

## Adding New Features

### New Alert Property

1. Add to interface in `src/constants/alerts.tsx`
2. Add mock data in `src/__mocks__/alerts.mock.ts`
3. Update service if needed in `src/services/AlertDataService.ts`

### New API Endpoint

1. Add to `API_ENDPOINTS` in `src/config/environment.ts`
2. Add method to `IAlertDataService` interface
3. Implement in both `MockAlertDataService` and `ApiAlertDataService`

### New Page

1. Create in `src/pages/`
2. Add route in `src/App.tsx`
3. Import hooks and services as needed

## Carbon Component Patterns

### Tag (for severity/status)

```typescript
import { Tag } from '@carbon/react';
import { getSeverityTag } from '@/constants';

// Using helper
{getSeverityTag(alert.severity)}

// Manual
<Tag type="red">Critical</Tag>
<Tag type="magenta">Major</Tag>
<Tag type="purple">Minor</Tag>
<Tag type="blue">Info</Tag>
```

### DataTable

```typescript
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@carbon/react';

<DataTable rows={rows} headers={headers}>
  {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
    <Table {...getTableProps()}>
      <TableHead>
        <TableRow>
          {headers.map(header => (
            <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow {...getRowProps({ row })}>
            {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )}
</DataTable>
```

### Tile

```typescript
import { Tile } from '@carbon/react';

<Tile>
  <h3>Alert Title</h3>
  <p>Content here</p>
</Tile>
```

## SCSS Styling

Uses Carbon tokens:

```scss
@use '@carbon/react/scss/spacing' as *;
@use '@carbon/react/scss/theme' as *;
@use '@carbon/react' as react;

.my-component {
  padding: $spacing-05;
  color: $text-primary;
  background: $layer-01;
  @include react.type-style('body-compact-01');
}
```
