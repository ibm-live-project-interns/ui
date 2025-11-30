/**
 * Bootstrap - Register all services in the DI container
 * Call this once at app startup
 */

import { container } from './ServiceContainer';
import { ServiceTokens } from './ServiceTokens';
import { AlertService } from '../../services/AlertService';
import { TicketingService } from '../../services/TicketingService';
import { WebSocketService } from '../../services/WebSocketService';

/**
 * Initialize all services in the container
 */
export function bootstrapServices(): void {
  // Register services as singletons using factories
  container.registerFactory(ServiceTokens.AlertService, () => AlertService.getInstance());
  container.registerFactory(ServiceTokens.TicketingService, () => TicketingService.getInstance());
  container.registerFactory(ServiceTokens.WebSocketService, () => WebSocketService.getInstance());
}

/**
 * Get service from container (convenience function)
 */
export function getService<T>(token: symbol & { __type?: T }): T {
  return container.resolve(token) as T;
}
