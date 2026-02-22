'use client';

import { useTranslation } from 'react-i18next';

interface TimelineCardProps {
  /** 0 = booked, 1 = revealed, 2 = chat open, 3 = meetup day */
  activeStep: 0 | 1 | 2 | 3;
}

export default function TimelineCard({ activeStep }: TimelineCardProps) {
  const { t } = useTranslation('dashboard');

  const STEPS = [
    { labelKey: 'stepBooked',       subKey: 'stepBookedSub' },
    { labelKey: 'stepRevealedLabel', subKey: 'stepRevealedSub' },
    { labelKey: 'stepChatOpens',     subKey: 'stepChatOpensSub' },
    { labelKey: 'stepMeetupLabel',   subKey: 'stepMeetupSub' },
  ] as const;

  return (
    <div
      className="rounded-[20px] bg-white p-5"
      style={{
        border: '1px solid rgba(58,11,34,0.08)',
        boxShadow: '0 4px 16px rgba(26,10,18,0.05)',
      }}
    >
      <p className="text-[11px] font-bold tracking-[0.10em] uppercase text-[#9B8F8B] mb-4">
        {t('thisWeek')}
      </p>

      <div className="flex items-start justify-between relative">
        {/* Background connector */}
        <div
          className="absolute top-[10px] left-[10px] right-[10px] h-[2px]"
          style={{ background: 'rgba(58,11,34,0.08)' }}
          aria-hidden="true"
        />
        {/* Filled progress line */}
        <div
          className="absolute top-[10px] left-[10px] h-[2px] transition-all duration-500"
          style={{
            background: 'linear-gradient(to right, #F27C5C, #F6B4A8)',
            width: `${(activeStep / (STEPS.length - 1)) * 100}%`,
          }}
          aria-hidden="true"
        />

        {STEPS.map((step, i) => {
          const done   = i < activeStep;
          const active = i === activeStep;
          return (
            <div key={step.labelKey} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: done || active ? '#F27C5C' : 'rgba(58,11,34,0.15)',
                  background:  done ? '#F27C5C' : active ? '#FFF' : '#F7F2EE',
                }}
                aria-hidden="true"
              >
                {done && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {active && (
                  <div className="w-2 h-2 rounded-full" style={{ background: '#F27C5C' }} />
                )}
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-[11px] font-semibold text-center leading-tight"
                  style={{ color: active ? '#1A0A12' : done ? '#3A0B22' : '#9B8F8B' }}
                >
                  {t(step.labelKey)}
                </span>
                <span className="text-[10px] text-center leading-tight text-[#9B8F8B]">
                  {t(step.subKey)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
