/**
 * ToastContext - Shared toast notification system
 *
 * Provides a centralized way for any page/component to show toast notifications
 * without duplicating state management and rendering logic. Uses IBM Carbon's
 * ToastNotification component for consistent UI.
 *
 * Usage:
 *   const { addToast, removeToast } = useToast();
 *   addToast('success', 'Title', 'Something happened');
 */

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from 'react';
import { ToastNotification } from '@carbon/react';

// ============================================================
// Types
// ============================================================

type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    kind: ToastKind;
    title: string;
    subtitle: string;
}

interface ToastContextValue {
    addToast: (kind: ToastKind, title: string, subtitle: string) => void;
    removeToast: (id: string) => void;
}

// ============================================================
// Constants
// ============================================================

const MAX_VISIBLE_TOASTS = 5;
const AUTO_DISMISS_MS = 5000;

// ============================================================
// Context
// ============================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================
// Hook
// ============================================================

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
}

// ============================================================
// Provider
// ============================================================

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    // Track active timers so we can clean up if a toast is manually dismissed
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        // Clear the auto-dismiss timer if it exists
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const addToast = useCallback((kind: ToastKind, title: string, subtitle: string) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const toast: Toast = { id, kind, title, subtitle };

        setToasts(prev => {
            // Enforce max visible limit by dropping the oldest if we're at capacity
            const next = [...prev, toast];
            if (next.length > MAX_VISIBLE_TOASTS) {
                const removed = next.shift();
                if (removed) {
                    const timer = timersRef.current.get(removed.id);
                    if (timer) {
                        clearTimeout(timer);
                        timersRef.current.delete(removed.id);
                    }
                }
            }
            return next;
        });

        // Auto-dismiss after timeout
        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timersRef.current.delete(id);
        }, AUTO_DISMISS_MS);
        timersRef.current.set(id, timer);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}

            {/* Fixed-position toast container -- renders above all page content */}
            {toasts.length > 0 && (
                <div
                    aria-live="polite"
                    aria-label="Notifications"
                    className="toast-container"
                >
                    {toasts.map(toast => (
                        <div key={toast.id} className="toast-container__item">
                            {/*
                             * Removed Carbon's `timeout` prop to avoid double auto-dismiss.
                             * Our custom setTimeout in addToast() handles auto-dismiss.
                             * Carbon's built-in timeout was causing a race condition where both
                             * timers could fire, leading to stale state.
                             */}
                            <ToastNotification
                                kind={toast.kind}
                                title={toast.title}
                                subtitle={toast.subtitle}
                                onClose={() => {
                                    removeToast(toast.id);
                                    return false;
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}
