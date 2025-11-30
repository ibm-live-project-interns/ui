/**
 * Error logger utility
 * Centralized error logging with different levels
 */

export const ErrorLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
} as const;

export type ErrorLevel = typeof ErrorLevel[keyof typeof ErrorLevel];

export interface ErrorLog {
  level: ErrorLevel;
  message: string;
  context?: string;
  error?: Error;
  timestamp: Date;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(level: ErrorLevel, message: string, context?: string, error?: Error): void {
    const log: ErrorLog = {
      level,
      message,
      context,
      error,
      timestamp: new Date(),
    };

    this.logs.push(log);

    // Console output
    const prefix = `[${level}]${context ? ` [${context}]` : ''}`;
    switch (level) {
      case ErrorLevel.INFO:
        console.info(prefix, message, error);
        break;
      case ErrorLevel.WARN:
        console.warn(prefix, message, error);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        console.error(prefix, message, error);
        break;
    }
  }

  info(message: string, context?: string): void {
    this.log(ErrorLevel.INFO, message, context);
  }

  warn(message: string, context?: string, error?: Error): void {
    this.log(ErrorLevel.WARN, message, context, error);
  }

  error(message: string, context?: string, error?: Error): void {
    this.log(ErrorLevel.ERROR, message, context, error);
  }

  fatal(message: string, context?: string, error?: Error): void {
    this.log(ErrorLevel.FATAL, message, context, error);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

export const errorLogger = ErrorLogger.getInstance();
