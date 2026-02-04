/**
 * Static FAQ - native <details>. Zero JS. No hydration.
 */
import Link from 'next/link';
import { EMAILS } from '@/constants/emails';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionServerProps {
  items: FAQItem[];
  faqLabel: string;
  gotQuestions: string;
  subtitle: string;
  contactSupportTeam: string;
  moreFaqLabel?: string;
  locale: string;
}

export function FAQSectionServer({
  items,
  faqLabel,
  gotQuestions,
  subtitle,
  contactSupportTeam,
  moreFaqLabel = 'More FAQ',
  locale,
}: FAQSectionServerProps) {
  return (
    <section id="faq" className="py-28 lg:py-36 bg-foreground dark:bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
              <span aria-hidden>?</span>
              {faqLabel}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight mb-6">
              <span className="text-gradient-gold">{gotQuestions}</span>
            </h2>
            <p className="text-xl text-primary-foreground/60 mb-8 leading-relaxed">{subtitle}</p>
            <a
              href={`mailto:${EMAILS.support}`}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              {contactSupportTeam}
              <span aria-hidden>→</span>
            </a>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <details
                key={index}
                className="group bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl px-6 mb-4 open:border-primary/30"
              >
                <summary className="font-display font-semibold text-primary-foreground py-5 text-lg cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between">
                  {item.question}
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-primary-foreground/60 pb-5 text-base leading-relaxed">{item.answer}</p>
              </details>
            ))}
            <Link
              href={`/${locale}/faq`}
              className="block text-center py-4 text-primary-foreground/70 hover:text-primary font-medium"
            >
              {moreFaqLabel} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
