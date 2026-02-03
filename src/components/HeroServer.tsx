/**
 * Server-rendered hero - LCP image in initial HTML, no client JS blocking.
 * Used for homepage to fix 7.8s LCP (was blocked by I18nProvider returning null).
 */
import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/settings';

type Dict = Record<string, Record<string, string>>;

interface HeroServerProps {
  locale: Locale;
  dictionary: Dict;
}

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

export default function HeroServer({ locale, dictionary }: HeroServerProps) {
  const t = (key: string) => {
    const [ns, k] = key.split('.');
    return (dictionary[ns] as Record<string, string>)?.[k] ?? key;
  };
  const displayDate = getNextThursdayStr();

  return (
    <section
      className="relative min-h-screen flex items-center pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-24 overflow-hidden bg-foreground dark:bg-background"
      aria-label="Welcome to BeyondRounds - Your next great friendship awaits"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
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
          <div className="lg:col-span-7 text-center lg:text-left">
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

          <div className="lg:col-span-5 relative animate-fade-up delay-100">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-60" aria-hidden="true" />

              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-primary-foreground/10 aspect-[4/5]">
                <Image
                  src="/hero-doctors-friendship-mobile.webp"
                  alt="Doctors enjoying genuine friendship at a coffee meetup"
                  width={500}
                  height={625}
                  priority
                  sizes="(max-width: 768px) 100vw, (min-width: 769px) 500px"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" aria-hidden="true" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div
                    className="bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-4"
                    role="status"
                    aria-live="polite"
                    aria-label={`Next match: ${displayDate}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-primary-foreground font-display font-bold text-lg">{t('home.nextMatchIn')}</p>
                        <p className="text-primary-foreground/70 text-sm">{displayDate}</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" aria-hidden="true" />
                        {t('home.live')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -bottom-6 -left-8 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 p-4 rounded-2xl shadow-xl animate-float"
                aria-label="2 or more meaningful meetups"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm">
                    <span className="text-primary-foreground text-xl">👥</span>
                  </div>
                  <div>
                    <p className="font-display font-bold text-primary-foreground">{t('home.meaningfulMeetups')}</p>
                    <p className="text-sm text-primary-foreground/70">{t('home.realConnections')}</p>
                  </div>
                </div>
              </div>

              <div
                className="absolute -top-4 -right-4 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 px-4 py-3 rounded-2xl shadow-lg animate-float delay-200"
                aria-label="Over 5,000 doctors on the platform"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                  </div>
                  <span className="text-sm font-semibold text-primary-foreground">{t('home.doctorsOnPlatform')}</span>
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
