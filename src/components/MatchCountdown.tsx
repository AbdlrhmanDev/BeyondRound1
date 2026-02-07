'use client';

import { useState, useEffect, memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getNextThursday = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const currentHour = now.getHours();

  // If it's Thursday and before 4 PM, use today at 4 PM
  if (dayOfWeek === 4 && currentHour < 16) {
    const today = new Date(now);
    today.setHours(16, 0, 0, 0);
    return today;
  }

  // Calculate days until next Thursday
  let daysUntilThursday;
  if (dayOfWeek === 4) {
    daysUntilThursday = 7;
  } else if (dayOfWeek < 4) {
    daysUntilThursday = 4 - dayOfWeek;
  } else {
    daysUntilThursday = 7 - (dayOfWeek - 4);
  }

  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(16, 0, 0, 0);

  return nextThursday;
};

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const GroupCountdown = () => {
  const [nextThursday, setNextThursday] = useState<Date>(getNextThursday());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(nextThursday));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(nextThursday);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        const newNextThursday = getNextThursday();
        setNextThursday(newNextThursday);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextThursday]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  };

  const TimeUnit = memo(({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-background rounded-md px-2.5 py-1.5 min-w-[40px] text-center border border-border">
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
    </div>
  ));

  TimeUnit.displayName = "TimeUnit";

  return (
    <Card className="rounded-xl bg-card border border-border">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left - Info */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">
                New groups form Thursday
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {formatDate(nextThursday)}
              </p>
            </div>
          </div>

          {/* Right - Countdown */}
          <div className="flex items-center gap-1">
            <TimeUnit value={timeLeft.days} label="days" />
            <span className="text-muted-foreground/50 text-sm self-start mt-1.5">:</span>
            <TimeUnit value={timeLeft.hours} label="hrs" />
            <span className="text-muted-foreground/50 text-sm self-start mt-1.5">:</span>
            <TimeUnit value={timeLeft.minutes} label="min" />
            <span className="text-muted-foreground/50 text-sm self-start mt-1.5">:</span>
            <TimeUnit value={timeLeft.seconds} label="sec" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCountdown;
