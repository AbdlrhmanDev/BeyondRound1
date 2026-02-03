'use client';

import { useTranslation } from "react-i18next";
import { EMAILS } from "@/constants/emails";
import { Shield, Lock, Eye, Database } from "lucide-react";

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Shield size={14} className="text-primary" />
                {t("privacyPage.legal")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("privacyPage.title")}{" "}
                <span className="text-gradient-gold">{t("privacyPage.titleHighlight")}</span>
              </h1>
              <p className="text-primary-foreground/60">{t("privacyPage.lastUpdated")}</p>
            </div>

            {/* Privacy Highlight */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-gradient-gold rounded-3xl p-8 text-primary-foreground text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-80" />
                <h2 className="font-display text-2xl font-bold mb-3">{t("privacyPage.highlightTitle")}</h2>
                <p className="opacity-90 leading-relaxed">
                  {t("privacyPage.highlightBody")}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 lg:p-12 space-y-10">
                
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-primary-foreground">{t("privacyPage.section1Title")}</h2>
                  </div>
                  
                  <div className="space-y-6 pl-13">
                    <div>
                      <h3 className="font-semibold text-primary-foreground mb-3">{t("privacyPage.section1AccountTitle")}</h3>
                      <ul className="text-primary-foreground/60 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Account1")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Account2")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Account3")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Account4")}
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-primary-foreground mb-3">{t("privacyPage.section1PrefsTitle")}</h3>
                      <ul className="text-primary-foreground/60 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Prefs1")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Prefs2")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Prefs3")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Prefs4")}
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-primary-foreground mb-3">{t("privacyPage.section1UsageTitle")}</h3>
                      <ul className="text-primary-foreground/60 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Usage1")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Usage2")}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          {t("privacyPage.section1Usage3")}
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-primary-foreground">{t("privacyPage.section2Title")}</h2>
                  </div>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section2Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section2Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section2Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section2Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-primary-foreground">{t("privacyPage.section3Title")}</h2>
                  </div>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section3Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section3Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section3Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section3Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("privacyPage.section4Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("privacyPage.section4Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("privacyPage.section5Title")}</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section5Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section5Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section5Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("privacyPage.section5Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("privacyPage.section6Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("privacyPage.section6Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("privacyPage.section7Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("privacyPage.section7Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("privacyPage.section8Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("privacyPage.section8Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("privacyPage.section9Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("privacyPage.section9Body")}{" "}
                    <a href={`mailto:${EMAILS.contact}`} className="text-primary hover:underline font-medium">
                      {EMAILS.contact}
                    </a>
                  </p>
                </section>

              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Privacy;
