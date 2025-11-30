/**
 * Example: Using Error Handling Utilities
 * Demonstrates consistent error handling across services
 */

import { withErrorBoundary, createSafeFunction, errorLogger, ErrorLevel } from '../core/utils';

/**
 * Example 1: Wrap individual operations
 */
export async function fetchDataExample() {
  const data = await withErrorBoundary(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    {
      context: 'fetchData',
      defaultValue: null,
      logLevel: ErrorLevel.ERROR,
    }
  );

  return data; // Returns null on error
}

/**
 * Example 2: Create safe function wrapper
 */
export const safeFetch = createSafeFunction(
  async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  { context: 'safeFetch', defaultValue: null }
);

/**
 * Example 3: Using error logger directly
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processData(data: any) {
  try {
    if (!data) {
      errorLogger.warn('No data provided', 'processData');
      return;
    }

    // Process data
    errorLogger.info('Data processed successfully', 'processData');
  } catch (error) {
    errorLogger.error('Failed to process data', 'processData', error as Error);
  }
}

/**
 * Example 4: Service with error handling
 */
export class SafeAlertService {
  async fetchAlerts() {
    return withErrorBoundary(
      async () => {
        const response = await fetch('/api/alerts');
        return response.json();
      },
      {
        context: 'AlertService.fetchAlerts',
        defaultValue: [],
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateAlert(id: string, data: any) {
    return withErrorBoundary(
      async () => {
        const response = await fetch(`/api/alerts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        return response.json();
      },
      {
        context: 'AlertService.updateAlert',
        onError: (error) => {
          // Custom error handling
          console.error('Failed to update alert:', error);
        },
      }
    );
  }
}

/**
 * Example 5: Viewing error logs
 */
export function getErrorReport() {
  const logs = errorLogger.getLogs();
  return logs.filter(log => log.level === ErrorLevel.ERROR || log.level === ErrorLevel.FATAL);
}

/**
 * Example 6: Usage in React component
 */
export async function useDataWithErrorHandling() {
  // Automatically handles errors, returns null on failure
  const data = await safeFetch('/api/data');

  if (!data) {
    console.log('Failed to fetch data');
  }

  return data;
}

