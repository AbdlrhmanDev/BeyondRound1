/**
 * Plan tiers and feature flags for subscription-based gating.
 * Single source of truth: align Stripe Price nicknames with these tier values.
 */

export type PlanTier = "none" | "one_time_trial" | "monthly" | "premium";

export interface PlanFeatureFlags {
  /** Weekly curated group matches */
  groupMatches: boolean;
  /** Access to private group chat */
  groupChat: boolean;
  /** RoundsBot icebreaker prompts */
  roundsBot: boolean;
  /** Basic compatibility matching */
  basicMatching: boolean;
  /** Priority in matching algorithm */
  priorityMatching: boolean;
  /** Expanded profile & interests */
  expandedProfile: boolean;
  /** Early access to new features */
  earlyAccess: boolean;
  /** Priority customer support */
  prioritySupport: boolean;
  /** Advanced lifestyle compatibility */
  advancedCompatibility: boolean;
  /** AI-powered activity suggestions */
  activitySuggestions: boolean;
  /** Match history & insights */
  matchHistoryInsights: boolean;
  /** Filter by specialty, age & more */
  filterBySpecialtyAge: boolean;
  /** Smaller group preference (2-3) */
  smallerGroupPreference: boolean;
  /** Exclusive member events */
  exclusiveEvents: boolean;
  /** Dedicated account manager */
  dedicatedSupport: boolean;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatureFlags> = {
  none: {
    groupMatches: false,
    groupChat: false,
    roundsBot: false,
    basicMatching: false,
    priorityMatching: false,
    expandedProfile: false,
    earlyAccess: false,
    prioritySupport: false,
    advancedCompatibility: false,
    activitySuggestions: false,
    matchHistoryInsights: false,
    filterBySpecialtyAge: false,
    smallerGroupPreference: false,
    exclusiveEvents: false,
    dedicatedSupport: false,
  },
  one_time_trial: {
    groupMatches: true,
    groupChat: true,
    roundsBot: true,
    basicMatching: true,
    priorityMatching: false,
    expandedProfile: false,
    earlyAccess: false,
    prioritySupport: false,
    advancedCompatibility: false,
    activitySuggestions: false,
    matchHistoryInsights: false,
    filterBySpecialtyAge: false,
    smallerGroupPreference: false,
    exclusiveEvents: false,
    dedicatedSupport: false,
  },
  monthly: {
    groupMatches: true,
    groupChat: true,
    roundsBot: true,
    basicMatching: true,
    priorityMatching: true,
    expandedProfile: true,
    earlyAccess: true,
    prioritySupport: true,
    advancedCompatibility: false,
    activitySuggestions: false,
    matchHistoryInsights: false,
    filterBySpecialtyAge: false,
    smallerGroupPreference: false,
    exclusiveEvents: false,
    dedicatedSupport: false,
  },
  premium: {
    groupMatches: true,
    groupChat: true,
    roundsBot: true,
    basicMatching: true,
    priorityMatching: true,
    expandedProfile: true,
    earlyAccess: true,
    prioritySupport: true,
    advancedCompatibility: true,
    activitySuggestions: true,
    matchHistoryInsights: true,
    filterBySpecialtyAge: true,
    smallerGroupPreference: true,
    exclusiveEvents: true,
    dedicatedSupport: true,
  },
};

/** Normalize Stripe plan_name / DB value to PlanTier */
export function getPlanTier(planName: string | null | undefined): PlanTier {
  if (planName == null || planName === "") return "none";
  const normalized = planName.toLowerCase().replace(/\s+/g, "_").trim();
  if (normalized.includes("premium")) return "premium";
  if (normalized.includes("monthly")) return "monthly";
  if (normalized.includes("one_time") || normalized.includes("one_time_trial") || normalized.includes("trial")) return "one_time_trial";
  return "none";
}

/** Get feature flags for a plan tier */
export function getFeaturesForTier(tier: PlanTier): PlanFeatureFlags {
  return PLAN_FEATURES[tier] ?? PLAN_FEATURES.none;
}

/** Check if a tier has a specific feature (type-safe key) */
export function hasFeature(
  tier: PlanTier,
  feature: keyof PlanFeatureFlags
): boolean {
  return PLAN_FEATURES[tier]?.[feature] ?? false;
}

/** Human-readable labels for each feature (for UI) */
export const FEATURE_LABELS: Record<keyof PlanFeatureFlags, string> = {
  groupMatches: "Weekly curated group matches",
  groupChat: "Access to private group chat",
  roundsBot: "RoundsBot icebreaker prompts",
  basicMatching: "Basic compatibility matching",
  priorityMatching: "Priority in matching algorithm",
  expandedProfile: "Expanded profile & interests",
  earlyAccess: "Early access to new features",
  prioritySupport: "Priority customer support",
  advancedCompatibility: "Advanced lifestyle compatibility",
  activitySuggestions: "AI-powered activity suggestions",
  matchHistoryInsights: "Match history & insights",
  filterBySpecialtyAge: "Filter by specialty, age & more",
  smallerGroupPreference: "Smaller group preference (2-3)",
  exclusiveEvents: "Exclusive member events",
  dedicatedSupport: "Dedicated account manager",
};
