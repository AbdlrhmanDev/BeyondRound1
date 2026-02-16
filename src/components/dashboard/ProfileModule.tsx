'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, ChevronRight } from "lucide-react";

interface ProfileModuleProps {
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  completionPercent: number;
  onNavigate: () => void;
}

export default function ProfileModule({
  name,
  avatarUrl,
  isVerified,
  completionPercent,
  onNavigate,
}: ProfileModuleProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <button
      onClick={onNavigate}
      className="w-full bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-soft active:scale-[0.99] min-h-[44px]"
      aria-label={`View profile — ${name}`}
    >
      <Avatar className="h-12 w-12 border-2 border-accent/20 shrink-0">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="font-heading text-base font-semibold text-foreground truncate">{name}</p>

        <div className="flex items-center gap-1.5">
          {isVerified ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />
              <span className="text-xs text-muted-foreground">Verified</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Verification pending</span>
            </>
          )}
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{completionPercent}% complete</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
