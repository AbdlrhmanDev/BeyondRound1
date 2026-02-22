'use client';

import { useTranslation } from 'react-i18next';

interface CompletedCardProps {
  dayLabel: string;
  onRate: () => void;
  onChooseNext: () => void;
  hasRated: boolean;
}

export default function CompletedCard({
  dayLabel,
  onRate,
  onChooseNext,
  hasRated,
}: CompletedCardProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div
      className="rounded-[24px] overflow-hidden bg-white"
      style={{
        border: '1px solid rgba(58,11,34,0.10)',
        boxShadow: '0 10px 30px rgba(26,10,18,0.08)',
      }}
    >
      <div className="py-10 px-6 text-center space-y-5">
        <h2 className="font-heading font-semibold text-xl text-[#1A0A12] tracking-tight">
          {t('howWasDay', { dayLabel })}
        </h2>

        {!hasRated && (
          <button
            onClick={onRate}
            className="w-full h-12 rounded-full text-sm font-semibold border-2 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
            style={{ borderColor: '#3A0B22', color: '#3A0B22', background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(58,11,34,0.05)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {t('rateExperience')}
          </button>
        )}

        <div className="space-y-2">
          {!hasRated && (
            <p className="text-sm text-[#5E555B]">
              {t('readyForNextWeekend')}
            </p>
          )}
          <button
            onClick={onChooseNext}
            className="w-full h-12 rounded-full text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
            style={{ background: '#F27C5C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e56d4d'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F27C5C'; }}
          >
            {t('chooseNextMeetup')}
          </button>
        </div>
      </div>
    </div>
  );
}
