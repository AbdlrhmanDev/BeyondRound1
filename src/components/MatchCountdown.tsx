import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getNextThursday = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7; // If today is Thursday, get next Thursday
  
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(12, 0, 0, 0); // Noon on Thursday
  
  // If it's Thursday and before noon, use today
  if (dayOfWeek === 4 && now.getHours() < 12) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }
  
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
    <div className="flex flex-col items-center">
      <div className="bg-secondary rounded-xl px-4 py-3 min-w-[64px]">
        <span className="font-display text-2xl font-bold number-display text-foreground">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );

  return (
    <Card className="border-0 shadow-lg shadow-foreground/5 rounded-2xl bg-gradient-to-br from-card to-secondary/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Next Group Matching</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(nextThursday)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-3">
          <TimeUnit value={timeLeft.days} label="Days" />
          <span className="text-2xl font-bold text-muted-foreground/50 self-start mt-3">:</span>
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <span className="text-2xl font-bold text-muted-foreground/50 self-start mt-3">:</span>
          <TimeUnit value={timeLeft.minutes} label="Mins" />
          <span className="text-2xl font-bold text-muted-foreground/50 self-start mt-3">:</span>
          <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          New groups are formed every Thursday at noon
        </p>
      </CardContent>
    </Card>
  );
};

export default MatchCountdown;
