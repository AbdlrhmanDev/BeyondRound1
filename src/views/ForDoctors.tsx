'use client';

import { Button } from "@/components/ui/button";
import { Heart, Users, Clock, Zap, ArrowRight, MessageCircle, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const ForDoctors = () => {
  const { t } = useTranslation();
  const challenges = [
    { icon: Clock, titleKey: "forDoctors.challenge1Title", descKey: "forDoctors.challenge1Desc" },
    { icon: Users, titleKey: "forDoctors.challenge2Title", descKey: "forDoctors.challenge2Desc" },
    { icon: MessageCircle, titleKey: "forDoctors.challenge3Title", descKey: "forDoctors.challenge3Desc" },
    { icon: Heart, titleKey: "forDoctors.challenge4Title", descKey: "forDoctors.challenge4Desc" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <Shield size={14} className="text-emerald-600" />
                {t("forDoctors.forDoctors")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                {t("forDoctors.challengesTitle")}{" "}
                <span className="text-emerald-600">{t("forDoctors.faceEveryDay")}</span>
              </h1>
              <p className="text-xl text-gray-600">
                {t("forDoctors.subtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
              {t("forDoctors.soundFamiliar")}
            </h2>
            <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
              {t("forDoctors.soundFamiliarDesc")}
            </p>
            <div className="max-w-4xl mx-auto space-y-6">
              {challenges.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-6 p-6 lg:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{t(item.titleKey)}</h3>
                    <p className="text-gray-600 leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center p-10 lg:p-14 rounded-3xl bg-white border border-gray-200 shadow-sm">
              <Zap className="w-12 h-12 mx-auto mb-6 text-emerald-600" />
              <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
                {t("forDoctors.findTribeTitle")}
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                {t("forDoctors.findTribeDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="group h-14 px-8 text-base" asChild>
                  <LocalizedLink to="/survey">
                    {t("takeQuiz", { ns: "waitlist" })}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </LocalizedLink>
                </Button>
                <Button variant="outline" className="h-14 px-8 text-base" asChild>
                  <LocalizedLink to="/waitlist">{t("joinTheWaitlist", { ns: "waitlist" })}</LocalizedLink>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForDoctors;
