'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface CalculateScoreBadgeProps {
  onComplete?: () => void;
  duration?: number;
  className?: string;
  label?: string;
  completeLabel?: string;
  allDoneTitle?: string;
  allDoneSubtitle?: string;
  goToDashboardLabel?: string;
}

export function CalculateScoreBadge({
  onComplete,
  duration = 2500,
  className,
  label = 'Calculating your match score...',
  completeLabel = 'Profile ready!',
  allDoneTitle = 'All Done!',
  allDoneSubtitle = "You've completed all onboarding steps.",
  goToDashboardLabel = 'Go to Dashboard',
}: CalculateScoreBadgeProps) {
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const endScore = 100;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 1.5);
      const currentScore = Math.round(eased * endScore);
      setScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
        setTimeout(() => setShowAllDone(true), 600);
      }
    };

    requestAnimationFrame(animate);
  }, [duration]);

  if (showAllDone) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-foreground dark:bg-background animate-in fade-in duration-300',
          className
        )}
      >
        <div className="flex flex-col items-center gap-6 px-6 text-center animate-in zoom-in-95 duration-300">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground dark:text-foreground">
            {allDoneTitle}
          </h1>
          <p className="text-base text-primary-foreground/70 dark:text-muted-foreground max-w-sm">
            {allDoneSubtitle}
          </p>
          <Button
            size="lg"
            onClick={onComplete}
            className="rounded-xl px-8 font-semibold shadow-lg"
          >
            {goToDashboardLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300',
        className
      )}
    >
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card border border-border shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-500">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {isComplete ? completeLabel : label}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span
              className={cn(
                'text-4xl font-bold tabular-nums transition-all duration-150',
                'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
              )}
            >
              {score}
            </span>
            <span className="text-2xl font-medium text-muted-foreground">%</span>
          </div>
        </div>
        <div className="w-full">
          <Progress value={score} className="h-2" />
        </div>
      </div>
    </div>
  );
}
