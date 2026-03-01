'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EMAILS } from "@/constants/emails";
import { ScrollAnimatedWrapper } from "@/components/landing/ScrollAnimatedWrapper";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  category: string;
  items: FAQItem[];
}

interface FAQProps {
  tt: {
    badge: string;
    headline: string;
    subheadline: string;
    stillTitle: string;
    stillSubtitle: string;
    contactButton: string;
  };
  sections: FAQSection[];
}

const FAQ = ({ tt, sections }: FAQProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">{tt.badge}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            {tt.headline}
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed">
            {tt.subheadline}
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20 space-y-10">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <h2 className="font-display text-xl font-bold text-[#3A0B22] mb-4">{section.category}</h2>
            <div className="space-y-3">
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`;
                const isOpen = openItems.has(key);
                return (
                  <ScrollAnimatedWrapper
                    key={key}
                    initial={{ opacity: 0, x: iIdx % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: iIdx * 0.1 }}
                    className="bg-white/60 border border-[#E8DED5] rounded-[18px] overflow-hidden shadow-[0_1px_4px_rgba(58,11,34,0.03)]"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between gap-3 p-5 text-left min-h-[44px]"
                    >
                      <span className="font-semibold text-[#3A0B22] text-[15px] leading-snug">{item.q}</span>
                      <ChevronDown className={`h-5 w-5 text-[#5E555B] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 -mt-1 animate-fade-in">
                        <p className="text-[#5E555B] text-sm leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </ScrollAnimatedWrapper>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still have questions */}
        <ScrollAnimatedWrapper
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="bg-[#3A0B22] rounded-[24px] p-8 sm:p-10 text-center"
        >
          <h3 className="font-display text-2xl font-bold text-white mb-3">{tt.stillTitle}</h3>
          <p className="text-white/60 mb-6">{tt.stillSubtitle}</p>
          <a
            href={`mailto:${EMAILS.support}`}
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-sm transition-all active:scale-[0.98] shadow-sm"
          >
            {tt.contactButton}
          </a>
        </ScrollAnimatedWrapper>
      </section>
    </div>
  );
};

export default FAQ;
