/**
 * useRealTimeAlerts Hook
 * Combines polling and WebSocket for real-time alert updates
 *
 * @architecture docs/arch/UI/README.md
 * "Provides real-time updates, historical alert navigation"
 *
 * Uses WebSocket when available, falls back to polling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { alertService } from '../services';
import { webSocketService, type WebSocketMessage } from '../services/WebSocketService';
import { env } from '../config/environment';
import type { Alert, AlertFilters } from '../models';

interface UseRealTimeAlertsOptions {
  filters?: AlertFilters;
  pollingInterval?: number;
  enableRealTime?: boolean;
}

interface UseRealTimeAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionType: 'websocket' | 'polling' | 'none';
  refresh: () => Promise<void>;
}

/**
 * Hook for real-time alert updates
 * Automatically switches between WebSocket and polling based on availability
 */
export function useRealTimeAlerts(options: UseRealTimeAlertsOptions = {}): UseRealTimeAlertsReturn {
  const {
    filters,
    pollingInterval = env.alertPollingInterval,
    enableRealTime = true,
  } = options;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'none'>('none');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await alertService.fetchAlerts(filtersRef.current);
      setAlerts(data);
    } catch {
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'alert:new':
        if (message.payload) {
          setAlerts(prev => [message.payload as Alert, ...prev]);
        }
        break;

      case 'alert:updated':
        if (message.payload) {
          const updatedAlert = message.payload as Alert;
          setAlerts(prev =>
            prev.map(a => (a.id === updatedAlert.id ? updatedAlert : a))
          );
        }
        break;

      case 'alert:resolved':
        if (message.payload) {
          const resolvedAlert = message.payload as Alert;
          setAlerts(prev =>
            prev.map(a => (a.id === resolvedAlert.id ? { ...a, status: 'resolved' } : a))
          );
        }
        break;

      case 'connection:open':
        setIsConnected(true);
        setConnectionType('websocket');
        // Clear polling when WebSocket is connected
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

      // Fallback to polling if WebSocket doesn't connect within 5 seconds
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
      setIsConnected(true); // Consider polling as "connected"
      pollingRef.current = setInterval(fetchAlerts, pollingInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [enableRealTime, fetchAlerts, handleWebSocketMessage, pollingInterval]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchAlerts();
  }, [filters, fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    isConnected,
    connectionType,
    refresh: fetchAlerts,
  };
}
