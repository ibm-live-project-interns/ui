/**
 * Error handler decorator for service methods
 * Provides consistent error handling and logging
 */

export interface ErrorHandlerOptions {
  logError?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  rethrow?: boolean;
}

/**
 * Decorator to handle errors in service methods
 * @example
 * class MyService {
 *   @HandleError({ logError: true })
 *   async fetchData() { ... }
 * }
 */
export function HandleError(options: ErrorHandlerOptions = {}) {
  const { logError = true, defaultValue = null, rethrow = false } = options;

  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (logError) {
          console.error(
            `[${target.constructor.name}.${propertyKey}] Error:`,
            error instanceof Error ? error.message : error
          );
        }

        if (rethrow) {
          throw error;
        }

        return defaultValue;
      }
    };

    return descriptor;
  };
}

/**
 * Function wrapper for error handling (non-decorator version)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  options: ErrorHandlerOptions = {}
): T {
  const { logError = true, defaultValue = null, rethrow = false } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (logError) {
        console.error(`[${fn.name}] Error:`, error instanceof Error ? error.message : error);
      }

      if (rethrow) {
        throw error;
      }

      return defaultValue;
    }
  }) as T;
}
