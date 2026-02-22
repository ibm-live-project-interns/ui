import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts loaded via Google Fonts CDN in index.html (IBM Plex Sans + Mono)
// Carbon's $css--font-face is disabled to avoid broken ~@ibm/plex path resolution in Vite
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
        <div className="error-boundary">
          <h1 className="error-boundary__title error-boundary__title--large">Application Error</h1>
          <p className="error-boundary__description">
            The application encountered an unexpected error and cannot continue.
            Please reload the page to try again.
          </p>
          {this.state.error && (
            <p className="error-boundary__error-message error-boundary__error-message--boxed">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReload}
            className="error-boundary__reload-btn--native"
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
