'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface IdleDeferProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Max ms to wait before showing children if idle never comes (e.g. slow devices). Default 2000. */
  timeoutMs?: number;
}

/**
 * Renders children only after requestIdleCallback (or timeout), to avoid long main-thread tasks
 * and reduce JavaScript execution time. Use for below-the-fold content.
 */
export function IdleDefer({ children, fallback = null, timeoutMs = 2000 }: IdleDeferProps) {
  const [defer, setDefer] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDefer(false), timeoutMs);
    const id =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(() => setDefer(false), { timeout: timeoutMs })
        : 0;

    return () => {
      clearTimeout(timeout);
      if (typeof cancelIdleCallback !== 'undefined' && id) cancelIdleCallback(id);
    };
  }, [timeoutMs]);

  if (defer) return <>{fallback}</>;
  return <>{children}</>;
}
