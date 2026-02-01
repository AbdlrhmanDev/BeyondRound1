import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Sparkles, Users } from "lucide-react";

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
    // If it's Thursday at or after 4 PM, get next Thursday
    daysUntilThursday = 7;
  } else if (dayOfWeek < 4) {
    // If it's before Thursday, get this week's Thursday
    daysUntilThursday = 4 - dayOfWeek;
  } else {
    // If it's after Thursday, get next week's Thursday
    daysUntilThursday = 7 - (dayOfWeek - 4);
  }
  
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(16, 0, 0, 0); // 4 PM on Thursday
  nextThursday.setMinutes(0, 0);
  
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

const MatchCountdown = () => {
  const [nextThursday, setNextThursday] = useState<Date>(getNextThursday());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(nextThursday));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(nextThursday);
      setTimeLeft(newTimeLeft);
      
      // If countdown finished, calculate next Thursday
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
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative bg-background/95 dark:bg-background/98 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[70px] text-center 
        shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.05)]
        dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.12)]
        border border-border/50 dark:border-border/60">
        <span className="font-display text-2xl font-bold text-foreground tracking-tight leading-none block">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );

  return (
    <Card className="relative border-0 rounded-2xl overflow-hidden 
      bg-card/50 backdrop-blur-sm
      transition-all duration-300 ease-out
      shadow-[0_1px_2px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.03)]
      dark:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.1)]
      hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.05)]
      dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.14)]
      border border-border/30">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Section - Event Details */}
          <div className="flex items-start gap-3 flex-1">
            <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-primary" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-display font-medium text-base text-foreground">
                  Next Group Matching
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatDate(nextThursday)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Groups are created every Thursday at 4 PM based on shared interests and specialty.
              </p>
            </div>
          </div>
          
          {/* Right Section - Countdown Timer */}
          <div className="flex items-center justify-center lg:justify-end gap-2">
            <TimeUnit value={timeLeft.days} label="DAYS" />
            <span className="text-primary text-xs leading-none">:</span>
            <TimeUnit value={timeLeft.hours} label="HOURS" />
            <span className="text-primary text-xs leading-none">:</span>
            <TimeUnit value={timeLeft.minutes} label="MINS" />
            <span className="text-primary text-xs leading-none">:</span>
            <TimeUnit value={timeLeft.seconds} label="SECS" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCountdown;
