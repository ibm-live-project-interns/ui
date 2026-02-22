/**
 * Copyright IBM Corp. 2026
 *
 * useFormModal Hook
 * Manages modal open/close state together with form values and submission status.
 * Useful for create/edit modals that need pre-fill, reset, and loading state.
 */

import { useState, useCallback, useRef } from 'react';

export interface UseFormModalResult<T extends Record<string, unknown>> {
  isOpen: boolean;
  open: (prefill?: Partial<T>) => void;
  close: () => void;
  values: T;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  reset: () => void;
  isSubmitting: boolean;
  setSubmitting: (v: boolean) => void;
}

export function useFormModal<T extends Record<string, unknown>>(initialValues: T): UseFormModalResult<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<T>({ ...initialValues });
  const [isSubmitting, setSubmitting] = useState(false);

  // Keep a stable reference to initialValues for reset/open
  const initialRef = useRef(initialValues);
  initialRef.current = initialValues;

  const open = useCallback((prefill?: Partial<T>) => {
    setValues({ ...initialRef.current, ...prefill });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSubmitting(false);
  }, []);

  const reset = useCallback(() => {
    setValues({ ...initialRef.current });
  }, []);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { isOpen, open, close, values, setField, reset, isSubmitting, setSubmitting };
}
