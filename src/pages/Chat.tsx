import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface OtherUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !user) return;

      try {
        // Get conversation and match info
        const { data: convo, error: convoError } = await (supabase as any)
          .from("conversations")
          .select("match_id")
          .eq("id", conversationId)
          .single();

        if (convoError) throw convoError;

        // Get match to find other user
        const { data: match } = await (supabase as any)
          .from("matches")
          .select("user_id, matched_user_id")
          .eq("id", convo.match_id)
          .single();

        if (match) {
          const otherUserId = match.user_id === user.id ? match.matched_user_id : match.user_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .eq("user_id", otherUserId)
            .single();

          if (profile) setOtherUser(profile as any);
        }

        // Fetch messages (exclude deleted messages)
        const { data: messagesData } = await (supabase as any)
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .or("is_deleted.is.null,is_deleted.eq.false")
          .order("created_at", { ascending: true });

        if (messagesData) setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast({
          title: "Error",
          description: "Could not load conversation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, user, toast]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper function to format date
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  };

  // Helper function to check if messages are from same sender and close in time
  const shouldGroupMessages = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return false;
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return currentMsg.sender_id === prevMsg.sender_id && timeDiff < 5 * 60 * 1000; // 5 minutes
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !conversationId) return;

    setSending(true);
    try {
      const { error } = await (supabase as any).from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-12 w-48 ml-auto" />
          <Skeleton className="h-12 w-56" />
        </div>
      </div>
    );
  }

  const otherInitials = otherUser?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/matches")}
            className="rounded-full hover:bg-secondary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {otherUser && (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
              onClick={() => navigate(`/u/${otherUser.user_id}`)}
            >
              <Avatar className="h-10 w-10 flex-shrink-0 shadow-sm">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-gold text-primary-foreground font-display font-bold">
                  {otherInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-foreground truncate">
                  {otherUser.full_name || "Anonymous"}
                </h2>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-gold/10 flex items-center justify-center shadow-lg">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Start the conversation!
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Say hello to {otherUser?.full_name || "your new connection"}
            </p>
          </div>
        ) : (
          messages
            .filter((message) => !message.is_deleted)
            .map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const prevMessage = index > 0 ? messages.filter(m => !m.is_deleted)[index - 1] : null;
              const shouldGroup = shouldGroupMessages(message, prevMessage);
              const showDateSeparator = !prevMessage || formatMessageDate(message.created_at) !== formatMessageDate(prevMessage.created_at);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6">
                      <div className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground font-medium">
                        {formatMessageDate(message.created_at)}
                      </div>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${shouldGroup ? "mt-0.5" : "mt-[80px]"}`}>
                    <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
                      isOwn
                        ? "bg-gradient-gold text-white rounded-br-md shadow-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}>
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                      {!shouldGroup && (
                        <p className={`text-xs mt-1.5 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                          {message.edited_at && " (edited)"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/95 backdrop-blur-md p-4 shadow-lg">
        <div className="container mx-auto flex gap-3 items-end">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 bg-background/50 min-h-[44px]"
          />
          <Button 
            onClick={handleSend} 
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="rounded-full bg-gradient-gold hover:opacity-90 h-11 w-11 shadow-md disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
