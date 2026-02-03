'use client';

import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const Pricing = () => {
  const { t } = useTranslation();
  const plans = [
    {
      nameKey: "pricing.oneTimeTrial",
      priceKey: "pricing.trialPrice",
      periodKey: "pricing.perMonth",
      periodValue: "",
      descKey: "pricing.trialDesc",
      featuresKey: "pricing.trialFeatures",
      ctaKey: "pricing.startTrial",
      popular: false,
    },
    {
      nameKey: "pricing.monthly",
      priceKey: "pricing.monthlyPrice",
      periodKey: "pricing.perMonth",
      periodValue: t("pricing.perMonth"),
      descKey: "pricing.monthlyDesc",
      featuresKey: "pricing.monthlyFeatures",
      ctaKey: "pricing.subscribeMonthly",
      popular: true,
    },
    {
      nameKey: "pricing.premium",
      priceKey: "pricing.premiumPrice",
      periodKey: "pricing.perMonth",
      periodValue: t("pricing.perMonth"),
      descKey: "pricing.premiumDesc",
      featuresKey: "pricing.premiumFeatures",
      ctaKey: "pricing.goPremium",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Zap size={14} className="text-primary" />
                {t("pricing.membershipPlans")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("pricing.simpleTransparent")}
              </h1>
              <p className="text-xl text-primary-foreground/60">
                {t("pricing.noHiddenFees")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const features = t(plan.featuresKey, { returnObjects: true }) as string[];
                return (
                  <div
                    key={plan.nameKey}
                    className={cn(
                      "relative rounded-2xl overflow-hidden p-6 transition-all duration-300",
                      plan.popular
                        ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-lg shadow-primary/10 scale-[1.02] lg:scale-105 z-10"
                        : "bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 hover:border-primary-foreground/20"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 py-2 bg-primary text-primary-foreground text-center text-sm font-semibold flex items-center justify-center gap-2">
                        <Star size={14} fill="currentColor" />
                        {t("pricing.mostPopular")}
                      </div>
                    )}

                    <div className={plan.popular ? "pt-10" : ""}>
                      <h3 className="font-display text-xl font-bold mb-3 text-primary-foreground">
                        {t(plan.nameKey)}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="number-display text-4xl text-primary-foreground">
                          {t(plan.priceKey)}
                        </span>
                        <span className="text-sm font-medium text-primary-foreground/50">
                          {plan.periodValue}
                        </span>
                      </div>
                      <p className="text-sm text-primary-foreground/60">
                        {t(plan.descKey)}
                      </p>
                    </div>

                    <ul className="space-y-3 my-6">
                      {Array.isArray(features) && features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              plan.popular ? "bg-primary" : "bg-primary/20"
                            )}
                          >
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                          <span className="text-sm leading-relaxed text-primary-foreground/70">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <LocalizedLink to="/auth">
                      <Button
                        className={cn(
                          "w-full font-semibold rounded-xl h-11",
                          plan.popular
                            ? "bg-primary hover:opacity-90 text-primary-foreground"
                            : "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/10"
                        )}
                      >
                        {t(plan.ctaKey)}
                      </Button>
                    </LocalizedLink>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;
