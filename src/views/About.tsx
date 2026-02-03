'use client';

import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, Sparkles, Quote, ArrowRight } from "lucide-react";
import { EMAILS } from "@/constants/emails";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const About = () => {
  const { t } = useTranslation();
  const values = [
    { icon: Users, titleKey: "about.verifiedCommunity", descKey: "about.verifiedCommunityDesc" },
    { icon: Heart, titleKey: "about.beyondMedicine", descKey: "about.beyondMedicineDesc" },
    { icon: Shield, titleKey: "about.safeAndPrivate", descKey: "about.safeAndPrivateDesc" },
  ];

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Heart size={14} className="text-primary" />
                {t("about.ourStory")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("about.bornFrom")}
                <span className="text-gradient-gold">{t("about.lateNightShift")}</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">{t("about.buildingConnections")}</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-10 lg:p-14">
                <Quote className="absolute top-8 left-8 w-16 h-16 text-primary/20" />
                <div className="relative z-10 space-y-6 text-lg text-primary-foreground/60 leading-relaxed">
                  <p>{t("about.storyP1")}</p>
                  <p>
                    {t("about.storyP2")}{" "}
                    <span className="font-semibold text-primary-foreground">{t("about.storyP2Bold")}</span>
                  </p>
                  <p>{t("about.storyP3")}</p>
                  <p>
                    {t("about.storyP4")}{" "}
                    <span className="font-semibold text-primary-foreground">{t("about.storyP4Bold")}</span>
                  </p>
                  <p className="text-primary-foreground font-medium text-xl">{t("about.storyP5")}</p>
                </div>
                <div className="mt-10 pt-10 border-t border-primary-foreground/10 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shadow-glow-sm">
                    DR
                  </div>
                  <div>
                    <p className="font-display font-bold text-primary-foreground text-lg">{t("about.founder")}</p>
                    <p className="text-primary-foreground/50">{t("about.founderTitle")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="p-10 lg:p-14 rounded-3xl bg-gradient-gold text-primary-foreground text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-6">{t("about.ourMission")}</h2>
                <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">{t("about.missionText")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">
                {t("about.whatWeStandFor")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <div key={index} className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 text-center hover:border-primary/30 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm">
                    <value.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary-foreground mb-3">{t(value.titleKey)}</h3>
                  <p className="text-primary-foreground/60 leading-relaxed">{t(value.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-primary-foreground/60 mb-8 max-w-2xl mx-auto">{t("about.ctaText")}</p>
            <p className="text-primary-foreground/50 mb-6">
              {t("about.interestedInTeam")}{" "}
              <a href={`mailto:${EMAILS.team}`} className="text-primary hover:underline font-medium">{EMAILS.team}</a>
            </p>
            <LocalizedLink to="/auth">
              <Button className="group text-base h-14 px-8">
                {t("common.getStarted")}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </LocalizedLink>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
