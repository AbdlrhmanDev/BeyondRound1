'use client';

import { useTranslation } from 'react-i18next';

interface Props {
  city: string;
  onSelectDay: (day: string) => void;
}

function getUpcomingWeekend(): { friday: Date; saturday: Date; sunday: Date } {
  const now = new Date();
  const dow = now.getDay();
  let daysToFriday: number;
  if (dow === 0) daysToFriday = 5;
  else if (dow === 6) daysToFriday = 6;
  else daysToFriday = 5 - dow;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(19, 0, 0, 0);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  saturday.setHours(19, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(12, 0, 0, 0);

  return { friday, saturday, sunday };
}

interface DayCardProps {
  dayKey: string;
  dayLabel: string;
  date: Date;
  city: string;
  lang: string;
  onSelectDay: (day: string) => void;
  t: (key: string, opts?: Record<string, string>) => string;
}

function DayCard({ dayKey, dayLabel, date, city, lang, onSelectDay, t }: DayCardProps) {
  const locale = lang === 'de' ? 'de-DE' : 'en-US';

  const dateStr = date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const timeStr = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: lang !== 'de',
  });

  const h = date.getHours();
  const windowKey =
    h < 12 ? 'morningWindow' :
    h < 17 ? 'afternoonWindow' :
              'eveningWindow';

  return (
    <div
      className="rounded-[22px] p-5 space-y-3 bg-white"
      style={{
        border: '1px solid rgba(58,11,34,0.10)',
        boxShadow: '0 4px 16px rgba(26,10,18,0.06)',
      }}
    >
      <p className="font-heading font-semibold text-lg text-[#1A0A12]">{dayLabel}</p>

      <p className="text-sm text-[#5E555B]">
        {dateStr} · {t(windowKey, { time: timeStr })}
      </p>

      <p className="text-xs text-[#5E555B]/70">
        {t('doctorsCity', { city })}
      </p>

      <button
        className="w-full h-[52px] rounded-full text-white text-sm font-semibold transition-all active:scale-[0.98] active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
        style={{ background: '#F27C5C' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e56d4d'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F27C5C'; }}
        onClick={() => onSelectDay(dayKey)}
      >
        {t('chooseDayLabel', { day: dayLabel })}
      </button>
    </div>
  );
}

export default function ChooseDayModule({ city, onSelectDay }: Props) {
  const { t, i18n } = useTranslation('dashboard');
  const { friday, saturday, sunday } = getUpcomingWeekend();
  const lang = i18n.language;

  const days = [
    { key: 'friday',   label: t('dayFriday'),   date: friday },
    { key: 'saturday', label: t('daySaturday'), date: saturday },
    { key: 'sunday',   label: t('daySunday'),   date: sunday },
  ];

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div>
        <h2 className="font-heading text-2xl text-[#1A0A12]">
          {t('joinWeekendGathering')}
        </h2>
        <p className="text-sm text-[#5E555B] mt-1">
          {t('chooseDaySubline', { city })}
        </p>
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {days.map(({ key, label, date }) => (
          <DayCard
            key={key}
            dayKey={key}
            dayLabel={label}
            date={date}
            city={city}
            lang={lang}
            onSelectDay={onSelectDay}
            t={t}
          />
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-[#5E555B]/70 mt-1">
        {t('limitedCapacity')}
      </p>

      {/* How it works */}
      <div
        className="rounded-[18px] p-4 mt-4"
        style={{ background: 'rgba(58,11,34,0.04)' }}
      >
        <h3 className="font-heading text-sm font-semibold mb-3 text-[#3A0B22]">
          {t('howItWorksLabel')}
        </h3>
        <div className="flex justify-between">
          {[
            { key: 'stepChooseDay',  tKey: 'stepChooseDay' },
            { key: 'stepGetMatched', tKey: 'stepGetMatched' },
            { key: 'stepMeetUp',     tKey: 'stepMeetUp' },
          ].map((step, i) => (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div
                className="text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold"
                style={{ background: 'rgba(242,124,92,0.15)', color: '#3A0B22' }}
              >
                {i + 1}
              </div>
              <span className="text-[11px] text-[#5E555B] text-center">
                {t(step.tKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
