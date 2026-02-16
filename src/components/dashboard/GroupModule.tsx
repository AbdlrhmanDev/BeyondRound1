'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Lock, MapPin, ChevronDown } from "lucide-react";

interface GroupMember {
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupModuleProps {
  isLocked: boolean;
  // Unlocked props
  members?: GroupMember[];
  dayLabel?: string;
  time?: string;
  venue?: string;
  neighborhood?: string;
  onOpenChat?: () => void;
  // Past group
  isPast?: boolean;
}

export default function GroupModule({
  isLocked,
  members = [],
  dayLabel,
  time,
  venue,
  neighborhood,
  onOpenChat,
  isPast = false,
}: GroupModuleProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (isLocked) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm" aria-label="Your group — revealed Thursday">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-4 w-4 text-muted-foreground/50" />
          <h3 className="font-heading font-semibold text-base text-foreground">
            Revealed Thursday
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          We're curating a group of verified doctors in your area.
        </p>
        {/* Placeholder avatars */}
        <div className="flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 w-10 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-xs text-muted-foreground/40 font-medium">?</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Past group
  if (isPast) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Past group
        </p>
        <div className="flex -space-x-2 mb-2">
          {members.slice(0, 4).map((m) => (
            <Avatar key={m.user_id} className="h-9 w-9 border-2 border-background">
              <AvatarImage src={m.profile.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {m.profile.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Chat archived</p>
      </div>
    );
  }

  // Unlocked — matched
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <h3 className="font-heading font-semibold text-lg text-foreground">
        Your group is ready
      </h3>

      {/* Event details */}
      <div className="space-y-1">
        {dayLabel && (
          <p className="text-sm font-medium text-foreground">
            {dayLabel}{time ? ` · ${time}` : ""}
          </p>
        )}
        {venue && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {venue}{neighborhood ? ` · ${neighborhood}` : ""}
          </p>
        )}
      </div>

      {/* Member avatars with names */}
      <div className="flex flex-wrap gap-4 justify-center py-1">
        {members.map((m) => {
          const firstName = m.profile.full_name?.split(" ")[0] || "?";
          const initials = m.profile.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2) || "?";
          return (
            <div key={m.user_id} className="flex flex-col items-center gap-1.5">
              <Avatar className="h-11 w-11 border-2 border-background ring-1 ring-border/10">
                <AvatarImage src={m.profile.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-medium">{firstName}</span>
            </div>
          );
        })}
      </div>

      {/* Open Chat CTA */}
      {onOpenChat && (
        <Button
          onClick={onOpenChat}
          variant="outline"
          className="w-full h-12 text-base font-medium text-accent border-accent hover:bg-accent/5 rounded-full transition-all active:scale-[0.98]"
        >
          Open chat
        </Button>
      )}

      {/* View details accordion */}
      <button
        onClick={() => setDetailsOpen(!detailsOpen)}
        className="flex items-center justify-center gap-1 w-full text-sm text-accent font-medium py-1 min-h-[44px]"
      >
        View details
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
      </button>
      {detailsOpen && (
        <div className="text-xs text-muted-foreground space-y-2 pt-1 animate-fade-in">
          <p>Venue and group interests will appear here once confirmed.</p>
        </div>
      )}
    </div>
  );
}
