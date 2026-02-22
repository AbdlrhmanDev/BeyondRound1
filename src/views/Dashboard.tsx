'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { getProfile } from '@/services/profileService';
import {
  getActiveWeekendBooking,
  confirmBookingPaid,
} from '@/services/weekendBookingService';
import { fetchUserGroups } from '@/services/matchService';
import type { MatchGroup } from '@/types/match';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChooseDayModule from '@/components/dashboard/ChooseDayModule';
import PaymentSheet from '@/components/dashboard/PaymentSheet';
import PlanPickerSheet, { type SelectedPlan } from '@/components/dashboard/PlanPickerSheet';
import ReservedCard from '@/components/dashboard/ReservedCard';
import CompletedCard from '@/components/dashboard/CompletedCard';
import TimelineCard from '@/components/dashboard/TimelineCard';
import { MapPin, CalendarPlus, MessageCircleOff } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────

type GatheringState = 'loading' | 'none' | 'reserved' | 'matched' | 'meetup' | 'completed';

// ─── Helpers ────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function isCurrentWeek(matchWeek: string): boolean {
  const now = new Date();
  const mw = new Date(matchWeek);
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };
  return getMonday(now).toDateString() === getMonday(mw).toDateString();
}

function isMeetupSoon(dayKey: string): boolean {
  const now = new Date();
  const dow = now.getDay();
  if (dayKey === 'friday'   && (dow === 5 || (dow === 4 && now.getHours() >= 18))) return true;
  if (dayKey === 'saturday' && (dow === 6 || dow === 5)) return true;
  if (dayKey === 'sunday'   && (dow === 0 || dow === 6)) return true;
  return false;
}

function getDayDate(day: string): Date {
  const now = new Date();
  const dow = now.getDay();
  const daysToFriday = dow === 0 ? 5 : dow === 6 ? 6 : 5 - dow;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(19, 0, 0, 0);
  if (day === 'saturday') friday.setDate(friday.getDate() + 1);
  if (day === 'sunday') {
    friday.setDate(friday.getDate() + 2);
    friday.setHours(12, 0, 0, 0);
  }
  return friday;
}

// ─── Sub-components ─────────────────────────────────────

