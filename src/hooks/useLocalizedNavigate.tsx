'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Get locale from pathname
function getLocaleFromPath(pathname: string): string {
  const match = pathname?.match(/^\/(de|en)/);
  return match ? match[1] : 'de';
}

/**
 * Hook that provides localized navigation for Next.js
 * Compatible API with the previous React Router based implementation
 */
export function useLocalizedNavigate() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === 'number') {
        if (to === -1) router.back();
        return;
      }
      if (to.startsWith('http') || to.startsWith('mailto:')) {
        window.location.href = to;
        return;
      }
      const locale = getLocaleFromPath(pathname || '');
      const normalizedPath = to.startsWith('/') ? to : `/${to}`;
      const hasLocale = /^\/(de|en)/.test(normalizedPath);
      const localizedPath = hasLocale ? normalizedPath : `/${locale}${normalizedPath}`;

      if (options?.replace) {
        router.replace(localizedPath);
      } else {
        router.push(localizedPath);
      }
    },
    [router, pathname]
  );

  return navigate;
}

/**
 * Hook to get current locale from pathname
 */
export function useCurrentLocale(): string {
  const pathname = usePathname();
  const match = pathname?.match(/^\/(de|en)/);
  return match ? match[1] : 'de';
}

/**
 * Hook to get navigation params from current pathname
 */
export function useNavigationParams() {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];

  // Extract common params
  const locale = segments[0] || 'de';

  // For dynamic routes like /chat/[conversationId], extract the ID
  const params: Record<string, string> = { locale };

  // Handle chat routes
  if (segments.includes('chat') || segments.includes('group-chat')) {
    const chatIndex = segments.findIndex(s => s === 'chat' || s === 'group-chat');
    if (chatIndex >= 0 && segments[chatIndex + 1]) {
      params.conversationId = segments[chatIndex + 1];
    }
  }

  // Handle user profile routes
  if (segments.includes('u')) {
    const uIndex = segments.indexOf('u');
    if (uIndex >= 0 && segments[uIndex + 1]) {
      params.userId = segments[uIndex + 1];
    }
  }

  return params;
}
