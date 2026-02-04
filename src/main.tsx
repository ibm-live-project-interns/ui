import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ibm/plex/css/ibm-plex.css';
import '@/styles/index.scss';
import App from './App';
import { installErrorHandlers, logger } from '@/shared/utils/logger';

// Install global error handlers for comprehensive error tracking
installErrorHandlers();

// Log application startup
logger.info('Application starting', {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

