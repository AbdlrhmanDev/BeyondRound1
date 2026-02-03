'use client';

/**
 * Loads Vercel Speed Insights after page is interactive.
 * Keeps main-thread work and JS execution low (requestIdleCallback).
 */
import { useEffect, useState } from 'react';

export function DeferredSpeedInsights() {
  const [SpeedInsights, setSpeedInsights] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const load = () => {
      import('@vercel/speed-insights/next').then((mod) => {
        setSpeedInsights(() => mod.SpeedInsights);
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 4000 });
    } else {
      setTimeout(load, 2000);
    }
  }, []);

  if (!SpeedInsights) return null;
  return <SpeedInsights />;
}
