import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const faqKeys: [string, string][] = [
  ["faq.q1", "faq.a1"],
  ["faq.q3", "faq.a3"],
  ["faq.q4", "faq.a4"],
  ["faq.q5", "faq.a5"],
  ["faq.q7", "faq.a7"],
  ["faq.q8", "faq.a8"],
  ["faq.q12", "faq.a12"],
  ["faq.q11", "faq.a11"],
];

const FAQSection = () => {
  const { t } = useTranslation();
  return (
    <section id="faq" className="py-28 lg:py-36 bg-foreground dark:bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Header */}
          <div className="lg:sticky lg:top-32">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
              <HelpCircle size={14} className="text-primary" />
              {t("common.faq")}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight mb-6">
              <span className="text-gradient-gold">{t("faq.gotQuestions")}</span>
            </h2>
            <p className="text-xl text-primary-foreground/60 mb-8 leading-relaxed">
              {t("faq.subtitleHome")}
            </p>
            <a
              href="mailto:support@beyondrounds.com"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group"
            >
              {t("faq.contactSupportTeam")}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Column - Accordion */}
          <div className="space-y-4">
            <Accordion type="single" collapsible>
              {faqKeys.map(([qKey, aKey], index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl px-6 mb-4 data-[state=open]:border-primary/30"
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
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
