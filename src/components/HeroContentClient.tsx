'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/providers/I18nProvider';

export default function HeroContentClient() {
  const { t } = useTranslation();
  const locale = useLocale().locale;

  return (
    <div className="lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
        <div
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-8 animate-fade-up backdrop-blur-sm"
          role="status"
          aria-label="Exclusively for verified doctors"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
            <span className="text-primary-foreground text-xs">✓</span>
          </div>
          <span>{t('home.badge')}</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" aria-hidden="true" />
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary-foreground leading-[1.05] tracking-tight mb-8 animate-fade-up">
          {t('home.headlineNext')}
          <br />
          <span className="text-gradient-gold">{t('home.headlineHighlight')}</span>
        </h1>

        <p className="text-xl lg:text-2xl text-primary-foreground/70 max-w-2xl mx-auto lg:mx-0 mb-12 animate-fade-up delay-100 leading-relaxed">
          {t('home.subheadline')}{' '}
          <span className="text-primary-foreground font-medium">{t('home.subheadlineBold')}</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16 animate-fade-up delay-200">
          <Link
            href={`/${locale}/onboarding`}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-base h-14 px-8 hover:bg-primary/90 transition-colors"
            aria-label="Start your journey - go to onboarding"
          >
            {t('home.cta')}
            <span className="ml-2">→</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-6 justify-center lg:justify-start animate-fade-up delay-300" role="list">
          {[
            { labelKey: 'home.verifiedOnly' },
            { labelKey: 'home.weeklyMatches' },
            { labelKey: 'home.guarantee' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-primary-foreground/70" role="listitem">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-sm">✓</span>
              </div>
              <span className="font-medium">{t(item.labelKey)}</span>
            </div>
          ))}
        </div>
    </div>
  );
}
