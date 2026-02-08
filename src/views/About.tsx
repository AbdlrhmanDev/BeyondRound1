'use client';

import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, Quote, ArrowRight } from "lucide-react";
import { EMAILS } from "@/constants/emails";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const About = () => {
  const { t } = useTranslation('about');
  const values = [
    { icon: Users, titleKey: "verifiedCommunity", descKey: "verifiedCommunityDesc" },
    { icon: Heart, titleKey: "beyondMedicine", descKey: "beyondMedicineDesc" },
    { icon: Shield, titleKey: "safeAndPrivate", descKey: "safeAndPrivateDesc" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <Heart size={14} />
                {t("ourStory")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                {t("bornFrom")}
                <span className="text-emerald-600">{t("lateNightShift")}</span>
              </h1>
              <p className="text-xl text-gray-600">{t("buildingConnections")}</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative bg-white border border-gray-200 shadow-sm rounded-2xl p-10 lg:p-14">
                <Quote className="absolute top-8 left-8 w-16 h-16 text-emerald-100" />
                <div className="relative z-10 space-y-6 text-lg text-gray-600 leading-relaxed">
                  <p>{t("storyP1")}</p>
                  <p>
                    {t("storyP2")}{" "}
                    <span className="font-semibold text-gray-900">{t("storyP2Bold")}</span>
                  </p>
                  <p>{t("storyP3")}</p>
                  <p>
                    {t("storyP4")}{" "}
                    <span className="font-semibold text-gray-900">{t("storyP4Bold")}</span>
                  </p>
                  <p className="text-gray-900 font-medium text-xl">{t("storyP5")}</p>
                </div>
                <div className="mt-10 pt-10 border-t border-gray-200 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-display font-bold text-2xl">
                    DR
                  </div>
                  <div>
                    <p className="font-display font-bold text-gray-900 text-lg">{t("founder")}</p>
                    <p className="text-gray-500">{t("founderTitle")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="p-10 lg:p-14 rounded-2xl bg-emerald-600 text-white text-center">
                <Shield className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-6">{t("ourMission")}</h2>
                <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">{t("missionText")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {t("whatWeStandFor")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <div key={index} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 text-center hover:border-emerald-200 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <value.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{t(value.titleKey)}</h3>
                  <p className="text-gray-600 leading-relaxed">{t(value.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{t("ctaText")}</p>
            <p className="text-gray-500 mb-6">
              {t("interestedInTeam")}{" "}
              <a href={`mailto:${EMAILS.team}`} className="text-emerald-600 hover:underline font-medium">{EMAILS.team}</a>
            </p>
            <LocalizedLink to="/auth">
              <Button className="group text-base h-14 px-8">
                {t("getStarted", { ns: "common" })}
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
