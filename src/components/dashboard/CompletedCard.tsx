'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompletedCardProps {
  dayLabel: string;
  onRate: () => void;
  onChooseNext: () => void;
  hasRated: boolean;
}

export default function CompletedCard({
  dayLabel,
  onRate,
  onChooseNext,
  hasRated,
}: CompletedCardProps) {
  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <div className="py-10 px-6 text-center space-y-5">
        <h2 className="font-heading font-semibold text-xl text-foreground tracking-tight">
          How was {dayLabel}?
        </h2>

        {!hasRated && (
          <Button
            onClick={onRate}
            variant="outline"
            className="w-full h-12 text-base font-medium text-primary border-primary hover:bg-primary/5 rounded-full transition-all active:scale-[0.98]"
          >
            Rate your experience
          </Button>
        )}

        <div className="space-y-2">
          {!hasRated && (
            <p className="text-sm text-muted-foreground">Ready for next weekend?</p>
          )}
          <Button
            onClick={onChooseNext}
            className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 text-white rounded-full shadow-sm transition-all active:scale-[0.98]"
          >
            Choose your next meetup
          </Button>
        </div>
      </div>
    </Card>
  );
}
