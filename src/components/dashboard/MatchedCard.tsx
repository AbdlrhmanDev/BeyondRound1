'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface MatchedMember {
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface MatchedCardProps {
  dayLabel: string; // "Saturday, 22 February"
  time: string; // "7 pm"
  venue: string; // "Sapori"
  neighborhood: string; // "Mitte, Berlin"
  members: MatchedMember[];
  onOpenChat: () => void;
}

export default function MatchedCard({
  dayLabel,
  time,
  venue,
  neighborhood,
  members,
  onOpenChat,
}: MatchedCardProps) {
  return (
    <Card className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
      <CardContent className="p-6 space-y-5">
        {/* Title */}
        <h2 className="font-heading font-semibold text-xl text-foreground tracking-tight">
          Your group is ready
        </h2>

        {/* Event Details */}
        <div className="space-y-1">
          <p className="text-[15px] font-medium text-foreground">
            {dayLabel} · {time}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {venue} · {neighborhood}
          </p>
        </div>

        {/* Member Avatars */}
        <div className="flex flex-wrap gap-4 justify-center py-2">
          {members.map((member) => {
            const firstName = member.profile.full_name?.split(" ")[0] || "?";
            const initials = member.profile.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2) || "?";

            return (
              <div key={member.user_id} className="flex flex-col items-center gap-1.5">
                <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-border/10">
                  <AvatarImage src={member.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-medium">
                  {firstName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Open Chat CTA */}
        <Button
          onClick={onOpenChat}
          variant="outline"
          className="w-full h-12 text-base font-medium text-accent border-accent hover:bg-accent/5 rounded-full transition-all active:scale-[0.98]"
        >
          Open chat
        </Button>
      </CardContent>
    </Card>
  );
}
