import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Sparkles } from "lucide-react";

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
    <div className="flex flex-col items-center gap-2.5">
      <div className="bg-white rounded-lg px-5 py-4 min-w-[75px] text-center shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-gray-100">
        <span className="font-display text-3xl font-bold text-[#1a1a1a] tracking-tight leading-none block">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-[#999999] uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );

  return (
    <Card className="border-t-2 border-[#FF6B35]/30 shadow-lg shadow-gray-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-[#FFFBF8] via-[#FFFBF8] to-[#FFF8F0]">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left Section - Event Details */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Clock className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="font-display font-semibold text-xl text-[#1a1a1a]">Next Group Matching</h3>
                <Sparkles className="h-4 w-4 text-[#FF6B35] flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#666666] mb-4">
                <Calendar className="h-4 w-4 flex-shrink-0 text-[#999999]" />
                <span>{formatDate(nextThursday)}</span>
              </div>
              <p className="text-sm text-[#666666] flex items-center gap-2">
                <span className="text-[#FF6B35] text-base leading-none">•</span>
                <span>New groups are formed every Thursday at 4 PM</span>
              </p>
            </div>
          </div>
          
          {/* Right Section - Countdown Timer */}
          <div className="flex items-center justify-center lg:justify-end gap-3">
            <TimeUnit value={timeLeft.days} label="DAYS" />
            <div className="flex flex-col gap-1 self-start mt-5">
              <span className="text-[#FF6B35] text-xs leading-none">•</span>
              <span className="text-[#FF6B35] text-xs leading-none">•</span>
            </div>
            <TimeUnit value={timeLeft.hours} label="HOURS" />
            <div className="flex flex-col gap-1 self-start mt-5">
              <span className="text-[#FF6B35] text-xs leading-none">•</span>
              <span className="text-[#FF6B35] text-xs leading-none">•</span>
            </div>
            <TimeUnit value={timeLeft.minutes} label="MINS" />
            <div className="flex flex-col gap-1 self-start mt-5">
              <span className="text-[#FF6B35] text-xs leading-none">•</span>
              <span className="text-[#FF6B35] text-xs leading-none">•</span>
            </div>
            <TimeUnit value={timeLeft.seconds} label="SECS" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCountdown;
