'use client';

/**
 * FAQ section - client only for Accordion interactivity.
 * Receives pre-translated strings - no i18next.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { EMAILS } from '@/constants/emails';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionClientProps {
  items: FAQItem[];
  faqLabel: string;
  gotQuestions: string;
  subtitle: string;
  contactSupportTeam: string;
}

export function FAQSectionClient({
  items,
  faqLabel,
  gotQuestions,
  subtitle,
  contactSupportTeam,
}: FAQSectionClientProps) {
  return (
    <section id="faq" className="py-28 lg:py-36 bg-foreground dark:bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
              <HelpCircle size={14} className="text-primary" />
              {faqLabel}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight mb-6">
              <span className="text-gradient-gold">{gotQuestions}</span>
            </h2>
            <p className="text-xl text-primary-foreground/60 mb-8 leading-relaxed">{subtitle}</p>
            <a
              href={`mailto:${EMAILS.support}`}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group"
            >
              {contactSupportTeam}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="space-y-4">
            <Accordion type="single" collapsible>
              {items.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl px-6 mb-4 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-primary-foreground hover:no-underline py-5 text-lg">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-primary-foreground/60 pb-5 text-base leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
