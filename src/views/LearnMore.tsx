'use client';

import { Button } from "@/components/ui/button";
import { Users, Calendar, MapPin, ArrowRight, Shield, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

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
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <Shield size={14} className="text-emerald-600" />
                {t("learnMore.howItWorks")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                {t("learnMore.findYourTribe")}{" "}
                <span className="text-emerald-600">{t("learnMore.oneMatchAtATime")}</span>
              </h1>
              <p className="text-xl text-gray-600">
                {t("learnMore.subtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              {t("learnMore.howBeyondRoundsWorks")}
            </h2>
            <div className="max-w-4xl mx-auto space-y-12">
              {steps.map((item) => (
                <div key={item.step} className="flex gap-6 p-6 lg:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-display font-bold text-xl">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon className="w-6 h-6 text-emerald-600" />
                      <h3 className="font-display text-xl font-bold text-gray-900">{t(item.titleKey)}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 text-center hover:border-emerald-200 transition-all">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm text-gray-600">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t("learnMore.ctaText")}
            </p>
            <LocalizedLink to="/auth">
              <Button className="group text-base h-14 px-8">
                {t("getStarted")}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </LocalizedLink>
            <p className="mt-4 text-sm text-gray-400">
              <LocalizedLink to="/faq" className="underline hover:text-gray-600">{t("faq")}</LocalizedLink>
              {" · "}
              <LocalizedLink to="/about" className="underline hover:text-gray-600">{t("learnMore.aboutUs")}</LocalizedLink>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LearnMore;
