'use client';

import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const Pricing = () => {
  const { t } = useTranslation('pricing');
  const plans = [
    {
      nameKey: "oneTimeTrial",
      priceKey: "trialPrice",
      periodKey: "perMonth",
      periodValue: "",
      descKey: "trialDesc",
      featuresKey: "trialFeatures",
      ctaKey: "startTrial",
      popular: false,
    },
    {
      nameKey: "monthly",
      priceKey: "monthlyPrice",
      periodKey: "perMonth",
      periodValue: t("perMonth"),
      descKey: "monthlyDesc",
      featuresKey: "monthlyFeatures",
      ctaKey: "subscribeMonthly",
      popular: true,
    },
    {
      nameKey: "premium",
      priceKey: "premiumPrice",
      periodKey: "perMonth",
      periodValue: t("perMonth"),
      descKey: "premiumDesc",
      featuresKey: "premiumFeatures",
      ctaKey: "goPremium",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <Zap size={14} className="text-emerald-600" />
                {t("membershipPlans")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                {t("simpleTransparent")}
              </h1>
              <p className="text-xl text-gray-600">
                {t("noHiddenFees")}
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
                        ? "bg-emerald-50 border-2 border-emerald-600 shadow-lg scale-[1.02] lg:scale-105 z-10"
                        : "bg-white border border-gray-200 shadow-sm hover:border-emerald-200"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 py-2 bg-emerald-600 text-white text-center text-sm font-semibold flex items-center justify-center gap-2">
                        <Star size={14} fill="currentColor" />
                        {t("mostPopular")}
                      </div>
                    )}

                    <div className={plan.popular ? "pt-10" : ""}>
                      <h3 className="font-display text-xl font-bold mb-3 text-gray-900">
                        {t(plan.nameKey)}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="number-display text-4xl text-gray-900">
                          {t(plan.priceKey)}
                        </span>
                        <span className="text-sm font-medium text-gray-500">
                          {plan.periodValue}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t(plan.descKey)}
                      </p>
                    </div>

                    <ul className="space-y-3 my-6">
                      {Array.isArray(features) && features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              plan.popular ? "bg-emerald-600" : "bg-emerald-50"
                            )}
                          >
                            <Check className={cn("w-3 h-3", plan.popular ? "text-white" : "text-emerald-600")} />
                          </div>
                          <span className="text-sm leading-relaxed text-gray-600">
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
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : ""
                        )}
                        variant={plan.popular ? "default" : "outline"}
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
