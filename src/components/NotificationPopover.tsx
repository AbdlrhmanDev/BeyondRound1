import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
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
              // Create welcome notification
              const { data: newNotification } = await supabase
                .from("notifications")
                .insert({
                  user_id: user.id,
                  type: "welcome",
                  title: "Welcome to BeyondRounds!",
                  message: "Complete your profile to start connecting with physicians who share your interests.",
                  link: "/profile",
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
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload.new);
          setNotifications((prev) => {
            // Avoid duplicates by checking if notification already exists
            const exists = prev.some(n => n.id === (payload.new as Notification).id);
            if (exists) {
              return prev;
            }
            return [payload.new as Notification, ...prev];
          });
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
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new as Notification : n))
          );
        }
      )
      .subscribe((status) => {
        console.log("Notification subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
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
        className="w-80 p-0 rounded-2xl border-border/50 shadow-xl" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h3 className="font-display font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground h-8"
              onClick={markAllRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border/40">
              {notifications
                .filter((n, index, self) => 
                  // Remove duplicates by keeping only first occurrence of each id
                  index === self.findIndex((t) => t.id === n.id)
                )
                .map((notification) => (
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
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-secondary mx-auto mb-3 flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-border/40">
          <Button 
            variant="ghost" 
            className="w-full text-sm text-muted-foreground hover:text-foreground rounded-xl"
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
