'use client';

import { ArrowRight, Coffee, Footprints, UtensilsCrossed, Dumbbell } from "lucide-react";
import type { Event, MeetupType } from "@/services/eventService";
import { MEETUP_TYPE_LABELS } from "@/services/eventService";
import type { EventWithSpots } from "@/services/eventService";
import { format } from "date-fns";

const MEETUP_ICONS: Record<MeetupType, React.ElementType> = {
  brunch: UtensilsCrossed,
  coffee: Coffee,
  walk: Footprints,
  sports: Dumbbell,
  dinner: UtensilsCrossed,
};

const MEETUP_ICON_STYLES: Record<MeetupType, { bg: string; text: string }> = {
  brunch: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300" },
  coffee: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-300" },
  walk: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
  sports: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  dinner: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300" },
};

interface MeetupCardProps {
  event: Event | EventWithSpots;
  onSelect: (event: Event) => void;
  isRecommended?: boolean;
}

export function MeetupCard({ event, onSelect, isRecommended }: MeetupCardProps) {
  const Icon = MEETUP_ICONS[event.meetup_type] || UtensilsCrossed;
  const styles = MEETUP_ICON_STYLES[event.meetup_type] || MEETUP_ICON_STYLES.brunch;
  const label = MEETUP_TYPE_LABELS[event.meetup_type] || event.meetup_type;
  const date = new Date(event.date_time);
  const timeStr = format(date, "HH:mm");
  const dateStr = format(date, "EEEE, MMM d");
  const spotsLeft = "spots_left" in event ? event.spots_left : undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="w-full text-left group rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 min-w-0">
          <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${styles.bg} ${styles.text}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-semibold text-foreground">{label}</span>
              {isRecommended && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-orange-500 text-white">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dateStr} · {timeStr}
            </p>
            {spotsLeft !== undefined && spotsLeft > 0 && spotsLeft <= 6 && (
              <p className="text-xs text-muted-foreground/80 mt-0.5">Only {spotsLeft} spots left</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </div>
    </button>
  );
}
