import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const getNextThursday4PM = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(16, 0, 0, 0); // 4 PM
  
  // If it's Thursday and before 4 PM, use today
  if (dayOfWeek === 4 && now.getHours() < 16) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0, 0);
  }
  
  return nextThursday;
};

const isThursday4PM = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek === 4 && now.getHours() >= 16;
};

const shouldShowSurvey = (matchWeek: string): boolean => {
  const now = new Date();
  const matchDate = new Date(matchWeek);
  matchDate.setHours(16, 0, 0, 0); // Thursday 4 PM
  
  // Show survey after Thursday evening (after 8 PM) or on Friday
  const thursdayEvening = new Date(matchDate);
  thursdayEvening.setHours(20, 0, 0, 0); // Thursday 8 PM
  
  return now >= thursdayEvening;
};

export const useMatchTimer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nextMatchTime, setNextMatchTime] = useState<Date>(getNextThursday4PM());
  const [hasCheckedMatch, setHasCheckedMatch] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkMatchTime = async () => {
      if (hasCheckedMatch) return;
      
      // Check if it's Thursday 4 PM
      if (isThursday4PM()) {
        // Get user's active group
        const { data: groupMember } = await supabase
          .from("group_members")
          .select("group_id, match_groups!inner(id, match_week, status)")
          .eq("user_id", user.id)
          .eq("match_groups.status", "active")
          .order("match_groups.match_week", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (groupMember) {
          const groupId = groupMember.group_id;
          
          // Check if notification already sent for this group
          const { data: existingNotification } = await (supabase
            .from("notifications" as any)
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "system")
            .like("message", "%YOUR MATCH IS READY%")
            .maybeSingle() as any);

          if (!existingNotification) {
            // Get group conversation
            const { data: conversation } = await supabase
              .from("group_conversations")
              .select("id")
              .eq("group_id", groupId)
              .maybeSingle();

            if (conversation) {
              // Send notification
              await (supabase.from("notifications" as any).insert({
                user_id: user.id,
                type: "system",
                title: "🎉 YOUR MATCH IS READY!",
                message: "🎉 YOUR MATCH IS READY!",
                link: `/group-chat/${conversation.id}`,
                metadata: { group_id: groupId },
              }) as any);

              // Show toast and redirect
              toast({
                title: "🎉 YOUR MATCH IS READY!",
                description: "You've been matched with a group! Let's start chatting.",
              });

              navigate(`/group-chat/${conversation.id}`);
            }
          }
        }
        
        setHasCheckedMatch(true);
      }
    };

    // Check immediately
    checkMatchTime();

    // Check every minute
    const interval = setInterval(checkMatchTime, 60000);

    return () => clearInterval(interval);
  }, [user, navigate, toast, hasCheckedMatch]);

  return { nextMatchTime, shouldShowSurvey };
};
