import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import '@ibm/plex/css/ibm-plex.css';
import '@/styles/index.scss';
import App from './App';
import { installErrorHandlers, logger } from '@/shared/utils/logger';
import { env } from '@/shared/config';

// Install global error handlers for comprehensive error tracking
installErrorHandlers();

// Set document title from centralized config
document.title = env.appName;

// Log application startup
logger.info('Application starting', {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
});

// ==========================================
// Global Error Boundary
// ==========================================

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, GlobalErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Uncaught rendering error', { error: error.message, stack: errorInfo.componentStack });
  }

  handleReload = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#161616',
          color: '#f4f4f4',
          fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Application Error</h1>
          <p style={{ color: '#c6c6c6', maxWidth: '480px', lineHeight: 1.5 }}>
            The application encountered an unexpected error and cannot continue.
            Please reload the page to try again.
          </p>
          {this.state.error && (
            <p style={{
              color: '#ff8389',
              fontSize: '0.875rem',
              fontFamily: "'IBM Plex Mono', monospace",
              maxWidth: '600px',
              wordBreak: 'break-word',
              padding: '0.75rem 1rem',
              background: '#262626',
              borderRadius: '4px',
              border: '1px solid #393939',
            }}>
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReload}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 2rem',
              background: '#0f62fe',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);
