'use client';

import { CheckCircle2, Calendar, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ── Wednesday 6 PM local cutoff ───────────────────────────────────────────────
function isChangeCutoffPassed(): boolean {
  const now = new Date();
  const dow = now.getDay();
  if (dow === 3 && now.getHours() >= 18) return true;
  if (dow >= 4 && dow <= 6) return true;
  return false;
}

interface ReservedCardProps {
  dayLabel: string;
  dateFormatted: string;
  timeSlot: string;
  city?: string;
  onChangeDay?: () => void;
}

export default function ReservedCard({
  dayLabel,
  dateFormatted,
  timeSlot,
  city = 'Berlin',
  onChangeDay,
}: ReservedCardProps) {
  const { t } = useTranslation('dashboard');
  const cutoffPassed = isChangeCutoffPassed();

  return (
    <div
      className="rounded-[24px] overflow-hidden bg-white"
      style={{
        border: '1px solid rgba(58,11,34,0.10)',
        boxShadow: '0 10px 30px rgba(26,10,18,0.08)',
      }}
    >
      {/* Coral accent strip */}
      <div
        className="h-[5px]"
        style={{ background: 'linear-gradient(to right, #F27C5C, #F6B4A8)' }}
        aria-hidden="true"
      />

      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#F27C5C' }} aria-hidden="true" />
            <h2 className="font-heading text-xl font-bold text-[#1A0A12]">
              {t('youreIn')}
            </h2>
          </div>
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ background: '#D1FAE5', color: '#065F46' }}
          >
            {t('confirmed')}
          </span>
        </div>

        {/* Date / city / time */}
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-[#1A0A12]">
            {dayLabel}, {dateFormatted}
          </p>
          <p className="text-sm text-[#5E555B]">
            {timeSlot} · {city}
          </p>
        </div>

        {/* Avatar row */}
        <div>
          <div className="flex items-center -space-x-2">
            <div
              className="w-11 h-11 rounded-full text-sm font-bold border-2 border-white flex items-center justify-center shrink-0 z-10"
              style={{ background: '#3A0B22', color: '#F7F2EE' }}
              aria-label="Me"
            >
              Me
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-full text-sm border-2 border-white flex items-center justify-center shrink-0"
                style={{ background: '#F0EBE6', color: '#9B8F8B' }}
                aria-hidden="true"
              >
                ?
              </div>
            ))}
          </div>
          <p className="text-xs text-[#5E555B]/70 mt-2">
            {t('yourGroupOfDoctors')}
          </p>
        </div>

        {/* Reveal block */}
        <div
          className="rounded-[16px] p-4"
          style={{ background: 'rgba(58,11,34,0.04)' }}
        >
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#5E555B' }} aria-hidden="true" />
            <div>
              <p className="text-sm text-[#1A0A12] leading-snug">
                {t('revealedOnLine')}
              </p>
              <p
                className="font-heading font-bold text-[#3A0B22] mt-0.5"
                style={{ fontSize: '1.35rem', lineHeight: '1.2' }}
              >
                {t('thursday')}
              </p>
              <p className="text-xs text-[#5E555B]/70 mt-1">
                {t('groupRevealSub')}
              </p>
            </div>
          </div>
        </div>

        {/* Change day */}
        {onChangeDay && (
          cutoffPassed ? (
            <div className="flex items-center gap-1.5 min-h-[44px]">
              <Lock className="h-3.5 w-3.5 text-[#9B8F8B]" aria-hidden="true" />
              <p className="text-xs text-[#9B8F8B]" aria-live="polite">
                {t('changeDayClosed')}
              </p>
            </div>
          ) : (
            <button
              onClick={onChangeDay}
              className="min-h-[44px] flex items-center text-xs font-medium underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2 rounded"
              style={{ color: '#F27C5C' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e56d4d'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#F27C5C'; }}
              aria-label={t('changeDayAriaLabel')}
            >
              {t('changeDay')}
            </button>
          )
        )}
      </div>
    </div>
  );
}
