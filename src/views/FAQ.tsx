'use client';

import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EMAILS } from "@/constants/emails";

const FAQ = () => {
  const { t } = useTranslation('faq');
  useEffect(() => {
    document.title = `${t("title")} | ${t("brand", { ns: "common" })}`;
    return () => {
      document.title = t("brand", { ns: "common" });
    };
  }, [t]);

  const faqData = [
    { categoryKey: "general", items: [["q1", "a1"], ["q2", "a2"], ["q3", "a3"]] },
    { categoryKey: "matching", items: [["q4", "a4"], ["q5", "a5"], ["q6", "a6"]] },
    { categoryKey: "meetings", items: [["q7", "a7"], ["q8", "a8"], ["q9", "a9"]] },
    { categoryKey: "pricingCat", items: [["q10", "a10"], ["q11", "a11"], ["q12", "a12"]] },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <HelpCircle size={14} />
                {t("faq", { ns: "common" })}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                {t("frequentlyAsked")}{" "}
                <span className="text-emerald-600">{t("questions")}</span>
              </h1>
              <p className="text-xl text-gray-600">
                {t("subtitle")}
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-12">
              {faqData.map((section, idx) => (
                <div key={idx}>
                  <h2 className="font-display text-2xl font-bold text-emerald-600 mb-6">{t(section.categoryKey)}</h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {section.items.map(([qKey, aKey], itemIdx) => (
                      <AccordionItem
                        key={itemIdx}
                        value={`${idx}-${itemIdx}`}
                        className="bg-white border border-gray-200 rounded-2xl px-6 data-[state=open]:border-emerald-200 shadow-sm"
                      >
                        <AccordionTrigger className="text-left font-display font-semibold text-gray-900 hover:no-underline py-5 text-lg">
                          {t(qKey)}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 pb-5 text-base leading-relaxed">
                          {t(aKey)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            <div className="mt-16 max-w-xl mx-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{t("stillHaveQuestions")}</h3>
                <p className="text-gray-600 mb-6">{t("weAreHereToHelp")}</p>
                <a href={`mailto:${EMAILS.support}`}>
                  <Button className="h-12 px-6 group">
                    {t("contactSupport")}
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
