'use client';

import { Card } from "@/components/ui/card";
import { type WeekendDay } from "@/services/eventService";

interface ChooseDayModuleProps {
  weekendDays: WeekendDay[];
  onSelectDay: (day: WeekendDay) => void;
}

export default function ChooseDayModule({ weekendDays, onSelectDay }: ChooseDayModuleProps) {
  const totalSpots = weekendDays.reduce((sum, d) => sum + d.spotsLeft, 0);

  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      {/* Gradient strip */}
      <div className="h-2 bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" aria-hidden="true" />

      <div className="p-5 space-y-4">
        {/* Title + Helper */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-heading font-semibold text-foreground tracking-tight">
            Choose your day
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a day. We'll match you with your group by Thursday.
          </p>
          <p className="text-xs font-medium text-accent">
            {totalSpots > 0
              ? `${totalSpots} spots this weekend — choose before they fill`
              : "This weekend is filling up fast"}
          </p>
        </div>

        {/* Day Cards */}
        <div className="space-y-3">
          {weekendDays.map((day) => (
            <button
              key={day.dayName}
              onClick={() => !day.soldOut && onSelectDay(day)}
              disabled={day.soldOut}
              aria-label={
                day.soldOut
                  ? `${day.dateFormatted} — filled`
                  : `Reserve ${day.dateFormatted}, ${day.timeSlot}`
              }
              aria-disabled={day.soldOut}
              className={`
                w-full text-left rounded-[20px] border p-5 transition-all duration-200
                ${day.soldOut
                  ? "bg-muted/20 border-border cursor-not-allowed opacity-50"
                  : "bg-background border-primary/8 shadow-subtle hover:shadow-soft hover:border-primary/15 active:scale-[0.99]"
                }
              `}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-[17px] text-foreground">
                    {day.dateFormatted}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {day.timeSlot} · Venue revealed Thu
                  </p>
                </div>

                {day.soldOut ? (
                  <span className="text-sm font-medium text-muted-foreground/50 shrink-0">
                    Filled
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold shrink-0 min-h-[44px]">
                    Reserve {day.dayName}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
