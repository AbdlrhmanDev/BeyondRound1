'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

type BarState =
  | { type: "hidden" }
  | { type: "reserve"; dayName: string; onAction: () => void }
  | { type: "verifying" }
  | { type: "confirmed"; dayName: string }
  | { type: "chat"; onAction: () => void }
  | { type: "next"; onAction: () => void };

interface StickyBottomBarProps {
  state: BarState;
}

export default function StickyBottomBar({ state }: StickyBottomBarProps) {
  if (state.type === "hidden") return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(58,11,34,0.06)] md:hidden"
      aria-live="polite"
    >
      {state.type === "reserve" && (
        <Button
          onClick={state.onAction}
          className="w-full h-14 text-base font-heading font-semibold bg-accent hover:bg-accent/90 text-white rounded-full shadow-sm transition-all active:scale-[0.98]"
        >
          Reserve {state.dayName}
        </Button>
      )}

      {state.type === "verifying" && (
        <Button
          disabled
          className="w-full h-14 text-base font-medium bg-muted text-muted-foreground rounded-full cursor-not-allowed"
        >
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Verification in progress
        </Button>
      )}

      {state.type === "confirmed" && (
        <div className="w-full h-14 flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-full font-medium text-base">
          <CheckCircle2 className="h-5 w-5" />
          You're in — {state.dayName}
        </div>
      )}

      {state.type === "chat" && (
        <Button
          onClick={state.onAction}
          className="w-full h-14 text-base font-heading font-semibold bg-accent hover:bg-accent/90 text-white rounded-full shadow-sm transition-all active:scale-[0.98]"
        >
          Open group chat
        </Button>
      )}

      {state.type === "next" && (
        <Button
          onClick={state.onAction}
          className="w-full h-14 text-base font-heading font-semibold bg-accent hover:bg-accent/90 text-white rounded-full shadow-sm transition-all active:scale-[0.98]"
        >
          Choose next weekend
        </Button>
      )}
    </div>
  );
}
