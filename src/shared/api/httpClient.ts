/**
 * Base HTTP Service
 *
 * Provides common HTTP methods with error handling, JWT authentication,
 * request timeout support, retry logic for server errors, and comprehensive logging.
 * All API services should extend this class.
 */

import { API_TIMEOUT, DEFAULT_HEADERS } from '@/shared/config';
import { apiLogger } from '@/shared/utils/logger';

const TOKEN_KEY = 'noc_token';
const USER_KEY = 'noc_user';

/** Maximum number of retries for server errors (502, 503, 504) */
const MAX_RETRIES = 1;
/** Delay in ms before retrying a failed request */
const RETRY_DELAY_MS = 1000;

export class HttpService {
  protected baseUrl: string;
  protected serviceName: string;

  constructor(baseUrl: string = '', serviceName: string = 'API') {
    this.baseUrl = baseUrl;
    this.serviceName = serviceName;
  }

  /**
   * Get stored JWT token
   */
  protected getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store JWT token
   */
  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    apiLogger.info('Auth token stored');
  }

  /**
   * Clear JWT token
   */
  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    apiLogger.info('Auth token cleared');
  }

  /**
   * Check if user has a valid token
   */
  static hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Sleep helper for retry delay
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if status code is a retryable server error
   */
  private static isRetryableStatus(status: number): boolean {
    return status === 502 || status === 503 || status === 504;
  }

  /**
   * Make an authenticated HTTP request with timeout, error handling, retry, and logging
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();

    // Log request start
    apiLogger.debug(`${method} ${endpoint}`, {
      service: this.serviceName,
      hasBody: !!options.body,
    });

    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    // Add Authorization header if token exists
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      let response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      // Retry once on 502/503/504 server errors after a 1s delay
      if (HttpService.isRetryableStatus(response.status)) {
        const retryStatus = response.status;
        apiLogger.warn(`${method} ${endpoint} returned ${retryStatus}, retrying in ${RETRY_DELAY_MS}ms`, {
          status: retryStatus,
          retryAttempt: 1,
          maxRetries: MAX_RETRIES,
        });

        await HttpService.sleep(RETRY_DELAY_MS);

        // Create new AbortController for retry
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), API_TIMEOUT);
        try {
          response = await fetch(url, {
            ...config,
            signal: retryController.signal,
          });
        } finally {
          clearTimeout(retryTimeoutId);
        }
      }

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);

      // Handle 401 Unauthorized - token expired or invalid
      // Also clear cached user data from localStorage
      if (response.status === 401) {
        apiLogger.warn(`${method} ${endpoint} returned 401 - session expired`, {
          duration,
          status: 401,
        });
        HttpService.clearToken();
        localStorage.removeItem(USER_KEY);
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP Error: ${response.status} ${response.statusText}`;

        apiLogger.error(`${method} ${endpoint} failed`, undefined, {
          duration,
          status: response.status,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        apiLogger.debug(`${method} ${endpoint} completed (empty response)`, {
          duration,
          status: response.status,
        });
        return {} as T;
      }

      const data = JSON.parse(text);

      // Log successful response
      apiLogger.debug(`${method} ${endpoint} completed`, {
        duration,
        status: response.status,
        responseSize: text.length,
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        apiLogger.error(`${method} ${endpoint} timed out`, error, {
          duration,
          timeout: API_TIMEOUT,
        });
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        apiLogger.error(`${method} ${endpoint} network error`, error, {
          duration,
          url,
        });
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }

      // Log other errors
      apiLogger.error(`${method} ${endpoint} failed`, error instanceof Error ? error : undefined, {
        duration,
      });

      throw error;
    }
  }

  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
