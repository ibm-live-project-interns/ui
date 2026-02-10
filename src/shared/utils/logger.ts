/**
 * Comprehensive Logging Utility
 *
 * Provides structured logging for the frontend application with:
 * - Log levels (debug, info, warn, error)
 * - Timestamped entries
 * - Log persistence for debugging
 * - Error tracking and reporting
 *
 * @module logger
 */

import { env } from '@/shared/config';

// ==========================================
// Types
// ==========================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    data?: unknown;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

interface LoggerConfig {
    enabled: boolean;
    minLevel: LogLevel;
    persistLogs: boolean;
    maxLogEntries: number;
    sendToServer: boolean;
}

// ==========================================
// Log Level Priority
// ==========================================

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// ==========================================
// Default Configuration
// ==========================================

const defaultConfig: LoggerConfig = {
    enabled: true,
    minLevel: env.DEV ? 'debug' : 'warn',
    persistLogs: true,
    maxLogEntries: 500,
    sendToServer: false,
};

// ==========================================
// In-memory Log Storage
// ==========================================

class LogStorage {
    private logs: LogEntry[] = [];
    private maxEntries: number;
    private storageKey = 'app_logs';

    constructor(maxEntries: number = 500) {
        this.maxEntries = maxEntries;
        this.loadFromStorage();
    }

    add(entry: LogEntry): void {
        this.logs.push(entry);

        // Trim old entries
        if (this.logs.length > this.maxEntries) {
            this.logs = this.logs.slice(-this.maxEntries);
        }

        this.saveToStorage();
    }

    getAll(): LogEntry[] {
        return [...this.logs];
    }

    getByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    getByCategory(category: string): LogEntry[] {
        return this.logs.filter(log => log.category === category);
    }

    getErrors(): LogEntry[] {
        return this.logs.filter(log => log.level === 'error');
    }

    getRecent(count: number = 50): LogEntry[] {
        return this.logs.slice(-count);
    }

    clear(): void {
        this.logs = [];
        this.saveToStorage();
    }

    exportAsJson(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    // Only load recent logs (last 100) on startup
                    this.logs = parsed.slice(-100);
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    private saveToStorage(): void {
        try {
            // Only save last 100 entries to localStorage
            const toSave = this.logs.slice(-100);
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
        } catch {
            // Ignore storage errors
        }
    }
}

// ==========================================
// Logger Class
// ==========================================

class Logger {
    private config: LoggerConfig;
    private storage: LogStorage;
    private category: string;

    constructor(category: string = 'App', config: Partial<LoggerConfig> = {}) {
        this.category = category;
        this.config = { ...defaultConfig, ...config };
        this.storage = new LogStorage(this.config.maxLogEntries);
    }

    /**
     * Create a child logger with a specific category
     */
    child(category: string): Logger {
        const childLogger = new Logger(category, this.config);
        childLogger.storage = this.storage; // Share storage
        return childLogger;
    }

    /**
     * Check if a log level should be output
     */
    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
    }

