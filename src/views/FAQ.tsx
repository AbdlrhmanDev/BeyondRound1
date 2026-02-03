'use client';

import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EMAILS } from "@/constants/emails";

const FAQ = () => {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${t("faq.title")} | ${t("common.brand")}`;
    return () => {
      document.title = t("common.brand");
    };
  }, [t]);

  const faqData = [
    { categoryKey: "faq.general", items: [["faq.q1", "faq.a1"], ["faq.q2", "faq.a2"], ["faq.q3", "faq.a3"]] },
    { categoryKey: "faq.matching", items: [["faq.q4", "faq.a4"], ["faq.q5", "faq.a5"], ["faq.q6", "faq.a6"]] },
    { categoryKey: "faq.meetings", items: [["faq.q7", "faq.a7"], ["faq.q8", "faq.a8"], ["faq.q9", "faq.a9"]] },
    { categoryKey: "faq.pricingCat", items: [["faq.q10", "faq.a10"], ["faq.q11", "faq.a11"], ["faq.q12", "faq.a12"]] },
  ];

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <HelpCircle size={14} className="text-primary" />
                {t("common.faq")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("faq.frequentlyAsked")}{" "}
                <span className="text-gradient-gold">{t("faq.questions")}</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                {t("faq.subtitle")}
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-12">
              {faqData.map((section, idx) => (
                <div key={idx}>
                  <h2 className="font-display text-2xl font-bold text-primary mb-6">{t(section.categoryKey)}</h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {section.items.map(([qKey, aKey], itemIdx) => (
                      <AccordionItem
                        key={itemIdx}
                        value={`${idx}-${itemIdx}`}
                        className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl px-6 data-[state=open]:border-primary/30"
                      >
                        <AccordionTrigger className="text-left font-display font-semibold text-primary-foreground hover:no-underline py-5 text-lg">
                          {t(qKey)}
                        </AccordionTrigger>
                        <AccordionContent className="text-primary-foreground/60 pb-5 text-base leading-relaxed">
                          {t(aKey)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            <div className="mt-16 max-w-xl mx-auto">
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 text-center">
                <h3 className="font-display text-xl font-bold text-primary-foreground mb-3">{t("faq.stillHaveQuestions")}</h3>
                <p className="text-primary-foreground/60 mb-6">{t("faq.weAreHereToHelp")}</p>
                <a href={`mailto:${EMAILS.support}`}>
                  <Button className="h-12 px-6 group">
                    {t("faq.contactSupport")}
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQ;
