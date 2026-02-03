/**
 * Server-rendered hero. No i18next - uses dictionary.
 * HeroImageServer stays server for LCP.
 */
import Link from 'next/link';
import HeroImageServer from '@/components/HeroImageServer';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

function getNextThursdayStr(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();
  let daysUntilThursday: number;
  if (dayOfWeek === 4 && currentHour < 16) daysUntilThursday = 0;
  else if (dayOfWeek === 4) daysUntilThursday = 7;
  else if (dayOfWeek < 4) daysUntilThursday = 4 - dayOfWeek;
  else daysUntilThursday = 7 - (dayOfWeek - 4);
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(16, 0, 0, 0);
  return nextThursday.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface HeroSectionServerProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function HeroSectionServer({ dict, locale }: HeroSectionServerProps) {
  const t = getT(dict);
  const displayDate = getNextThursdayStr();

  return (
    <section
      className="relative min-h-screen flex items-center pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-24 overflow-hidden bg-foreground dark:bg-background"
      aria-label="Welcome to BeyondRounds - Your next great friendship awaits"
    >
      {/* No blur on mobile (LCP); subtle blur on desktop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none [contain:strict]" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 hidden sm:block sm:blur-[100px] lg:blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 hidden sm:block sm:blur-[80px] lg:blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 hidden sm:block sm:blur-[120px] lg:blur-[200px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-8 backdrop-blur-sm"
              role="status"
              aria-label="Exclusively for verified doctors"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
              <span>{t('home.badge')}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" aria-hidden="true" />
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary-foreground leading-[1.05] tracking-tight mb-8">
              {t('home.headlineNext')}
              <br />
              <span className="text-gradient-gold">{t('home.headlineHighlight')}</span>
            </h1>

            <p className="text-xl lg:text-2xl text-primary-foreground/70 max-w-2xl mx-auto lg:mx-0 mb-12 leading-relaxed">
              {t('home.subheadline')}{' '}
              <span className="text-primary-foreground font-medium">{t('home.subheadlineBold')}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16">
              <Link
                href={`/${locale}/onboarding`}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-base h-14 px-8 hover:bg-primary/90 transition-colors"
                aria-label="Start your journey - go to onboarding"
              >
                {t('home.cta')}
                <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center lg:justify-start" role="list">
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

          <div className="lg:col-span-5 relative order-1 lg:order-2 pt-4 pl-4 pr-4 pb-8 sm:pt-6 sm:pl-6 sm:pr-6 sm:pb-10">
            <div className="relative overflow-visible">
              <div
                className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2.5rem] opacity-60 sm:blur-xl"
                aria-hidden="true"
              />
              <div className="relative rounded-[2rem] shadow-2xl border border-primary-foreground/10 aspect-[4/5] overflow-visible">
                {/* Image + gradient – clipped to rounded corners */}
                <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                  <HeroImageServer fill />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" aria-hidden="true" />
                </div>
                {/* Next match panel */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <div
                    className="bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-4"
                    role="status"
                    aria-live="polite"
                    aria-label={`Next match: ${displayDate}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-primary-foreground font-display font-bold text-base sm:text-lg">
                          {t('home.nextMatchIn')}
                        </p>
                        <p className="text-primary-foreground/90 text-sm font-medium truncate" title={displayDate}>
                          {displayDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" aria-hidden="true" />
                        {t('home.live')}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Meaningful meetups badge – visible, not clipped */}
                <div
                  className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 p-3 sm:p-4 rounded-2xl shadow-xl animate-float"
                  aria-label="2 or more meaningful meetups"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm shrink-0">
                      <span className="text-primary-foreground text-lg sm:text-xl">👥</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-primary-foreground text-sm sm:text-base">
                        {t('home.meaningfulMeetups')}
                      </p>
                      <p className="text-xs sm:text-sm text-primary-foreground/70 truncate">
                        {t('home.realConnections')}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Doctors count badge – visible, not clipped */}
                <div
                  className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-lg animate-float delay-200"
                  aria-label="Over 5,000 doctors on the platform"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500" />
                      <div className="absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 animate-ping" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-primary-foreground whitespace-nowrap">
                      {t('home.doctorsOnPlatform')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block" aria-hidden="true">
        <div className="flex flex-col items-center gap-3 text-primary-foreground/40">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