    /**
     * Create a log entry
     */
    private createEntry(
        level: LogLevel,
        message: string,
        data?: unknown,
        error?: Error
    ): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            category: this.category,
            message,
            data: data !== undefined ? this.sanitizeData(data) : undefined,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : undefined,
        };
    }

    /**
     * Sanitize data to prevent circular references
     */
    private sanitizeData(data: unknown): unknown {
        try {
            // Clone to remove circular references
            return JSON.parse(JSON.stringify(data));
        } catch {
            if (data instanceof Error) {
                return {
                    name: data.name,
                    message: data.message,
                    stack: data.stack,
                };
            }
            return String(data);
        }
    }

    /**
     * Output log to console
     */
    private output(entry: LogEntry): void {
        const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;

        const consoleMethods: Record<LogLevel, (...args: unknown[]) => void> = {
            debug: console.debug,
            info: console.info,
            warn: console.warn,
            error: console.error,
        };

        const logFn = consoleMethods[entry.level] || console.log;

        if (entry.error) {
            logFn(prefix, entry.message, entry.data || '', entry.error);
        } else if (entry.data !== undefined) {
            logFn(prefix, entry.message, entry.data);
        } else {
            logFn(prefix, entry.message);
        }
    }

    /**
     * Core logging method
     */
    private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
        if (!this.shouldLog(level)) return;

        const entry = this.createEntry(level, message, data, error);

        // Output to console
        this.output(entry);

        // Persist to storage
        if (this.config.persistLogs) {
            this.storage.add(entry);
        }

        // Send to server for error level
        if (this.config.sendToServer && level === 'error') {
            this.sendToServer(entry);
        }
    }

    /**
     * Send error logs to server (if configured)
     */
    private async sendToServer(entry: LogEntry): Promise<void> {
        try {
            await fetch(`${env.apiBaseUrl}/api/v1/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            });
        } catch {
            // Silently fail to avoid infinite loops
        }
    }

    // ==========================================
    // Public Logging Methods
    // ==========================================

    debug(message: string, data?: unknown): void {
        this.log('debug', message, data);
    }

    info(message: string, data?: unknown): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown): void {
        this.log('warn', message, data);
    }

    error(message: string, error?: Error | unknown, data?: unknown): void {
        const err = error instanceof Error ? error : undefined;
        const extraData = error instanceof Error ? data : error;
        this.log('error', message, extraData, err);
    }

    // ==========================================
    // Utility Methods
    // ==========================================

    /**
     * Log API request
     */
    request(method: string, url: string, data?: unknown): void {
        this.debug(`API Request: ${method} ${url}`, data);
    }

    /**
     * Log API response
     */
    response(method: string, url: string, status: number, data?: unknown): void {
        if (status >= 400) {
            this.error(`API Error: ${method} ${url} returned ${status}`, undefined, data);
        } else {
            this.debug(`API Response: ${method} ${url} (${status})`, data);
        }
    }

    /**
     * Log user action
     */
    action(actionName: string, data?: unknown): void {
        this.info(`User Action: ${actionName}`, data);
    }

    /**
     * Log performance metric
     */
    performance(operation: string, durationMs: number): void {
        this.debug(`Performance: ${operation} took ${durationMs}ms`);
    }

    /**
     * Start a performance timer
     */
    time(label: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.performance(label, Math.round(duration));
        };
    }

    // ==========================================
    // Log Access Methods
    // ==========================================

    getAllLogs(): LogEntry[] {
        return this.storage.getAll();
    }

    getErrorLogs(): LogEntry[] {
        return this.storage.getErrors();
    }

    getRecentLogs(count?: number): LogEntry[] {
        return this.storage.getRecent(count);
    }

    exportLogs(): string {
        return this.storage.exportAsJson();
    }

    clearLogs(): void {
        this.storage.clear();
    }

    /**
     * Download logs as a file
     */
    downloadLogs(filename?: string): void {
        const content = this.exportLogs();
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ==========================================
// Singleton Instance & Category Loggers
// ==========================================

export const logger = new Logger('App');

// Pre-configured category loggers
export const apiLogger = logger.child('API');
export const authLogger = logger.child('Auth');
export const uiLogger = logger.child('UI');
export const alertLogger = logger.child('Alert');
export const deviceLogger = logger.child('Device');
export const ticketLogger = logger.child('Ticket');

// ==========================================
// Global Error Handler
// ==========================================

/**
 * Install global error handlers
 */
export function installErrorHandlers(): void {
    // Unhandled errors
    window.onerror = (message, source, lineno, colno, error) => {
        logger.error('Unhandled Error', error, {
            message: String(message),
            source,
            line: lineno,
            column: colno,
        });
        return false;
    };

    // Unhandled promise rejections
    window.onunhandledrejection = (event) => {
        logger.error('Unhandled Promise Rejection', event.reason);
    };

    logger.info('Global error handlers installed');
}

export default logger;
