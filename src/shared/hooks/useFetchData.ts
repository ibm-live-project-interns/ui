/**
 * Copyright IBM Corp. 2026
 *
 * useFetchData Hook
 * Generic data-fetching hook with loading/error state, AbortController cleanup,
 * and a refetch callback. Replaces the duplicated isMounted + try/catch pattern
 * across pages like PriorityAlertsPage, TrendsPage, etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseFetchDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetchData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options?: { initialData?: T; onError?: (err: Error) => void }
): UseFetchDataResult<T> {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetcherRef.current(controller.signal)
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mountedRef.current && err.name !== 'AbortError') {
          setError(err.message || 'An error occurred');
          setIsLoading(false);
          optionsRef.current?.onError?.(err);
        }
      });

    return controller;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    const controller = fetchData();
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
