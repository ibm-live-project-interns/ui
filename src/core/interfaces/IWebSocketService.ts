import type { WebSocketEventType, WebSocketCallback } from '../../services/WebSocketService';

export interface IWebSocketService {
  connect(): void;
  disconnect(): void;
  subscribe(eventType: WebSocketEventType, callback: WebSocketCallback): () => void;
  isConnected(): boolean;
}
