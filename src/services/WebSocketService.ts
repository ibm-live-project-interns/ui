/**
 * WebSocketService - Real-time alert updates via WebSocket
 *
 * @architecture docs/arch/UI/README.md
 * "Provides real-time updates, historical alert navigation"
 *
 * @see docs/arch/Output&Integration/Sequence.puml
 * Enables push-based updates from Agents-api instead of polling
 */

import { env } from '../config/environment';
import type { Alert } from '../models';

export type WebSocketEventType = 'alert:new' | 'alert:updated' | 'alert:resolved' | 'connection:open' | 'connection:close' | 'connection:error';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload?: Alert | Alert[] | Record<string, unknown>;
  timestamp: string;
}

export type WebSocketCallback = (message: WebSocketMessage) => void;

/**
 * WebSocketService Singleton
 * Manages real-time connection to Agents-api for live alert updates
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private listeners: Map<WebSocketEventType, Set<WebSocketCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  private constructor() {
    // Initialize listener sets for each event type
    const eventTypes: WebSocketEventType[] = [
      'alert:new',
      'alert:updated',
      'alert:resolved',
      'connection:open',
      'connection:close',
      'connection:error',
    ];
    eventTypes.forEach(type => this.listeners.set(type, new Set()));
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket endpoint
   * @see docs/arch/Output&Integration/Component.puml - Dashboard UI connection
   */
  public connect(): void {
    if (!env.enableWebSocket) {
      console.info('[WebSocket] WebSocket disabled in current environment');
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = new WebSocket(env.wsEndpoint);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        console.info('[WebSocket] Connected to', env.wsEndpoint);
        this.emit('connection:open', { type: 'connection:open', timestamp: new Date().toISOString() });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.emit(message.type, message);
        } catch {
          console.error('[WebSocket] Failed to parse message:', event.data);
        }
      };

      this.socket.onclose = (event) => {
        this.isConnecting = false;
        console.info('[WebSocket] Connection closed:', event.code, event.reason);
        this.emit('connection:close', {
          type: 'connection:close',
          payload: { code: event.code, reason: event.reason },
          timestamp: new Date().toISOString(),
        });
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        this.isConnecting = false;
        console.error('[WebSocket] Error:', error);
        this.emit('connection:error', {
          type: 'connection:error',
          payload: { error: String(error) },
          timestamp: new Date().toISOString(),
        });
      };
    } catch (error) {
      this.isConnecting = false;
      console.error('[WebSocket] Failed to connect:', error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  /**
   * Subscribe to WebSocket events
   */
  public subscribe(eventType: WebSocketEventType, callback: WebSocketCallback): () => void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      listeners?.delete(callback);
    };
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  public getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.socket) return 'closed';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      default:
        return 'closed';
    }
  }

  private emit(eventType: WebSocketEventType, message: WebSocketMessage): void {
    const listeners = this.listeners.get(eventType);
    listeners?.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[WebSocket] Error in listener:', error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.info(`[WebSocket] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export const webSocketService = WebSocketService.getInstance();
