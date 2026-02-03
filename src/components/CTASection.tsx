'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Calendar, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const CTASection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-28 lg:py-36 bg-foreground dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[200px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-8">
            <Sparkles size={14} className="text-primary" />
            {t("home.joinCommunity")}
          </span>
          
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight text-primary-foreground">
            {t("home.readyToFind")}{" "}
            <span className="text-gradient-gold">{t("home.yourTribe")}</span>
          </h2>
          
          <p className="text-xl text-primary-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("home.ctaSubtext")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <LocalizedLink to="/onboarding">
              <Button className="group text-base h-14 px-8">
                {t("home.cta")}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </LocalizedLink>
            <Button
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-base h-14 px-8 rounded-2xl"
              asChild
            >
              <LocalizedLink to="/learn-more">{t("common.learnMore")}</LocalizedLink>
            </Button>
          </div>

          {/* Trust Stats */}
          <div className="grid sm:grid-cols-3 gap-8 pt-12 border-t border-primary-foreground/10">
            {[
              { icon: Users, value: "5,000+", labelKey: "home.verifiedDoctors" },
              { icon: Calendar, value: "12,000+", labelKey: "home.meetupsOrganized" },
              { icon: Shield, value: "30", labelKey: "home.dayGuarantee" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="number-display text-4xl lg:text-5xl text-primary-foreground mb-2">{stat.value}</p>
                <p className="text-sm text-primary-foreground/50 font-medium">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
