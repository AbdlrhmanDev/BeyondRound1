'use client';

import { Users, Calendar, MapPin, ArrowRight, Shield, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";
import { WAITLIST_URL } from "@/lib/waitlist";

const LearnMore = () => {
  const { t } = useTranslation();

  const steps = [
    { step: "1", icon: Users, titleKey: "learnMore.step1Title", descKey: "learnMore.step1Desc" },
    { step: "2", icon: Calendar, titleKey: "learnMore.step2Title", descKey: "learnMore.step2Desc" },
    { step: "3", icon: MapPin, titleKey: "learnMore.step3Title", descKey: "learnMore.step3Desc" },
  ];

  const values = [
    { icon: Shield, titleKey: "learnMore.verifiedCommunity", descKey: "learnMore.verifiedCommunityDesc" },
    { icon: Heart, titleKey: "learnMore.realConnections", descKey: "learnMore.realConnectionsDesc" },
    { icon: Users, titleKey: "learnMore.curatedMatches", descKey: "learnMore.curatedMatchesDesc" },
  ];

  return (
    <div className="min-h-screen bg-[#F6F1EC]">

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">
            {t("learnMore.howItWorks")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            {t("learnMore.findYourTribe")}{" "}
            <span className="text-[#F27C5C]">{t("learnMore.oneMatchAtATime")}</span>
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed">
            {t("learnMore.subtitle")}
          </p>
        </div>
      </section>

      {/* How it works — steps */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-8">
          {t("learnMore.howBeyondRoundsWorks")}
        </h2>
        <div className="space-y-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="flex gap-4 items-start bg-white/60 border border-[#E8DED5] rounded-[18px] p-5 shadow-[0_1px_4px_rgba(58,11,34,0.03)]"
            >
              <div className="h-9 w-9 rounded-full bg-[#F27C5C] text-white font-bold text-sm flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="h-4 w-4 text-[#F27C5C]" />
                  <h3 className="font-semibold text-[#3A0B22]">{t(item.titleKey)}</h3>
                </div>
                <p className="text-sm text-[#5E555B] leading-relaxed">{t(item.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our values — dark section */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-10">
            Why BeyondRounds works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {values.map((item, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#F27C5C]/15 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-[#F27C5C]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{t(item.titleKey)}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl py-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)] text-center">
          <p className="text-lg text-[#5E555B] mb-8 max-w-xl mx-auto leading-relaxed">
            {t("learnMore.ctaText")}
          </p>
          <a
            href={WAITLIST_URL}
            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-base transition-all active:scale-[0.98] shadow-sm"
          >
            {t("getStarted")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          <p className="mt-6 text-sm text-[#5E555B]/60">
            <LocalizedLink to="/faq" className="underline hover:text-[#3A0B22] transition-colors">
              {t("faq")}
            </LocalizedLink>
            {" · "}
            <LocalizedLink to="/about" className="underline hover:text-[#3A0B22] transition-colors">
              {t("learnMore.aboutUs")}
            </LocalizedLink>
          </p>
        </div>
      </section>

    </div>
  );
};

export default LearnMore;
