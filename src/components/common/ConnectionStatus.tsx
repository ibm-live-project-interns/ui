/**
 * ConnectionStatus Component
 * Displays real-time connection status (WebSocket or polling)
 *
 * @architecture docs/arch/UI/README.md
 * "Provides real-time updates"
 */

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionType: 'websocket' | 'polling' | 'none';
  className?: string;
}

/**
 * Visual indicator for real-time connection status
 */
export function ConnectionStatus({ isConnected, connectionType, className }: ConnectionStatusProps) {
  const getStatusLabel = () => {
    if (connectionType === 'none') return 'Updates disabled';
    if (!isConnected) return 'Connecting...';
    return connectionType === 'websocket' ? 'Live' : 'Polling';
  };

  const getStatusClass = () => {
    if (connectionType === 'none') return 'disconnected';
    if (!isConnected) return 'connecting';
    return 'connected';
  };

  return (
    <div className={`connection-status ${className || ''}`}>
      <span className={`connection-status__dot connection-status__dot--${getStatusClass()}`} />
      <span className="connection-status__label">{getStatusLabel()}</span>
    </div>
  );
}
