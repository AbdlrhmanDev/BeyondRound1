import { useMemo } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getPlanTier,
  getFeaturesForTier,
  hasFeature as checkFeature,
  type PlanTier,
  type PlanFeatureFlags,
} from "@/constants/planFeatures";

export type { PlanTier, PlanFeatureFlags };

/**
 * Derives plan tier and feature flags from subscription.
 * Use for gating UI and backend (e.g. filter by specialty = Premium only).
 */
export function usePlanFeatures() {
  const { subscription, loading } = useSubscription();

  const planTier = useMemo<PlanTier>(
    () => getPlanTier(subscription?.plan_name ?? null),
    [subscription?.plan_name]
  );

  const features = useMemo<PlanFeatureFlags>(
    () => getFeaturesForTier(planTier),
    [planTier]
  );

  const hasFeature = useMemo(
    () => (feature: keyof PlanFeatureFlags) => checkFeature(planTier, feature),
    [planTier]
  );

  const isPaidPlan = planTier !== "none";

  return {
    planTier,
    features,
    hasFeature,
    isPaidPlan,
    isLoading: loading,
    planName: subscription?.plan_name ?? null,
  };
}
