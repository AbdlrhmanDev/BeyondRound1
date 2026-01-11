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
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/matches")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {otherUser && (
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/u/${otherUser.user_id}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-gold text-primary-foreground font-display font-bold">
                  {otherInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  {otherUser.full_name || "Anonymous"}
                </h2>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Start the conversation!
            </h3>
            <p className="text-muted-foreground text-sm">
              Say hello to {otherUser?.full_name || "your new connection"}
            </p>
          </div>
        ) : (
          messages
            .filter((message) => !message.is_deleted)
            .map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isOwn
                        ? "bg-gradient-gold text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                      {message.edited_at && " (edited)"}
                    </p>
                  </div>
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/40 bg-background p-4">
        <div className="container mx-auto flex gap-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full"
          />
          <Button 
            onClick={handleSend} 
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="rounded-full bg-gradient-gold hover:opacity-90 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
