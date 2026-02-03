'use client';

/**
 * Loads Vercel Analytics only after page is interactive.
 * Reduces main-thread work on mobile for better TBT/LCP.
 */
import { useEffect, useState } from "react";

const DeferredAnalytics = () => {
  const [Analytics, setAnalytics] = useState<React.ComponentType<{ mode?: string }> | null>(null);

  useEffect(() => {
    // Defer until after paint + idle to avoid blocking main thread
    const load = () => {
      import("@vercel/analytics/react").then((mod) => {
        setAnalytics(() => mod.Analytics);
      });
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(load, { timeout: 3000 });
    } else {
      setTimeout(load, 2000);
    }
  }, []);

  if (!Analytics) return null;
  return <Analytics mode="production" />;
};

export default DeferredAnalytics;
