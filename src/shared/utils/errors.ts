/**
 * Copyright IBM Corp. 2025
 *
 * Error Handling Utilities
 *
 * Centralized error handling for consistent error messages across the app.
 */

import type { APIError } from '@/shared/types';

/** Error codes that can be returned from the API */
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',

  // Server errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/** User-friendly error messages */
const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  'Invalid credentials': 'The email or password you entered is incorrect.',
  'Email not verified. Please check your email.': 'Please verify your email address before logging in.',
  'Account is locked. Try again later.': 'Your account has been temporarily locked due to too many failed attempts.',
  'Account is not active': 'Your account is not active. Please contact support.',
  'Session expired. Please login again.': 'Your session has expired. Please log in again.',

  // Registration
  'Email already registered': 'This email is already registered. Try logging in instead.',
  'Username already taken': 'This username is taken. Please choose a different one.',

  // Password reset
  'Invalid or expired reset token': 'This password reset link is invalid or has expired.',
  'Invalid or expired verification token': 'This verification link is invalid or has expired.',

  // General
  'Database not available': 'Service is temporarily unavailable. Please try again later.',
  'Not authenticated': 'Please log in to continue.',
  'User not found': 'User account not found.',
};

/**
 * Parse API error and return user-friendly message
 */
export function parseAPIError(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message;
  }

  // Handle API error objects
  if (isAPIError(error)) {
    return ERROR_MESSAGES[error.error] || error.error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Type guard for APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as APIError).error === 'string'
  );
}

/**
 * Create a typed error for the API
 */
export function createAPIError(message: string, code?: ErrorCode): APIError {
  return {
    error: message,
    code,
  };
}

/**
 * Rethrow error with user-friendly message
 */
export function handleError(error: unknown): never {
  throw new Error(parseAPIError(error));
}

/**
 * Log error and return user-friendly message
 */
export function logAndParseError(error: unknown, context: string): string {
  console.error(`[${context}] Error:`, error);
  return parseAPIError(error);
}
