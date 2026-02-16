'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Calendar, ChevronDown } from "lucide-react";

interface ReservedCardProps {
  dayLabel: string;
  dateFormatted: string;
  timeSlot: string;
}

export default function ReservedCard({ dayLabel, dateFormatted, timeSlot }: ReservedCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      {/* Accent strip */}
      <div className="h-2 bg-accent/10" aria-hidden="true" />

      <div className="p-6 space-y-4">
        {/* Confirmation Header */}
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-0.5" />
          <h2 className="font-heading font-semibold text-xl text-foreground tracking-tight">
            You're in this {dayLabel}
          </h2>
        </div>

        {/* Details */}
        <div className="pl-9 space-y-1">
          <p className="text-[15px] text-muted-foreground">
            {dateFormatted} · {timeSlot}
          </p>
          <p className="text-sm text-muted-foreground">
            Venue + group revealed Thursday
          </p>
        </div>

        {/* Match Badge */}
        <div className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] bg-primary/5 text-sm font-medium text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Match revealed Thursday
        </div>

        {/* View details accordion */}
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex items-center justify-center gap-1 w-full text-sm text-accent font-medium py-1 min-h-[44px]"
        >
          View details
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
        </button>
        {detailsOpen && (
          <div className="text-xs text-muted-foreground space-y-1.5 pt-1 animate-fade-in">
            <p>Free cancellation until Wednesday 9 pm.</p>
            <p>No-shows are charged in full.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
