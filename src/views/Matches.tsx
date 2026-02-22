'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import DashboardLayout from '@/components/DashboardLayout';
import {
  MapPin, MessageCircle, ChevronRight, Archive, Lock,
  Calendar, Star, CheckCircle2, Loader2, Coffee, Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabaseClient, supabase } from '@/integrations/supabase/client';
import { fetchUserGroups } from '@/services/matchService';
import { getProfile } from '@/services/profileService';
import { getActiveWeekendBooking } from '@/services/weekendBookingService';
import { submitEvaluation, hasSubmittedEvaluation } from '@/services/evaluationService';
import type { MatchGroup, GroupMember } from '@/types/match';

// ─── Types ──────────────────────────────────────────────────────────────────

type GatheringState = 'loading' | 'none' | 'reserved' | 'matched' | 'completed';
type Tab = 'weekend' | 'past';

interface PastGroupDisplay {
  id: string;
  name: string | null;
  day: string;
  date: string;
  dateNum: string;
  city: string;
  members: { initials: string; name: string; specialty: string; avatarUrl?: string | null }[];
  conversationId?: string;
  matchWeek: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
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

/** Parse "Friday - Berlin - meetup" → { day: "Friday", city: "Berlin" } */
function parseGroupName(name: string | null): { day: string; city: string } {
  if (!name) return { day: '', city: 'Berlin' };
  const parts = name.split(' - ');
  return { day: parts[0]?.trim() ?? '', city: parts[1]?.trim() ?? 'Berlin' };
}

/** match_week is Thursday; Friday=+1, Saturday=+2, Sunday=+3 */
function getEventDate(matchWeek: string, dayName: string): Date {
  const thu = new Date(matchWeek);
  const d = dayName.toLowerCase();
  if (d === 'friday')        thu.setDate(thu.getDate() + 1);
  else if (d === 'saturday') thu.setDate(thu.getDate() + 2);
  else if (d === 'sunday')   thu.setDate(thu.getDate() + 3);
  return thu;
}

function formatEventDate(date: Date): string {
  // "Fri, 14 Feb"
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: '2-digit',
  });
}

function getDayShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
}

