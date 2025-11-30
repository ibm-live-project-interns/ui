/**
 * Error boundary utilities for wrapping async operations
 * Provides consistent error handling without decorators
 */

import { errorLogger, ErrorLevel } from './errorLogger';

export interface ErrorBoundaryOptions {
  context?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  logLevel?: ErrorLevel;
  onError?: (error: Error) => void;
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  options: ErrorBoundaryOptions = {}
): Promise<T | null> {
  const {
    context = 'Unknown',
    defaultValue = null,
    logLevel = ErrorLevel.ERROR,
    onError,
  } = options;

  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    errorLogger.log(logLevel, err.message, context, err);
    
    if (onError) {
      onError(err);
    }
    
    return defaultValue;
  }
}

/**
 * Create a safe version of an async function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSafeFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorBoundaryOptions = {}
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    return withErrorBoundary(() => fn(...args), options);
  }) as T;
}
