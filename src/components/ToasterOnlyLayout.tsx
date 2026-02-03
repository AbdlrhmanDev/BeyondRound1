'use client';

/**
 * Toaster only - for Contact/Waitlist. NOT on home. Reduces hydration on landing.
 */
import { useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('@/components/ui/toaster').then((m) => ({ default: m.Toaster })), { ssr: false });

export function ToasterOnlyLayout({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {children}
      {show && <Toaster />}
    </>
  );
}
