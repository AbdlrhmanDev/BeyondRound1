'use client';

import { useTranslation } from 'react-i18next';

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

export default function HeroOverlays() {
  const { t } = useTranslation();
  const displayDate = getNextThursdayStr();

  return (
    <>
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
    </>
  );
}