function getDayNum(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

// Avatar palette — plum + coral tones
const AVATAR_BG = [
  'bg-[#4B0F2D] text-white',
  'bg-[#F27C5C]/20 text-[#8B3020]',
  'bg-[#F6B4A8]/50 text-[#6B2010]',
  'bg-[#4B0F2D]/20 text-[#4B0F2D]',
];

// ─── Segmented Control ───────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  const id = useId();
  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekend', label: 'This Weekend' },
    { key: 'past',    label: 'Past Groups'  },
  ];

  return (
    <div
      role="tablist"
      aria-label="Group view"
      className="flex p-1 gap-1 rounded-full bg-[#F0EBE6] border border-[#E5DDD7]"
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          id={`${id}-tab-${key}`}
          aria-selected={value === key}
          aria-controls={`${id}-panel-${key}`}
          onClick={() => onChange(key)}
          className={[
            'flex-1 h-9 rounded-full text-sm font-semibold transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-2',
            value === key
              ? 'bg-[#4B0F2D] text-white shadow-sm'
              : 'text-[#5E555B] hover:text-[#1A0A12]',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Member Avatar Stack ─────────────────────────────────────────────────────

function AvatarStack({
  members,
  myInitials,
  isPlaceholder = false,
}: {
  members: GroupMember[];
  myInitials: string;
  isPlaceholder?: boolean;
}) {
  const shown = isPlaceholder
    ? [null, null, null]  // 3 "?" placeholders
    : members.slice(0, 4);

  const totalCount = isPlaceholder
    ? '3–4'
    : (members.length + 1).toString();  // +1 for current user

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3" role="group" aria-label="Group members">
        {/* Current user always first */}
        <Avatar className="h-11 w-11 ring-2 ring-[#F7F2EE] shadow-sm">
          <AvatarFallback
            className="bg-[#4B0F2D] text-white text-sm font-bold"
            aria-label={`Your initials: ${myInitials}`}
          >
            {myInitials}
          </AvatarFallback>
        </Avatar>

        {isPlaceholder
          ? [0, 1, 2].map(i => (
              <Avatar
                key={i}
                className="h-11 w-11 ring-2 ring-[#F7F2EE] shadow-sm"
                aria-label="Group member — to be revealed Thursday"
              >
                <AvatarFallback className="bg-[#E5DDD7] text-[#9B8F8B] text-sm font-semibold">
                  ?
                </AvatarFallback>
              </Avatar>
            ))
          : shown.map((m, i) => {
              const initials = getInitials(m?.profile.full_name ?? '');
              return (
                <Avatar
                  key={m?.user_id ?? 'unknown'}
                  className="h-11 w-11 ring-2 ring-[#F7F2EE] shadow-sm"
                  aria-label={`Group member initials: ${initials}`}
                >
                  {m?.profile.avatar_url && (
                    <AvatarImage src={m?.profile?.avatar_url ?? ''} alt={m?.profile?.full_name ?? ''} />
                  )}
                  <AvatarFallback className={`text-sm font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
      </div>

      <span className="text-sm text-[#5E555B]">
        {totalCount} doctors
      </span>
    </div>
  );
}

// ─── Active Group Card (matched) ─────────────────────────────────────────────

function MatchedGroupCard({
  group,
  myInitials,
  onOpenChat,
  onDetails,
}: {
  group: MatchGroup;
  myInitials: string;
  onOpenChat: () => void;
  onDetails: () => void;
}) {
  const { day, city } = parseGroupName(group.name);
  const eventDate = getEventDate(group.match_week, day);
  const dateLabel = formatEventDate(eventDate) || formatEventDate(new Date(group.match_week));

  return (
    <article
      aria-label="Your group for this weekend"
      className="rounded-[24px] overflow-hidden border border-[#E5DDD7] shadow-[0_4px_24px_rgba(74,11,45,0.08)]"
    >
      {/* Coral → plum gradient strip */}
      <div
        className="h-[5px]"
        style={{ background: 'linear-gradient(to right, #F27C5C, #4B0F2D)' }}
        aria-hidden="true"
      />

      <div className="bg-white px-5 pt-5 pb-6 space-y-5">
        {/* Header row: badge + city */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.12em] text-[#4B0F2D] uppercase bg-[#4B0F2D]/8 px-2.5 py-1 rounded-full">
            This Weekend
          </span>
          <div className="flex items-center gap-1 text-[#5E555B]" aria-label={`City: ${city}`}>
            <MapPin className="h-3.5 w-3.5 text-[#F27C5C] shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">{city}</span>
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="font-display text-[22px] font-bold text-[#1A0A12] leading-tight">
            {dateLabel}
          </p>
          {group.name && (
            <p className="text-xs text-[#5E555B] mt-0.5 capitalize">
              {day} gathering · {city}
            </p>
          )}
        </div>

        {/* Avatars + count */}
        <AvatarStack members={group.members} myInitials={myInitials} />

        {/* CTAs */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onOpenChat}
            className={[
              'flex-1 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2',
              'bg-[#4B0F2D] text-white shadow-sm hover:bg-[#3A0B22]',
              'transition-all active:scale-[0.97] focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-2',
            ].join(' ')}
            aria-label="Open group chat"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Open chat
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            onClick={onDetails}
            className={[
              'flex-none h-11 px-5 rounded-full text-sm font-medium text-[#1A0A12]',
              'border border-[#E5DDD7] bg-transparent hover:bg-[#F0EBE6]',
              'transition-all active:scale-[0.97] focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-2',
            ].join(' ')}
            aria-label="View group details"
          >
            Details
            <ChevronRight className="h-3.5 w-3.5 inline-block ml-1" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Reserved Card (paid, not matched yet) ───────────────────────────────────

function ReservedGroupCard({
  bookedDay,
  city,
  myInitials,
  onViewTimeline,
}: {
  bookedDay: string;
  city: string;
  myInitials: string;
  onViewTimeline: () => void;
}) {
  // Compute this coming Friday as base for date display
  const now = new Date();
  const dow = now.getDay();
  const daysToFriday = dow === 0 ? 5 : dow === 6 ? 6 : 5 - dow;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);

  const dayOffset: Record<string, number> = { friday: 0, saturday: 1, sunday: 2 };
  const eventDate = new Date(friday);
  eventDate.setDate(friday.getDate() + (dayOffset[bookedDay.toLowerCase()] ?? 0));
  const dateLabel = formatEventDate(eventDate);

  const dayLabel = bookedDay.charAt(0).toUpperCase() + bookedDay.slice(1);

  return (
    <article
      aria-label="Your reservation for this weekend — group not yet revealed"
      className="rounded-[24px] overflow-hidden border border-[#E5DDD7] shadow-[0_4px_24px_rgba(74,11,45,0.08)]"
    >
      <div
        className="h-[5px]"
        style={{ background: 'linear-gradient(to right, #F27C5C, #4B0F2D)' }}
        aria-hidden="true"
      />

      <div className="bg-white px-5 pt-5 pb-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.12em] text-[#4B0F2D] uppercase bg-[#4B0F2D]/8 px-2.5 py-1 rounded-full">
            This Weekend
          </span>
          <div className="flex items-center gap-1 text-[#5E555B]">
            <MapPin className="h-3.5 w-3.5 text-[#F27C5C] shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">{city}</span>
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="font-display text-[22px] font-bold text-[#1A0A12] leading-tight">
            {dateLabel}
          </p>
          <p className="text-xs text-[#5E555B] mt-0.5">{dayLabel} gathering · {city}</p>
        </div>

        {/* Placeholder avatars */}
        <AvatarStack members={[]} myInitials={myInitials} isPlaceholder />

        {/* Reveal notice */}
        <div
          className="flex items-start gap-3 bg-[#4B0F2D]/5 rounded-[14px] px-4 py-3"
          role="note"
          aria-label="Group reveals Thursday"
        >
          <Calendar className="h-4 w-4 text-[#4B0F2D] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[#1A0A12]">Group reveals Thursday.</p>
            <p className="text-xs text-[#5E555B] mt-0.5">You'll get a notification Thursday evening.</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onViewTimeline}
          className={[
            'w-full h-11 rounded-full text-sm font-semibold',
            'border border-[#4B0F2D] text-[#4B0F2D] bg-transparent hover:bg-[#4B0F2D]/5',
            'flex items-center justify-center gap-2 transition-all active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-2',
          ].join(' ')}
          aria-label="View booking timeline"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          View timeline
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

// ─── Completed Card (post-gathering rating) ───────────────────────────────────

function CompletedGroupCard({
  group,
  myInitials,
  userId,
  alreadyEvaluated,
}: {
  group: MatchGroup;
  myInitials: string;
  userId: string;
  alreadyEvaluated: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(alreadyEvaluated);
  const [sending, setSending] = useState(false);
  const { day, city } = parseGroupName(group.name);

  const handleRate = useCallback(async () => {
    if (rating === 0) return;
    setSending(true);
    const ok = await submitEvaluation({
      user_id: userId,
      group_id: group.id,
      match_week: group.match_week,
      met_in_person: true,
      meeting_rating: rating,
      real_connection: rating >= 4,
      feedback_text: null,
      photos_urls: null,
    });
    setSending(false);
    if (ok) setSent(true);
  }, [rating, userId, group]);

  return (
    <article
      aria-label="Completed gathering"
      className="rounded-[24px] overflow-hidden border border-[#E5DDD7] shadow-[0_4px_24px_rgba(74,11,45,0.08)]"
    >
      <div
        className="h-[5px]"
        style={{ background: 'linear-gradient(to right, #4B0F2D, #F27C5C)' }}
        aria-hidden="true"
      />

      <div className="bg-white px-5 pt-5 pb-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-lg font-bold text-[#1A0A12]">
              {day || 'Weekend'} Gathering
            </p>
            <p className="text-xs text-[#5E555B] mt-0.5">
              {formatEventDate(getEventDate(group.match_week, day))} · {city}
            </p>
          </div>
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
            Completed
          </span>
        </div>

        <AvatarStack members={group.members} myInitials={myInitials} />

        {!sent ? (
          <div className="space-y-3 pt-1">
            <p className="text-sm font-medium text-[#1A0A12] text-center">How was your gathering?</p>
            <div
              className="flex items-center justify-center gap-1"
              role="radiogroup"
              aria-label="Rate your gathering from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  className="h-11 w-11 flex items-center justify-center transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B0F2D] rounded-full"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hover || rating)
                        ? 'text-[#F27C5C] fill-[#F27C5C]'
                        : 'text-[#E5DDD7]'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <button
              onClick={handleRate}
              disabled={rating === 0 || sending}
              className={[
                'w-full h-11 rounded-full text-sm font-semibold transition-all active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-2',
                rating > 0 && !sending
                  ? 'bg-[#F27C5C] text-white hover:bg-[#E0613F]'
                  : 'bg-[#F0EBE6] text-[#9B8F8B] cursor-not-allowed',
              ].join(' ')}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" aria-hidden="true" />
              ) : 'Share feedback'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <p className="text-sm font-medium text-[#1A0A12]">Thanks for your feedback!</p>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onChooseDay }: { onChooseDay: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-14 px-6 text-center">
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #F6B4A8 0%, #F27C5C22 100%)' }}
        aria-hidden="true"
      >
        <Calendar className="h-7 w-7 text-[#F27C5C]" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-[#1A0A12]">No gathering yet</h3>
        <p className="text-sm text-[#5E555B] leading-relaxed max-w-[240px]">
          Choose a day this weekend to join a curated group of doctors.
        </p>
      </div>
      <button
        onClick={onChooseDay}
        className={[
          'h-12 px-8 rounded-full text-sm font-bold text-white',
          'transition-all active:scale-[0.97] shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-2',
        ].join(' ')}
        style={{ background: 'linear-gradient(135deg, #F27C5C 0%, #4B0F2D 100%)' }}
      >
        Choose a weekend day
      </button>
    </div>
  );
}

// ─── Past Group Card (list item) ─────────────────────────────────────────────

function PastGroupCard({
  group,
  onClick,
}: {
  group: PastGroupDisplay;
  onClick: () => void;
}) {
  return (
    <article
      className="flex items-center gap-4 bg-white border border-[#E5DDD7] rounded-[18px] p-4 shadow-[0_2px_12px_rgba(74,11,45,0.05)]"
      aria-label={`Past gathering on ${group.date} in ${group.city}`}
    >
      {/* Date block */}
      <div
        className="h-12 w-12 rounded-[14px] flex flex-col items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #4B0F2D0D 0%, #F27C5C11 100%)' }}
        aria-hidden="true"
      >
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#5E555B]">
          {group.day}
        </span>
        <span className="text-base font-bold text-[#1A0A12] leading-tight">
          {group.dateNum}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A0A12] truncate">{group.city}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex -space-x-1.5" aria-label="Past group members">
            {group.members.slice(0, 4).map((m, i) => (
              <div
                key={`${m.initials}-${i}`}
                className="h-5 w-5 rounded-full border border-white flex items-center justify-center text-[7px] font-bold"
                style={{ background: i % 2 === 0 ? '#4B0F2D22' : '#F27C5C22' }}
                aria-label={`Member initials: ${m.initials}`}
              >
                <span className={i % 2 === 0 ? 'text-[#4B0F2D]' : 'text-[#8B3020]'}>
                  {m.initials}
                </span>
              </div>
            ))}
          </div>
          <span className="text-xs text-[#5E555B]">{group.members.length} doctors</span>
        </div>
      </div>

      {/* View button */}
      <button
        onClick={onClick}
        className={[
          'shrink-0 h-9 px-4 rounded-full text-xs font-semibold text-[#1A0A12]',
          'border border-[#E5DDD7] bg-transparent hover:bg-[#F0EBE6]',
          'flex items-center gap-1 transition-colors min-h-[44px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B0F2D] focus-visible:ring-offset-1',
        ].join(' ')}
        aria-label={`View recap of ${group.city} gathering on ${group.date}`}
      >
        View recap
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </article>
  );
}

// ─── Past Groups Panel ────────────────────────────────────────────────────────

function PastGroupsPanel({
  groups,
  onViewGroup,
}: {
  groups: PastGroupDisplay[];
  onViewGroup: (g: PastGroupDisplay) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="h-14 w-14 rounded-full bg-[#F0EBE6] flex items-center justify-center">
          <Archive className="h-6 w-6 text-[#9B8F8B]" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#1A0A12]">No past gatherings yet</p>
          <p className="text-xs text-[#5E555B]">After your first weekend, your history appears here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(g => (
        <PastGroupCard key={g.id} group={g} onClick={() => onViewGroup(g)} />
      ))}
    </div>
  );
}

// ─── Past Group Detail Sheet ──────────────────────────────────────────────────

function PastGroupSheet({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: PastGroupDisplay | null;
}) {
  if (!group) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] max-h-[85vh] overflow-y-auto p-0 gap-0 border-0"
        style={{ background: '#FAF7F4' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-[#D5CCC7]" aria-hidden="true" />
        </div>

        <div className="px-6 pb-8 space-y-6">
          <SheetHeader className="text-left pt-3 space-y-1">
            <SheetTitle className="font-display text-xl font-bold text-[#1A0A12]">
              {group.city} Gathering
            </SheetTitle>
            <SheetDescription className="text-sm text-[#5E555B]">
              {group.date}
            </SheetDescription>
          </SheetHeader>

          {/* Members */}
          <section aria-labelledby="members-heading">
            <p
              id="members-heading"
              className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#9B8F8B] mb-3"
            >
              Group members
            </p>
            <div className="space-y-3">
              {group.members.map((m, i) => (
                <div key={`${m.name}-${i}`} className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-[#4B0F2D]/10 text-[#4B0F2D] text-sm font-bold">
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-[#1A0A12]">{m.name}</p>
                    {m.specialty && (
                      <p className="text-xs text-[#5E555B]">{m.specialty}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px bg-[#E5DDD7]" aria-hidden="true" />

          {/* Archived chat */}
          <section aria-labelledby="chat-heading">
            <p
              id="chat-heading"
              className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#9B8F8B] mb-3"
            >
              Group chat
            </p>

            {group.conversationId ? (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] bg-[#F0EBE6] border border-[#E5DDD7]"
                role="note"
              >
                <Lock className="h-3.5 w-3.5 text-[#9B8F8B] shrink-0" aria-hidden="true" />
                <p className="text-[12px] text-[#5E555B]">
                  Chat is archived — read-only view available.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#9B8F8B]">No chat for this gathering.</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function GroupCardSkeleton() {
  return (
    <div className="rounded-[24px] overflow-hidden border border-[#E5DDD7] bg-white">
      <div className="h-[5px] bg-[#E5DDD7]" aria-hidden="true" />
      <div className="px-5 pt-5 pb-6 space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-7 w-40 rounded-lg" />
        <div className="flex -space-x-3">
          {[0,1,2,3].map(i => (
            <Skeleton key={i} className="h-11 w-11 rounded-full ring-2 ring-white" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-11 rounded-full" />
          <Skeleton className="w-24 h-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Matches() {
  const navigate  = useLocalizedNavigate();
  const panelId   = useId();

  const [tab,              setTab]              = useState<Tab>('weekend');
  const [gatheringState,   setGatheringState]   = useState<GatheringState>('loading');
  const [userId,           setUserId]           = useState<string | null>(null);
  const [myInitials,       setMyInitials]       = useState('ME');
  const [city,             setCity]             = useState('Berlin');
  const [currentGroup,     setCurrentGroup]     = useState<MatchGroup | null>(null);
  const [bookedDay,        setBookedDay]        = useState<string>('friday');
  const [pastGroups,       setPastGroups]       = useState<PastGroupDisplay[]>([]);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [sheetOpen,        setSheetOpen]        = useState(false);
  const [sheetGroup,       setSheetGroup]       = useState<PastGroupDisplay | null>(null);

  // ── Data loading ───────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (!user) { setGatheringState('none'); return; }

        setUserId(user.id);

        const [profile, groups, booking] = await Promise.all([
          getProfile(user.id),
          fetchUserGroups(user.id),
          getActiveWeekendBooking(user.id),
        ]);

        // Profile
        const userCity = profile?.city ?? 'Berlin';
        setCity(userCity);
        if (profile?.full_name) setMyInitials(getInitials(profile.full_name));

        // Separate current vs past groups
        const currentWeekGroup = groups.find(g => isCurrentWeek(g.match_week));
        const pastWeekGroups   = groups.filter(g => !isCurrentWeek(g.match_week));

        const pastDisplay: PastGroupDisplay[] = pastWeekGroups.map(g => {
          const { city: gCity } = parseGroupName(g.name);
          return {
            id:             g.id,
            name:           g.name,
            day:            getDayShort(g.match_week),
            date:           formatShortDate(g.match_week),
            dateNum:        getDayNum(g.match_week),
            city:           gCity || g.members[0]?.profile.city || userCity,
            members:        g.members.map(m => ({
              initials:  getInitials(m.profile.full_name),
              name:      m.profile.full_name ?? 'Doctor',
              specialty: m.preferences?.specialty ?? '',
              avatarUrl: m.profile.avatar_url,
            })),
            conversationId: g.conversation_id,
            matchWeek:      g.match_week,
          };
        });

        setPastGroups(pastDisplay);

        // Determine state
        if (currentWeekGroup) {
          setCurrentGroup(currentWeekGroup);
          const now       = new Date();
          const sundayEnd = new Date(currentWeekGroup.match_week);
          sundayEnd.setDate(sundayEnd.getDate() + 3);

          if (now > sundayEnd) {
            const evaluated = await hasSubmittedEvaluation(user.id, currentWeekGroup.id);
            setAlreadyEvaluated(evaluated);
            setGatheringState('completed');
          } else {
            setGatheringState('matched');
          }
        } else if (booking?.paid) {
          setBookedDay(booking.day || 'friday');
          setGatheringState('reserved');
        } else {
          setGatheringState('none');
        }
      } catch (err) {
        console.error('Matches load error:', err);
        setGatheringState('none');
      }
    }

    load();
  }, []);

  // ── Handlers ──────────────────────────────────────────
  const handleOpenChat = useCallback(async () => {
    if (!currentGroup) return;

    // Happy path — conversation already exists
    if (currentGroup.conversation_id) {
      navigate(`/chat/${currentGroup.conversation_id}`);
      return;
    }

    // No conversation row yet — create it (UNIQUE ON group_id makes this safe to call twice)
    try {
      const { data, error } = await getSupabaseClient()
        .from('group_conversations')
        .upsert({ group_id: currentGroup.id }, { onConflict: 'group_id' })
        .select('id')
        .single();

      if (!error && data?.id) {
        navigate(`/chat/${data.id}`);
      } else {
        // Fallback: try to read the conversation that may already exist
        const { data: existing } = await getSupabaseClient()
          .from('group_conversations')
          .select('id')
          .eq('group_id', currentGroup.id)
          .single();
        navigate(existing?.id ? `/chat/${existing.id}` : '/chat');
      }
    } catch {
      navigate('/chat');
    }
  }, [navigate, currentGroup]);

  const handleDetails = useCallback(() => {
    if (!currentGroup) return;
    const { city: gCity } = parseGroupName(currentGroup.name);
    setSheetGroup({
      id:             currentGroup.id,
      name:           currentGroup.name,
      day:            getDayShort(currentGroup.match_week),
      date:           formatShortDate(currentGroup.match_week),
      dateNum:        getDayNum(currentGroup.match_week),
      city:           gCity || city,
      members:        currentGroup.members.map(m => ({
        initials:  getInitials(m.profile.full_name),
        name:      m.profile.full_name ?? 'Doctor',
        specialty: m.preferences?.specialty ?? '',
        avatarUrl: m.profile.avatar_url,
      })),
      conversationId: currentGroup.conversation_id,
      matchWeek:      currentGroup.match_week,
    });
    setSheetOpen(true);
  }, [currentGroup, city]);

  const handleViewPastGroup = useCallback((g: PastGroupDisplay) => {
    setSheetGroup(g);
    setSheetOpen(true);
  }, []);

  // ── Render ─────────────────────────────────────────────
  return (
    <DashboardLayout>
      <main
        className="container mx-auto px-4 py-6 max-w-lg space-y-6"
        style={{ background: '#F7F2EE' }}
      >
        {/* ── Page header ──────────────────────────────── */}
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-[#1A0A12] tracking-tight">
            Your Groups
          </h1>
          <p className="text-sm text-[#5E555B] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#F27C5C]" aria-hidden="true" />
            {city} · Verified doctors only
          </p>
        </header>

        {/* ── Segmented control ─────────────────────────── */}
        <SegmentedControl value={tab} onChange={setTab} />

        {/* ── This Weekend panel ───────────────────────── */}
        <div
          id={`${panelId}-panel-weekend`}
          role="tabpanel"
          aria-labelledby={`${panelId}-tab-weekend`}
          hidden={tab !== 'weekend'}
        >
          {tab === 'weekend' && (
            <>
              {gatheringState === 'loading' && <GroupCardSkeleton />}

              {gatheringState === 'none' && (
                <EmptyState onChooseDay={() => navigate('/dashboard')} />
              )}

              {gatheringState === 'reserved' && (
                <ReservedGroupCard
                  bookedDay={bookedDay}
                  city={city}
                  myInitials={myInitials}
                  onViewTimeline={() => navigate('/dashboard')}
                />
              )}

              {gatheringState === 'matched' && currentGroup && (
                <MatchedGroupCard
                  group={currentGroup}
                  myInitials={myInitials}
                  onOpenChat={handleOpenChat}
                  onDetails={handleDetails}
                />
              )}

              {gatheringState === 'completed' && currentGroup && userId && (
                <CompletedGroupCard
                  group={currentGroup}
                  myInitials={myInitials}
                  userId={userId}
                  alreadyEvaluated={alreadyEvaluated}
                />
              )}
            </>
          )}
        </div>

        {/* ── Past Groups panel ────────────────────────── */}
        <div
          id={`${panelId}-panel-past`}
          role="tabpanel"
          aria-labelledby={`${panelId}-tab-past`}
          hidden={tab !== 'past'}
        >
          {tab === 'past' && (
            <PastGroupsPanel
              groups={pastGroups}
              onViewGroup={handleViewPastGroup}
            />
          )}
        </div>

        <div className="h-4" aria-hidden="true" />
      </main>

      {/* ── Detail sheet ─────────────────────────────── */}
      <PastGroupSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        group={sheetGroup}
      />
    </DashboardLayout>
  );
}
