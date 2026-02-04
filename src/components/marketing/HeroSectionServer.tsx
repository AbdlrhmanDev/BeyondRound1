/**
 * Server-rendered hero. No i18next - uses dictionary.
 * HeroImageServer stays server for LCP.
 */
import Link from 'next/link';
import HeroImageServer from '@/components/HeroImageServer';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

function getNextThursdayDate(): Date {
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
  return nextThursday;
}

function getNextThursdayCompact(): string {
  const d = getNextThursdayDate();
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} · ${timeStr}`;
}

interface HeroSectionServerProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function HeroSectionServer({ dict, locale }: HeroSectionServerProps) {
  const t = getT(dict);
  const displayDateCompact = getNextThursdayCompact();

  return (
    <section
      className="relative min-h-[90dvh] sm:min-h-screen flex items-center pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-24 overflow-hidden bg-foreground dark:bg-background"
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
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 text-center lg:text-left order-1 lg:order-1">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/90 text-xs sm:text-sm font-semibold mb-5 sm:mb-8 backdrop-blur-sm"
              role="status"
              aria-label="Exclusively for verified doctors"
            >
              <div className="w-5 h-5 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
              <span>{t('home.badge')}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" aria-hidden="true" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary-foreground leading-[1.08] tracking-tight mb-3 sm:mb-4">
              {t('home.headlineNext')}
              <br />
              <span className="text-gradient-gold">{t('home.headlineHighlight')}</span>
            </h1>

            <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto lg:mx-0 mb-6">
              {t('home.valueProposition')}
            </p>

            <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 mb-6 sm:mb-8 text-primary-foreground/75 text-sm sm:text-base" role="list">
              <li className="flex items-center gap-2">
                <span aria-hidden>👩‍⚕️</span>
                {t('home.bullet1')}
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>🧠</span>
                {t('home.bullet2')}
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>☕</span>
                {t('home.bullet3')}
              </li>
            </ul>

            {/* Mobile only: simplified card – clear hierarchy, warm grey badges */}
            <div className="sm:hidden mb-8">
              <div className="relative rounded-2xl bg-primary-foreground/[0.06] border border-primary-foreground/12 p-5 backdrop-blur-sm">
                <div className="flex flex-wrap justify-center gap-2 mb-4 text-sm font-medium text-primary-foreground/90">
                  <span>{t('home.doctorsOnPlatform')}</span>
                  <span className="text-primary-foreground/40">|</span>
                  <span>{t('home.meaningfulMeetups')}</span>
                </div>
                <div className="flex flex-col items-center gap-1 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary-foreground/60">{t('home.nextMatchIn')}</span>
                    <span className="text-sm font-bold text-primary-foreground">{displayDateCompact}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                      {t('home.live')}
                    </span>
                  </div>
                  <span className="text-xs text-primary-foreground/50">{t('home.nextMatchInCity')}</span>
                </div>
              </div>
            </div>

            {/* Trust block – before CTA */}
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start mb-6 text-primary-foreground/70 text-sm">
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

            <div className="flex flex-col items-center lg:items-start gap-3 mb-8 sm:mb-12">
              <Link
                href={`/${locale}/onboarding`}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-xl sm:rounded-lg bg-primary text-primary-foreground font-semibold text-base h-14 px-8 hover:bg-primary/90 hover:shadow-glow transition-all min-h-[48px] shadow-glow-sm w-full sm:w-auto"
                aria-label="Secure your match - go to onboarding"
              >
                {t('home.cta')}
                <span className="ml-2">→</span>
              </Link>
              <p className="text-xs text-primary-foreground/50 text-center lg:text-left">
                {t('home.ctaMicroCopy')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-6 justify-center lg:justify-start" role="list">
              {[
                { labelKey: 'home.verifiedOnly', icon: '✓' },
                { labelKey: 'home.weeklyMatches', icon: '✓' },
                { labelKey: 'home.guarantee', icon: '✓' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-primary-foreground/75" role="listitem">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-primary-foreground/10 border border-primary-foreground/10 flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground/70 text-xs sm:text-sm">{item.icon}</span>
                  </div>
                  <span className="font-medium text-sm sm:text-base">{t(item.labelKey)}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Desktop: image card (hidden on mobile) */}
          <div className="hidden sm:block lg:col-span-5 relative order-2 lg:order-2">
            <div className="pt-4 pl-4 pr-4 pb-8 md:pt-6 md:pl-6 md:pr-6 md:pb-10">
            <div className="relative overflow-visible max-w-none mx-auto">
              <div
                className="absolute -inset-2 sm:-inset-4 bg-primary-foreground/5 rounded-[1.5rem] sm:rounded-[2.5rem] opacity-40 sm:blur-2xl"
                aria-hidden="true"
              />
              <div className="relative rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-primary-foreground/10 aspect-[4/5] overflow-visible">
                {/* Image + gradient – clipped to rounded corners */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
                  <HeroImageServer fill />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" aria-hidden="true" />
                </div>
                {/* Next match panel – compact format */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
                  <div
                    className="bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 rounded-xl sm:rounded-2xl p-3 sm:p-4"
                    role="status"
                    aria-live="polite"
                    aria-label={`Next match: ${displayDateCompact}`}
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <p className="text-primary-foreground/70 font-medium text-xs sm:text-sm">
                          {t('home.nextMatchIn')}
                        </p>
                        <p className="text-primary-foreground font-bold text-sm sm:text-base truncate" title={displayDateCompact}>
                          {displayDateCompact}
                        </p>
                        <p className="text-primary-foreground/50 text-[10px] sm:text-xs mt-0.5">{t('home.nextMatchInCity')}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" aria-hidden="true" />
                        {t('home.live')}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Meaningful meetups badge – warm grey, not orange */}
                <div
                  className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 md:-bottom-6 md:-left-6 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl shadow-xl animate-float"
                  aria-label="2 or more meaningful meetups"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
                      <span className="text-primary-foreground text-sm sm:text-lg md:text-xl">👥</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-primary-foreground text-xs sm:text-sm md:text-base">
                        {t('home.meaningfulMeetups')}
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-primary-foreground/70 truncate">
                        {t('home.realConnections')}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Doctors count badge – warm grey */}
                <div
                  className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-4 md:-right-4 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded-xl sm:rounded-2xl shadow-lg animate-float delay-200"
                  aria-label="Over 5,000 doctors on the platform"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="relative shrink-0">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500" />
                      <div className="absolute inset-0 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-ping" />
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary-foreground whitespace-nowrap">
                      {t('home.doctorsOnPlatform')}
                    </span>
                  </div>
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
