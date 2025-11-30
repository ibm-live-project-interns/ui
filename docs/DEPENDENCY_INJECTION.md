# Dependency Injection

## What It Is

Instead of importing services directly, we inject them. This makes testing easier and code more flexible.

**Without DI:**
```typescript
import { alertService } from '@/services';

// Stuck with this specific service
const alerts = await alertService.fetchAlerts();
```

**With DI:**
```typescript
import { useService } from '@/application/hooks';
import { ServiceTokens } from '@/core/di';

// Can swap this out for testing
const alertService = useService(ServiceTokens.AlertService);
const alerts = await alertService.fetchAlerts();
```

## How It Works

### 1. Service Container

A box that holds all services. You put services in, you take services out.

```typescript
import { container } from '@/core/di';

// Put a service in
container.register(ServiceTokens.AlertService, alertService);

// Take a service out
const service = container.resolve(ServiceTokens.AlertService);
```

### 2. Service Tokens

Unique IDs for services. We use symbols so they can't collide.

```typescript
export const ServiceTokens = {
  AlertService: Symbol('AlertService'),
  TicketingService: Symbol('TicketingService'),
  WebSocketService: Symbol('WebSocketService'),
};
```

### 3. Bootstrap

At app startup, we register all services.

```typescript
// src/core/di/bootstrap.ts
export function bootstrapServices() {
  container.registerFactory(ServiceTokens.AlertService, () => AlertService.getInstance());
  container.registerFactory(ServiceTokens.TicketingService, () => TicketingService.getInstance());
  container.registerFactory(ServiceTokens.WebSocketService, () => WebSocketService.getInstance());
}

// src/App.tsx
bootstrapServices(); // Called once at startup
```

## Using It

### In Components

```typescript
import { useService } from '@/application/hooks';
import { ServiceTokens } from '@/core/di';

function AlertList() {
  const alertService = useService(ServiceTokens.AlertService);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    alertService.fetchAlerts().then(setAlerts);
  }, [alertService]);

  return <div>{alerts.length} alerts</div>;
}
```

### Multiple Services

```typescript
function AlertWithTicketing() {
  const alertService = useService(ServiceTokens.AlertService);
  const ticketingService = useService(ServiceTokens.TicketingService);

  const createTicket = async (alert) => {
    await ticketingService.createIncidentFromAlert(alert);
  };
}
```

### Outside React

```typescript
import { getService } from '@/core/di/bootstrap';
import { ServiceTokens } from '@/core/di';

// In utility functions
const alertService = getService(ServiceTokens.AlertService);
```

## Testing

The main benefit - easy to mock services.

```typescript
import { container, ServiceTokens } from '@/core/di';

describe('AlertList', () => {
  beforeEach(() => {
    // Inject a mock service
    const mockService = {
      fetchAlerts: jest.fn().mockResolvedValue([/* mock data */]),
    };
    container.register(ServiceTokens.AlertService, mockService);
  });

  afterEach(() => {
    container.clear(); // Clean up
  });

  it('renders alerts', async () => {
    render(<AlertList />);
    // Component automatically uses mock service
  });
});
```

## How Services Are Registered

Services use lazy loading - they're created only when first needed.

```typescript
// Register a factory (not created yet)
container.registerFactory(ServiceTokens.AlertService, () => AlertService.getInstance());

// First time you resolve it, it creates the instance
const service = container.resolve(ServiceTokens.AlertService);

// Next time, returns the same instance
const sameService = container.resolve(ServiceTokens.AlertService);
```

## Adding New Services

1. **Create the service:**
```typescript
// src/infrastructure/services/MyService.ts
export class MyService {
  private static instance: MyService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new MyService();
    }
    return this.instance;
  }

  doSomething() {
    // ...
  }
}
```

2. **Create a token:**
```typescript
// src/core/di/ServiceTokens.ts
export const ServiceTokens = {
  // ... existing tokens
  MyService: Symbol('MyService'),
};
```

3. **Register it:**
```typescript
// src/core/di/bootstrap.ts
export function bootstrapServices() {
  // ... existing registrations
  container.registerFactory(ServiceTokens.MyService, () => MyService.getInstance());
}
```

4. **Use it:**
```typescript
const myService = useService(ServiceTokens.MyService);
```

## Why We Do This

**Testing** - Easy to inject mocks
**Flexibility** - Easy to swap implementations
**Loose Coupling** - Components don't depend on specific services
**Type Safety** - Full TypeScript support

## The Container API

```typescript
// Register an instance
container.register(token, instance);

// Register a factory (lazy)
container.registerFactory(token, () => createInstance());

// Get a service
const service = container.resolve(token);

// Check if registered
if (container.has(token)) { }

// Clear all (for testing)
container.clear();

// Reset to fresh state (for testing)
ServiceContainer.reset();
```
