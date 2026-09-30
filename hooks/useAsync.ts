"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  key: string | null;
  data?: T;
  error?: Error;
}

/**
 * Run an async loader whenever `key` changes.
 * Keeps the previous data while a new request is in flight, which keeps
 * week-to-week map animations smooth.
 */
export function useAsync<T>(loader: () => Promise<T>, key: string) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<AsyncState<T>>({ key: null });
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const fullKey = `${key}#${nonce}`;

  useEffect(() => {
    let alive = true;
    loaderRef.current().then(
      (data) => alive && setState({ key: fullKey, data }),
      (err: unknown) => alive && setState((s) => ({ key: fullKey, data: s.data, error: err instanceof Error ? err : new Error(String(err)) })),
    );
    return () => {
      alive = false;
    };
  }, [fullKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const loading = state.key !== fullKey;
  return { data: state.data, error: loading ? undefined : state.error, loading, reload };
}
