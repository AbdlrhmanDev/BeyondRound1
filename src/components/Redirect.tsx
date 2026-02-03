'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectProps {
  to: string;
  replace?: boolean;
}

/**
 * Client-side redirect component. Use for conditional redirects (e.g. auth).
 */
export function Redirect({ to, replace = false }: RedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);

  return null;
}