/** State C — group revealed, chat open */
function MatchedPreviewCard({
  group,
  onOpenChat,
}: {
  group: MatchGroup;
  onOpenChat: () => void;
}) {
  const { t } = useTranslation('dashboard');
  const shownMembers = group.members.slice(0, 4);

  return (
    <div
      className="rounded-[24px] overflow-hidden bg-white"
      style={{
        border: '1px solid rgba(58,11,34,0.10)',
        boxShadow: '0 10px 30px rgba(26,10,18,0.08)',
      }}
    >
      <div
        className="h-[5px]"
        style={{ background: 'linear-gradient(to right, #F27C5C, #F6B4A8)' }}
        aria-hidden="true"
      />

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#1A0A12]">
              {t('yourGroupIsReady')}
            </h2>
            <p className="text-sm text-[#5E555B] mt-0.5">
              {t('sayHelloMicrocopy')}
            </p>
          </div>
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 ml-3 mt-0.5"
            style={{ background: '#D1FAE5', color: '#065F46' }}
          >
            {t('revealed')}
          </span>
        </div>

        <div className="flex gap-4 flex-wrap">
          {shownMembers.map((member) => (
            <div key={member.user_id} className="flex flex-col items-center gap-1.5">
              <Avatar
                className="h-11 w-11 ring-2 ring-white"
                style={{ boxShadow: '0 2px 8px rgba(58,11,34,0.12)' }}
              >
                <AvatarImage src={member.profile.avatar_url ?? undefined} />
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ background: 'rgba(242,124,92,0.12)', color: '#3A0B22' }}
                >
                  {getInitials(member.profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium text-[#5E555B] truncate max-w-[48px] text-center">
                {member.profile.full_name?.split(' ')[0] ?? '—'}
              </span>
            </div>
          ))}
          {group.member_count && group.member_count > shownMembers.length + 1 && (
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="h-11 w-11 rounded-full ring-2 ring-white flex items-center justify-center"
                style={{ background: '#F0EBE6', boxShadow: '0 2px 8px rgba(58,11,34,0.08)' }}
              >
                <span className="text-[10px] font-bold text-[#3A0B22]">
                  +{group.member_count - shownMembers.length - 1}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onOpenChat}
          className="w-full h-[52px] rounded-full text-white text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
          style={{ background: '#F27C5C' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e56d4d'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F27C5C'; }}
        >
          {t('openGroupChat')}
        </button>
      </div>
    </div>
  );
}

/** State D — meetup day is today */
function MeetupDayCard({
  group,
  dayLabel,
  onOpenChat,
}: {
  group: MatchGroup;
  dayLabel: string;
  onOpenChat: () => void;
}) {
  const { t } = useTranslation('dashboard');

  return (
    <div
      className="rounded-[24px] overflow-hidden bg-white"
      style={{
        border: '1px solid rgba(58,11,34,0.10)',
        boxShadow: '0 10px 30px rgba(26,10,18,0.08)',
      }}
    >
      <div
        className="h-[5px]"
        style={{ background: 'linear-gradient(to right, #F27C5C, #F6B4A8)' }}
        aria-hidden="true"
      />

      <div className="p-6 space-y-5">
        <div>
          <span
            className="text-[11px] font-bold tracking-[0.10em] uppercase"
            style={{ color: '#F27C5C' }}
          >
            {t('today')}
          </span>
          <h2 className="font-heading text-xl font-bold text-[#1A0A12] mt-1">
            {dayLabel} {t('gatheringLabel')}
          </h2>
          <p className="text-sm text-[#5E555B] mt-0.5">
            {t('groupWaitingToday')}
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          {group.members.slice(0, 4).map((member) => (
            <div key={member.user_id} className="flex flex-col items-center gap-1.5">
              <Avatar
                className="h-11 w-11 ring-2 ring-white"
                style={{ boxShadow: '0 2px 8px rgba(58,11,34,0.12)' }}
              >
                <AvatarImage src={member.profile.avatar_url ?? undefined} />
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ background: 'rgba(242,124,92,0.12)', color: '#3A0B22' }}
                >
                  {getInitials(member.profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium text-[#5E555B] truncate max-w-[48px] text-center">
                {member.profile.full_name?.split(' ')[0] ?? '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={onOpenChat}
            className="w-full h-[52px] rounded-full text-white text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
            style={{ background: '#F27C5C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e56d4d'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F27C5C'; }}
          >
            {t('openGroupChat')}
          </button>

          <div className="flex gap-3">
            <button
              className="flex-1 h-11 rounded-full text-xs font-semibold border-2 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
              style={{ borderColor: 'rgba(58,11,34,0.15)', color: '#3A0B22' }}
              aria-label={t('directions')}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {t('directions')}
            </button>
            <button
              className="flex-1 h-11 rounded-full text-xs font-semibold border-2 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2"
              style={{ borderColor: 'rgba(58,11,34,0.15)', color: '#3A0B22' }}
              aria-label={t('addToCalendar')}
            >
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('addToCalendar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chat locked notice */
function ChatLockedNotice() {
  const { t } = useTranslation('dashboard');
  return (
    <div
      className="rounded-[18px] p-4 flex items-start gap-3"
      style={{
        background: 'rgba(58,11,34,0.03)',
        border: '1px solid rgba(58,11,34,0.07)',
      }}
    >
      <MessageCircleOff className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#9B8F8B' }} aria-hidden="true" />
      <p className="text-xs text-[#5E555B] leading-relaxed">
        {t('chatLockedFull')}
      </p>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────

export default function Dashboard() {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useLocalizedNavigate();
  const { user, session, loading: authLoading } = useAuth();

  const [gatheringState, setGatheringState] = useState<GatheringState>('loading');
  const [currentGroup, setCurrentGroup] = useState<MatchGroup | null>(null);
  const [reservedDay, setReservedDay] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Berlin');
  const [firstName, setFirstName] = useState<string>('there');

  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

  // ── Locale-aware date/time formatters ──────────────────
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';

  function formatEventDate(date: Date): string {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }

  function formatEventTime(date: Date): string {
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: i18n.language !== 'de',
    });
  }

  // ── Localised day labels ───────────────────────────────
  const DAY_LABEL_KEYS: Record<string, string> = {
    friday:   'dayFriday',
    saturday: 'daySaturday',
    sunday:   'daySunday',
  };

  function formatDayLabel(day: string): string {
    return t(DAY_LABEL_KEYS[day] ?? 'dayFriday');
  }

  // ── Greeting (computed at render, no state needed) ────
  const hour = new Date().getHours();
  const greetingText =
    hour < 12 ? t('greetingMorning') :
    hour < 18 ? t('greetingAfternoon') :
                t('greetingEvening');

  // ── Subline per state ─────────────────────────────────
  const stateSublineKey: Record<GatheringState, string> = {
    loading:   '',
    none:      'sublimeNone',
    reserved:  'sublimeReserved',
    matched:   'sublimeMatched',
    meetup:    'sublimeMeetup',
    completed: 'sublimeCompleted',
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) { setGatheringState('none'); return; }

    let cancelled = false;

    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('booking_success') === 'true') {
          const bookingId = params.get('booking_id');
          if (bookingId) await confirmBookingPaid(bookingId);
          window.history.replaceState({}, '', window.location.pathname);
        }

        const profile = await getProfile(user.id);
        if (cancelled) return;

        setCity(profile?.city ?? 'Berlin');
        const name = profile?.full_name ?? '';
        setFirstName(name ? name.split(' ')[0] : 'there');

        const [booking, groups] = await Promise.all([
          getActiveWeekendBooking(user.id),
          fetchUserGroups(user.id).catch(() => [] as MatchGroup[]),
        ]);

        if (cancelled) return;

        const currentWeekGroup = groups.find((g) => isCurrentWeek(g.match_week));

        if (currentWeekGroup) {
          const now = new Date();
          const sunday = new Date(currentWeekGroup.match_week);
          sunday.setDate(sunday.getDate() + 3);
          setCurrentGroup(currentWeekGroup);

          if (now > sunday) {
            setGatheringState('completed');
          } else if (isMeetupSoon(booking?.day ?? '')) {
            setGatheringState('meetup');
          } else {
            setGatheringState('matched');
          }
        } else if (booking?.paid) {
          setReservedDay(booking.day);
          setGatheringState('reserved');
        } else {
          setGatheringState('none');
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setGatheringState('none');
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    setPlanPickerOpen(true);
  };

  const handleSelectPlan = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
    setPlanPickerOpen(false);
    setPaymentSheetOpen(true);
  };

  const handlePaymentSuccess = () => {
    setGatheringState('reserved');
    setReservedDay(selectedDay);
    setPaymentSheetOpen(false);
  };

  const handleOpenChat = () => {
    navigate(currentGroup?.conversation_id ? '/chat' : '/matches');
  };

  // ── Loading ───────────────────────────────────────────
  if (gatheringState === 'loading') {
    return (
      <DashboardLayout>
        <div className="w-full" style={{ background: '#F7F2EE' }}>
          <div className="container mx-auto px-4 pt-8 pb-6 max-w-lg space-y-2">
            <Skeleton className="h-8 w-44 rounded-xl" style={{ background: 'rgba(58,11,34,0.07)' }} />
            <Skeleton className="h-4 w-56 rounded-lg" style={{ background: 'rgba(58,11,34,0.05)' }} />
          </div>
        </div>
        <main className="container mx-auto px-4 pb-6 max-w-lg space-y-4">
          <Skeleton className="h-64 w-full rounded-[24px]" style={{ background: 'rgba(58,11,34,0.06)' }} />
          <Skeleton className="h-28 w-full rounded-[20px]" style={{ background: 'rgba(58,11,34,0.04)' }} />
        </main>
      </DashboardLayout>
    );
  }

  // ── Timeline step ─────────────────────────────────────
  const timelineStep: 0 | 1 | 2 | 3 =
    gatheringState === 'reserved' ? 0 :
    gatheringState === 'matched'  ? 2 :
    gatheringState === 'meetup'   ? 3 : 0;

  return (
    <DashboardLayout>
      {/* Greeting hero */}
      <div
        className="w-full"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(242,124,92,0.11) 0%, transparent 65%), ' +
            'radial-gradient(ellipse 55% 45% at 92% 50%, rgba(58,11,34,0.07) 0%, transparent 55%), ' +
            '#F7F2EE',
        }}
      >
        <div className="container mx-auto px-4 pt-8 pb-7 max-w-lg">
          <h1 className="font-display text-[1.6rem] font-bold text-[#1A0A12] tracking-tight leading-tight">
            {greetingText}, {firstName}
          </h1>
          <p className="text-sm text-[#5E555B] mt-1">
            {t(stateSublineKey[gatheringState])}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-8 max-w-lg space-y-4 mt-1">

        {/* State A: choose day */}
        {gatheringState === 'none' && (
          <ChooseDayModule city={city} onSelectDay={handleSelectDay} />
        )}

        {/* State B: reserved */}
        {gatheringState === 'reserved' && (() => {
          const dt = getDayDate(reservedDay ?? '');
          return (
            <>
              <ReservedCard
                dayLabel={formatDayLabel(reservedDay ?? '')}
                dateFormatted={formatEventDate(dt)}
                timeSlot={formatEventTime(dt)}
                city={city}
                onChangeDay={() => setGatheringState('none')}
              />
              <ChatLockedNotice />
              <TimelineCard activeStep={0} />
            </>
          );
        })()}

        {/* State C: matched */}
        {gatheringState === 'matched' && currentGroup && (
          <>
            <MatchedPreviewCard group={currentGroup} onOpenChat={handleOpenChat} />
            <TimelineCard activeStep={timelineStep} />
          </>
        )}

        {/* State D: meetup day */}
        {gatheringState === 'meetup' && currentGroup && (
          <MeetupDayCard
            group={currentGroup}
            dayLabel={formatDayLabel(reservedDay ?? '')}
            onOpenChat={handleOpenChat}
          />
        )}

        {/* State E: completed */}
        {gatheringState === 'completed' && currentGroup && (
          <CompletedCard
            dayLabel={formatDayLabel(reservedDay ?? 'friday')}
            onRate={() => navigate('/matches')}
            onChooseNext={() => setGatheringState('none')}
            hasRated={false}
          />
        )}

        <div className="h-2" />
      </main>

      <PlanPickerSheet
        open={planPickerOpen}
        dayLabel={selectedDay ? formatDayLabel(selectedDay) : ''}
        onSelectPlan={handleSelectPlan}
        onClose={() => setPlanPickerOpen(false)}
      />

      <PaymentSheet
        open={paymentSheetOpen}
        day={selectedDay ?? ''}
        userId={user?.id ?? ''}
        accessToken={session?.access_token ?? ''}
        city={city}
        plan={selectedPlan ?? undefined}
        onClose={() => setPaymentSheetOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </DashboardLayout>
  );
}
