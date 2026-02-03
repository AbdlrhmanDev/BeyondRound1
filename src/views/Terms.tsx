'use client';

import { useTranslation } from "react-i18next";
import { EMAILS } from "@/constants/emails";
import LocalizedLink from "@/components/LocalizedLink";
import { FileText } from "lucide-react";

const Terms = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <FileText size={14} className="text-primary" />
                {t("termsPage.legal")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("termsPage.title")}{" "}
                <span className="text-gradient-gold">{t("termsPage.titleHighlight")}</span>
              </h1>
              <p className="text-primary-foreground/60">{t("termsPage.lastUpdated")}</p>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 lg:p-12 space-y-10">

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section1Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("termsPage.section1Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section2Title")}</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section2Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section2Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section2Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section2Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section3Title")}</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section3Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section3Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section3Item3")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section4Title")}</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section4Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section4Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section4Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section4Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section5Title")}</h2>
                  <p className="text-primary-foreground/60 mb-3">{t("termsPage.section5Intro")}</p>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section5Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section5Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section5Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section5Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section6Title")}</h2>
                  <p className="text-primary-foreground/60 mb-3">{t("termsPage.section6Intro")}</p>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      {t("termsPage.section6Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      {t("termsPage.section6Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      {t("termsPage.section6Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      {t("termsPage.section6Item4")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      {t("termsPage.section6Item5")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section7Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("termsPage.section7Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section8Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("termsPage.section8Body")}{" "}
                    <LocalizedLink to="/privacy" className="text-primary hover:underline font-medium">{t("termsPage.section8Link")}</LocalizedLink>{" "}
                    {t("termsPage.section8Suffix")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section9Title")}</h2>
                  <p className="text-primary-foreground/60 mb-3">{t("termsPage.section9Intro")}</p>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section9Item1")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section9Item2")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section9Item3")}
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      {t("termsPage.section9Item4")}
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section10Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("termsPage.section10Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section11Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("termsPage.section11Body")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">{t("termsPage.section12Title")}</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {t("termsPage.section12Body")}{" "}
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

export default Terms;
