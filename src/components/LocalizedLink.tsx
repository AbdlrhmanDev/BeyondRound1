'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

// Get locale from pathname
function getLocaleFromPath(pathname: string): string {
  const match = pathname?.match(/^\/(de|en)/);
  return match ? match[1] : 'de';
}

interface LocalizedLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  to: string;
  children?: ReactNode;
}

/**
 * Link that prepends current locale to internal paths. Use for in-app navigation.
 * External URLs (http/https) and hash-only are left unchanged.
 *
 * Compatible with both React Router and Next.js patterns.
 */
const LocalizedLink = ({ to, children, ...props }: LocalizedLinkProps) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname || '');

  const resolvedHref = (() => {
    if (typeof to === "string") {
      // Don't modify external links, mailto, or hash-only links
      if (to.startsWith("http") || to.startsWith("mailto:") || to === "" || to === "#") {
        return to;
      }
      // Ensure path starts with /
      const path = to.startsWith('/') ? to : `/${to}`;
      // Check if path already has locale
      const hasLocale = /^\/(de|en)/.test(path);
      return hasLocale ? path : `/${locale}${path}`;
    }
    return to;
  })();

  return <Link href={resolvedHref} {...props}>{children}</Link>;
};

export default LocalizedLink;
