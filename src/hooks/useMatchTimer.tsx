import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getUserGroupMemberships, getGroupsByIds } from "@/services/matchService";
import { getGroupConversationsByGroupIds } from "@/services/conversationService";
import { checkNotificationExists, createNotification } from "@/services/notificationService";

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
        // Get user's active group memberships using service
        const memberships = await getUserGroupMemberships(user.id);
        
        if (memberships.length > 0) {
          const groupIds = memberships.map(m => m.group_id);
          
          // Get active groups using service
          const activeGroups = await getGroupsByIds(groupIds, 1);
          
          if (activeGroups.length > 0) {
            const group = activeGroups[0];
            const groupId = group.id;
            
            // Check if notification already sent for this group using service
            const notificationExists = await checkNotificationExists(
              user.id,
              "system",
              "%YOUR MATCH IS READY%"
            );

            if (!notificationExists) {
              // Get group conversations using service
              const conversations = await getGroupConversationsByGroupIds([groupId]);
              const conversation = conversations.find(c => c.group_id === groupId);

              if (conversation) {
                // Send notification using service
                await createNotification(user.id, {
                  type: "system",
                  title: "🎉 YOUR MATCH IS READY!",
                  message: "🎉 YOUR MATCH IS READY!",
                  link: `/group-chat/${conversation.id}`,
                  metadata: { group_id: groupId },
                });

                // Show toast and redirect
                toast({
                  title: "🎉 YOUR MATCH IS READY!",
                  description: "You've been matched with a group! Let's start chatting.",
                });

                navigate(`/group-chat/${conversation.id}`);
              }
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
