'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EMAILS } from "@/constants/emails";
import Link from "next/link";

const faqData = [
  {
    category: "Getting started",
    items: [
      { q: "What is BeyondRounds?", a: "BeyondRounds is a curated social platform exclusively for verified doctors. We match you with small groups of 3–4 physicians in your city for relaxed weekend meetups — coffee, brunch, walks. No networking agendas, just genuine connection." },
      { q: "How do I join?", a: "Create an account, complete your profile, and submit your medical license for verification. Once verified, you can choose a weekend day and get matched with your first group." },
      { q: "Is BeyondRounds only for doctors?", a: "Yes. Every member goes through medical license verification. This ensures a trusted, peer-only community where everyone shares the unique experience of working in medicine." },
      { q: "Which cities are available?", a: "We're currently live in Berlin, with more German cities launching soon. Join the waitlist if your city isn't available yet — we'll notify you when we arrive." },
    ],
  },
  {
    category: "Matching & meetups",
    items: [
      { q: "How does matching work?", a: "Each week, you choose a day (Friday, Saturday, or Sunday). By Thursday, we match you with 2–3 other doctors based on interests, vibe, and availability. A private group chat opens so you can connect before meeting." },
      { q: "What happens at a meetup?", a: "Meetups are relaxed, low-pressure gatherings — typically coffee, brunch, or a casual walk. We suggest a venue; you and your group decide. No formal agenda, just good company." },
      { q: "Can I choose who I'm matched with?", a: "Not directly, but your profile preferences (interests, personality, preferred vibe) guide our matching. Over time, the algorithm learns what works best for you." },
      { q: "What if I can't make it?", a: "Free cancellation until Wednesday at 9 pm. After that, your spot is reserved and no-shows may be charged. Just let us know in advance if plans change." },
    ],
  },
  {
    category: "Safety & verification",
    items: [
      { q: "How is verification done?", a: "We verify every member's medical license through official registries. This process typically takes 24–48 hours. You can use the app during verification, but matching begins only after approval." },
      { q: "Is my data safe?", a: "Absolutely. We follow GDPR standards, use encrypted connections, and never share your personal information with third parties. Your medical license details are used solely for verification and are stored securely." },
      { q: "What if I have a bad experience?", a: "We take community safety seriously. Use the in-app reporting tool to flag any concerns. Our team reviews every report promptly and takes appropriate action." },
    ],
  },
  {
    category: "Founding access",
    items: [
      { q: "What is founding member access?", a: "Early members get founding status — priority matching, direct input on features, and a permanent founding badge on their profile. It's our way of thanking the community that helps shape BeyondRounds." },
      { q: "Will there be a cost later?", a: "We're currently in a founding phase. Details about future plans will be shared transparently with the community well in advance." },
    ],
  },
];

const FAQ = () => {
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
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">FAQ</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            Everything you need to know.
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed">
            Can't find what you're looking for? Reach out to our team anytime.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20 space-y-10">
        {faqData.map((section, sIdx) => (
          <div key={sIdx}>
            <h2 className="font-display text-xl font-bold text-[#3A0B22] mb-4">{section.category}</h2>
            <div className="space-y-3">
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} className="bg-white/60 border border-[#E8DED5] rounded-[18px] overflow-hidden shadow-[0_1px_4px_rgba(58,11,34,0.03)]">
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
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still have questions */}
        <div className="bg-[#3A0B22] rounded-[24px] p-8 sm:p-10 text-center">
          <h3 className="font-display text-2xl font-bold text-white mb-3">Still have questions?</h3>
          <p className="text-white/60 mb-6">We're here to help. Reach out anytime.</p>
          <a
            href={`mailto:${EMAILS.support}`}
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-sm transition-all active:scale-[0.98] shadow-sm"
          >
            Contact support
          </a>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
