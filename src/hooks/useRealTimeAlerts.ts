/**
 * useRealTimeAlerts Hook
 * 
 * Provides real-time alert updates via WebSocket or polling fallback.
 * Uses AlertDataService which automatically switches between mock/API.
 * 
 * Usage:
 *   const { alerts, loading, isConnected, refresh } = useRealTimeAlerts();
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { alertDataService } from '@/services';
import { webSocketService, type WebSocketMessage } from '@/services/WebSocketService';
import { env } from '@/config';
import type { PriorityAlert } from '@/constants';

interface UseRealTimeAlertsOptions {
  pollingInterval?: number;
  enableRealTime?: boolean;
}

interface UseRealTimeAlertsReturn {
  alerts: PriorityAlert[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionType: 'websocket' | 'polling' | 'none';
  refresh: () => Promise<void>;
}

export function useRealTimeAlerts(
  options: UseRealTimeAlertsOptions = {}
): UseRealTimeAlertsReturn {
  const {
    pollingInterval = env.alertPollingInterval,
    enableRealTime = true,
  } = options;

  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'none'>('none');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch alerts from service
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await alertDataService.getAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'alert:new':
        if (message.payload) {
          setAlerts(prev => [message.payload as unknown as PriorityAlert, ...prev]);
        }
        break;

      case 'alert:updated':
        if (message.payload) {
          const updated = message.payload as unknown as PriorityAlert;
          setAlerts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        }
        break;

      case 'alert:resolved':
        if (message.payload) {
          const resolved = message.payload as unknown as PriorityAlert;
          setAlerts(prev =>
            prev.map(a => (a.id === resolved.id ? { ...a, status: 'resolved' as const } : a))
          );
        }
        break;

      case 'connection:open':
        setIsConnected(true);
        setConnectionType('websocket');
        // Clear polling when WebSocket connects
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        break;

      case 'connection:close':
      case 'connection:error':
        setIsConnected(false);
        // Fall back to polling
        if (enableRealTime && !pollingRef.current) {
          setConnectionType('polling');
          pollingRef.current = setInterval(fetchAlerts, pollingInterval);
        }
        break;
    }
  }, [enableRealTime, fetchAlerts, pollingInterval]);

  // Setup effect
  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    if (!enableRealTime) {
      setConnectionType('none');
      return;
    }

    // Try WebSocket first if enabled
    if (env.enableWebSocket) {
      setConnectionType('websocket');
      webSocketService.connect();

      const unsubscribers = [
        webSocketService.subscribe('alert:new', handleWebSocketMessage),
        webSocketService.subscribe('alert:updated', handleWebSocketMessage),
        webSocketService.subscribe('alert:resolved', handleWebSocketMessage),
        webSocketService.subscribe('connection:open', handleWebSocketMessage),
        webSocketService.subscribe('connection:close', handleWebSocketMessage),
        webSocketService.subscribe('connection:error', handleWebSocketMessage),
      ];

      // Fallback to polling if WebSocket doesn't connect
      const timeout = setTimeout(() => {
        if (!webSocketService.isConnected()) {
          setConnectionType('polling');
          pollingRef.current = setInterval(fetchAlerts, pollingInterval);
        }
      }, 5000);

      return () => {
        clearTimeout(timeout);
        unsubscribers.forEach(unsub => unsub());
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    } else {
      // Use polling if WebSocket is disabled
      setConnectionType('polling');
      setIsConnected(true);
      pollingRef.current = setInterval(fetchAlerts, pollingInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [enableRealTime, fetchAlerts, handleWebSocketMessage, pollingInterval]);

  return {
    alerts,
    loading,
    error,
    isConnected,
    connectionType,
    refresh: fetchAlerts,
  };
}
