'use client';

import { Coffee, UtensilsCrossed, Footprints } from "lucide-react";

interface SuggestedPlansProps {
  enabled: boolean;
  onPropose?: (plan: string) => void;
}

const PLANS = [
  {
    id: "cafe",
    title: "Café",
    subtitle: "Relaxed afternoon",
    icon: Coffee,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-700",
    imageAlt: "Café — relaxed afternoon meetup",
  },
  {
    id: "brunch",
    title: "Brunch",
    subtitle: "Classic weekend",
    icon: UtensilsCrossed,
    bgColor: "bg-rose-50",
    iconColor: "text-rose-700",
    imageAlt: "Brunch table — classic weekend meetup",
  },
  {
    id: "walk",
    title: "Walk",
    subtitle: "Active & easy",
    icon: Footprints,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-700",
    imageAlt: "Casual walk — active meetup",
  },
];

export default function SuggestedPlans({ enabled, onPropose }: SuggestedPlansProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Things to do together
      </p>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 scrollbar-hide">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`
              flex-shrink-0 w-[140px] snap-start bg-card rounded-[18px] border border-border shadow-sm overflow-hidden
              transition-opacity duration-200
              ${enabled ? "" : "opacity-50 pointer-events-none"}
            `}
          >
            {/* Image placeholder */}
            <div
              className={`h-[100px] ${plan.bgColor} flex items-center justify-center`}
              role="img"
              aria-label={plan.imageAlt}
            >
              <plan.icon className={`h-10 w-10 ${plan.iconColor} opacity-60`} />
            </div>

            {/* Content */}
            <div className="p-3 space-y-1.5">
              <p className="font-heading text-sm font-semibold text-foreground">{plan.title}</p>
              <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
              {enabled ? (
                <button
                  onClick={() => onPropose?.(plan.id)}
                  className="text-xs text-accent font-semibold min-h-[44px] flex items-center"
                >
                  Propose
                </button>
              ) : (
                <p className="text-[10px] text-muted-foreground/60 pt-1">Available after match</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
