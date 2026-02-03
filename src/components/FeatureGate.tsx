'use client';

import { type ReactNode } from "react";
import LocalizedLink from "@/components/LocalizedLink";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import type { PlanFeatureFlags } from "@/constants/planFeatures";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface FeatureGateProps {
  /** Feature key from plan features (e.g. filterBySpecialtyAge) */
  feature: keyof PlanFeatureFlags;
  /** Content to show when user has the feature */
  children: ReactNode;
  /** Optional: content when user doesn't have the feature (default: upgrade prompt) */
  fallback?: ReactNode;
  /** If true, show nothing when feature is locked (no fallback) */
  hideWhenLocked?: boolean;
}

/**
 * Renders children only when the user's plan includes the given feature.
 * Otherwise renders fallback or a default upgrade prompt.
 */
export function FeatureGate({ feature, children, fallback, hideWhenLocked }: FeatureGateProps) {
  const { hasFeature, isLoading } = usePlanFeatures();

  if (isLoading) {
    return null;
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (hideWhenLocked) {
    return null;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2 text-primary-foreground/70">
        <Lock className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">This feature is available on a higher plan.</span>
      </div>
      <LocalizedLink to="/pricing">
        <Button variant="outline" size="sm" className="shrink-0">
          View plans
        </Button>
      </LocalizedLink>
    </div>
  );
}
