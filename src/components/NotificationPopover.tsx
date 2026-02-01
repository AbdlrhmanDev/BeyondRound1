import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Users, Calendar, Heart, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notification {
  id: string;
  type: "match" | "match_accepted" | "match_rejected" | "group_invite" | "group_message" | "message" | "event" | "welcome" | "system";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

const NotificationPopover = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      setNotifications(data || []);
      
      // If no notifications exist, create welcome notification for existing users
      if ((!data || data.length === 0) && user.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          // Check if welcome notification already exists
          const { data: existingWelcome } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "welcome")
            .maybeSingle();
          
          if (!existingWelcome) {
            // Create welcome notification (keys for i18n; app resolves with current locale)
            const { data: newNotification } = await supabase
              .from("notifications")
              .insert({
                user_id: user.id,
                type: "welcome",
                title: "notifications.welcome.title",
                message: "notifications.welcome.message",
                link: "/profile",
                metadata: {},
              })
              .select()
              .single();
            
            if (newNotification) {
              setNotifications([newNotification]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchNotifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Clean up existing channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to new notifications with comprehensive error handling
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      channel = supabase
        .channel(`notifications-${user.id}`, {
          config: {
            broadcast: { self: false },
            presence: { key: user.id },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            try {
              setNotifications((prev) => {
                // Avoid duplicates by checking if notification already exists
                const exists = prev.some(n => n.id === (payload.new as Notification).id);
                if (exists) {
                  return prev;
                }
                return [payload.new as Notification, ...prev];
              });
            } catch (err) {
              // Silently handle errors in notification handler
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            try {
              setNotifications((prev) =>
                prev.map((n) => (n.id === payload.new.id ? payload.new as Notification : n))
              );
            } catch (err) {
              // Silently handle errors in notification handler
            }
          }
        );
      
      // Subscribe with error handling - wrap in try-catch to prevent unhandled rejections
      try {
        channel.subscribe((status) => {
          // Only log errors, not normal status changes
          if (status === "SUBSCRIBED") {
            channelRef.current = channel;
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // Silently handle subscription errors - they're often from browser extensions
            // Don't log to avoid console noise
          } else if (status === "CLOSED") {
            // CLOSED status is normal during cleanup, don't log
          }
        });
      } catch (subscribeError) {
        // Silently catch subscription errors - they're often from browser extensions
        // The error handler in main.tsx will filter these out
      }
    } catch (err) {
      // Silently handle channel creation errors - they're often from browser extensions
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) {
        console.error("Error marking all as read:", error);
        throw error;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.read ? n : { ...n, read: true }))
      );
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const locale = i18n.language === "de" ? de : undefined;
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
    } catch {
      return t("notifications.recently");
    }
  };

  // Map known English text (from old DB rows) to translation keys so they show in current locale
  const getDisplayTitle = (notification: Notification): string => {
    const title = notification.title ?? "";
    if (title.startsWith("notifications.")) return t(title, notification.metadata || {});
    const known: Record<string, string> = {
      "New Group Message": "notifications.group_message.title",
      "New Message": "notifications.message.title",
      "New Connection Request": "notifications.match.title",
      "Connection Accepted!": "notifications.match_accepted.title",
      "New Member Joined": "notifications.group_invite.title",
      "Welcome to BeyondRounds!": "notifications.welcome.title",
    };
    const key = known[title];
    return key ? t(key, notification.metadata || {}) : title;
  };

  const getDisplayMessage = (notification: Notification): string => {
    const message = notification.message ?? "";
    if (message.startsWith("notifications.")) return t(message, notification.metadata || {});
    const meta = { ...(notification.metadata || {}) } as Record<string, string>;
    const type = notification.type;
    // Extract from_user_name from old English message patterns when metadata lacks it
    let fromUserName = meta.from_user_name;
    if (!fromUserName && message) {
      const inGroup = message.match(/^(.+?)\s+sent a message in the group\.?$/i);
      if (inGroup) fromUserName = inGroup[1].trim();
      else {
        const sentYou = message.match(/^(.+?)\s+sent you a message\.?$/i);
        if (sentYou) fromUserName = sentYou[1].trim();
        else {
          const requestFrom = message.match(/You have a new connection request from\s+(.+?)\.?$/i);
          if (requestFrom) fromUserName = requestFrom[1].trim();
          else {
            const accepted = message.match(/^(.+?)\s+accepted your connection request\.?$/i);
            if (accepted) fromUserName = accepted[1].trim();
            else {
              const joined = message.match(/^(.+?)\s+joined\s+(.+?)\.?$/i);
              if (joined) {
                fromUserName = joined[1].trim();
                if (!meta.group_name) meta.group_name = joined[2].trim();
              }
            }
          }
        }
      }
    }
    const keyByType: Partial<Record<Notification["type"], string>> = {
      group_message: "notifications.group_message.message",
      message: "notifications.message.message",
      match: "notifications.match.message",
      match_accepted: "notifications.match_accepted.message",
      group_invite: "notifications.group_invite.message",
      welcome: "notifications.welcome.message",
    };
    const key = keyByType[type];
    if (key) return t(key, { ...meta, from_user_name: fromUserName || "Someone" });
    return message;
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "match":
      case "match_accepted":
        return <Users className="h-4 w-4 text-primary" />;
      case "group_invite":
      case "group_message":
      case "message":
        return <MessageCircle className="h-4 w-4 text-accent" />;
      case "event":
        return <Calendar className="h-4 w-4 text-accent" />;
      case "welcome":
        return <Sparkles className="h-4 w-4 text-primary" />;
      default:
        return <Heart className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-secondary relative"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-80 p-0 rounded-xl sm:rounded-2xl border-border/50 shadow-xl" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h3 className="font-display font-semibold">{t("notifications.heading")}</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground h-8"
              onClick={markAllRead}
            >
              <Check className="h-3 w-3 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("notifications.loading")}</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border/40">
              {notifications
                .filter((n, index, self) => 
                  // Remove duplicates by keeping only first occurrence of each id
                  index === self.findIndex((t) => t.id === n.id)
                )
                .map((notification) => {
                  const displayTitle = getDisplayTitle(notification);
                  const displayMessage = getDisplayMessage(notification);
                  return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 hover:bg-secondary/50 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notification.read && "font-medium"
                        )}>
                          {displayTitle}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      {displayMessage ? (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {displayMessage}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                  );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-secondary mx-auto mb-3 flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-border/40">
          <Button 
            variant="ghost" 
            className="w-full text-sm text-muted-foreground hover:text-foreground rounded-xl"
          >
            {t("notifications.viewAll")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
