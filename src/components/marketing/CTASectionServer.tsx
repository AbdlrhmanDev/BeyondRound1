/**
 * Server-rendered CTA section. No i18next.
 * Uses native buttons/links (no Radix Button) to avoid loading @radix-ui/react-slot on marketing.
 */
import Link from 'next/link';
import { ArrowRight, Users, Shield, Calendar, Sparkles } from 'lucide-react';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

const stats = [
  { icon: Users, value: '5,000+', labelKey: 'home.verifiedDoctors' },
  { icon: Calendar, value: '12,000+', labelKey: 'home.meetupsOrganized' },
  { icon: Shield, value: '30', labelKey: 'home.dayGuarantee' },
];

interface CTASectionServerProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function CTASectionServer({ dict, locale }: CTASectionServerProps) {
  const t = getT(dict);

  return (
    <section className="py-28 lg:py-36 bg-foreground dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none [contain:strict]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[100px] sm:blur-[150px] lg:blur-[200px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[80px] sm:blur-[120px] lg:blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/15 blur-[60px] sm:blur-[80px] lg:blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-8">
            <Sparkles size={14} className="text-primary" />
            {t('home.joinCommunity')}
          </span>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight text-primary-foreground">
            {t('home.ctaTitle')}
          </h2>

          <p className="text-xl text-primary-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('home.ctaSubtext')}
          </p>

          {/* Stats – Proof Block with context */}
          <p className="text-sm font-semibold text-primary-foreground/50 uppercase tracking-wider mb-8">
            {t('home.statsProofTitle')}
          </p>
          <div className="grid sm:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="number-display text-4xl lg:text-5xl text-primary-foreground mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-primary-foreground/50 font-medium">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>

          {/* Trust block – before CTA */}
          <div className="flex flex-wrap gap-6 justify-center mb-12 text-primary-foreground/70 text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <span aria-hidden>🔒</span>
              {t('home.trustVerified')}
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden>🛡</span>
              {t('home.trustModerated')}
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden>📍</span>
              {t('home.trustPublic')}
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/onboarding`}
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-primary-foreground font-semibold h-14 px-8 text-base shadow-[0_4px_20px_-4px_hsl(220_25%_15%/0.08)] hover:opacity-90 transition-opacity group"
              >
                {t('home.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={`/${locale}/learn-more`}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-2xl border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-14 px-8 text-base font-medium transition-colors"
              >
                {t('common.learnMore')}
              </Link>
            </div>
            <p className="text-sm font-medium text-primary-foreground/60">
              {t('home.ctaNextGroup')}
            </p>
          </div>

          {/* Closing human element – avatar + quote for trust */}
          <div className="mt-20 pt-16 border-t border-primary-foreground/10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 max-w-2xl mx-auto">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-400/20 border-2 border-primary-foreground/20 flex items-center justify-center shrink-0"
                aria-hidden
              >
                <span className="font-display font-bold text-xl sm:text-2xl text-primary-foreground/90">ML</span>
              </div>
              <blockquote className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl text-primary-foreground/90 font-medium leading-relaxed mb-3">
                  &ldquo;{t('home.ctaClosingQuote')}&rdquo;
                </p>
                <cite className="text-sm text-primary-foreground/50 not-italic">
                  — {t('home.ctaClosingAuthor')}
                </cite>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
