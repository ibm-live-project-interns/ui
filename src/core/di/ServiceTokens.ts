/**
 * Service tokens for type-safe dependency injection
 * Use symbols to avoid naming collisions
 */

import type { IAlertService } from '../interfaces/IAlertService';
import type { ITicketingService } from '../interfaces/ITicketingService';
import type { IWebSocketService } from '../interfaces/IWebSocketService';

export const ServiceTokens = {
  AlertService: Symbol('AlertService') as symbol & { __type?: IAlertService },
  TicketingService: Symbol('TicketingService') as symbol & { __type?: ITicketingService },
  WebSocketService: Symbol('WebSocketService') as symbol & { __type?: IWebSocketService },
} as const;

export type ServiceToken<T> = symbol & { __type?: T };
