import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, MapPin, Sparkles, Loader2, X, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_ai?: boolean;
  is_deleted?: boolean | null;
}

interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city?: string | null;
  specialty?: string | null;
}

const GroupChat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchChatData = async () => {
    if (!conversationId || !user) return;

    try {
      // Get conversation and group info
      const { data: convoData } = await supabase
        .from("group_conversations")
        .select("group_id")
        .eq("id", conversationId)
        .single();

      if (!convoData) {
        navigate("/matches");
        return;
      }

      setGroupId(convoData.group_id);

      // Get group info
      const { data: groupData } = await supabase
        .from("match_groups")
        .select("name, id")
        .eq("id", convoData.group_id)
        .single();

      if (groupData) {
        setGroupName(groupData.name || `Group ${groupData.id.slice(0, 6)}`);
      }

      // Get group members with full profile data (including current user)
      const { data: membersData } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", convoData.group_id);

      if (membersData) {
        const memberProfiles = await Promise.all(
          membersData.map(async (m) => {
            try {
              const [profileRes, prefsRes] = await Promise.all([
                supabase
                  .from("profiles")
                  .select("full_name, avatar_url, city")
                  .eq("user_id", m.user_id)
                  .maybeSingle(),
                supabase
                  .from("onboarding_preferences")
                  .select("specialty")
                  .eq("user_id", m.user_id)
                  .maybeSingle(),
              ]);
              
              return {
                user_id: m.user_id,
                full_name: profileRes.data?.full_name || null,
                avatar_url: profileRes.data?.avatar_url || null,
                city: profileRes.data?.city || null,
                specialty: prefsRes.data?.specialty || null,
              };
            } catch (error) {
              // If there's an error (e.g., RLS policy issue), return minimal data
              console.warn(`Error fetching data for user ${m.user_id}:`, error);
              return {
                user_id: m.user_id,
                full_name: null,
                avatar_url: null,
                city: null,
                specialty: null,
              };
            }
          })
        );
        // Sort members: current user first, then others
        const sortedMembers = memberProfiles.sort((a, b) => {
          if (a.user_id === user.id) return -1;
          if (b.user_id === user.id) return 1;
          return 0;
        });
        setMembers(sortedMembers);
      }

      // Get messages (exclude deleted messages)
      const { data: messagesData } = await supabase
        .from("group_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .or("is_deleted.is.null,is_deleted.eq.false")
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();
  }, [conversationId, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`group_messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !conversationId) return;

    const messageContent = input.trim();
    setInput("");

    const { error } = await supabase
      .from("group_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
      });

    if (error) {
      console.error("Error sending message:", error);
      setInput(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAIPlaceSuggestion = async () => {
    if (!conversationId || !user || aiLoading) return;

    setAiLoading(true);

    try {
      // Get recent messages for context
      const recentMessages = messages.slice(-5).map(m => m.content).join(" ");
      
      // Get member info
      const memberNames = members
        .filter(m => m.full_name)
        .map(m => m.full_name);
      
      const specialties = members
        .filter(m => m.specialty)
        .map(m => m.specialty);
      
      // Get a city from members
      const city = members.find(m => m.city)?.city || "your city";

      const response = await supabase.functions.invoke("generate-place-suggestions", {
        body: {
          city,
          memberNames,
          specialties,
          chatContext: recentMessages.slice(0, 500),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to get suggestions");
      }

      const aiMessage = response.data?.message;
      if (!aiMessage) throw new Error("No response from AI");

      // Post AI message to the chat
      const { error } = await supabase
        .from("group_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `🤖 AI Place Recommendations:\n\n${aiMessage}`,
        });

      if (error) throw error;

    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast({
        title: "Couldn't get suggestions",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const getMemberInfo = (userId: string): Member => {
    return members.find((m) => m.user_id === userId) || { 
      user_id: userId, 
      full_name: null, 
      avatar_url: null 
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-1/2 ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/matches")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold">{groupName}</h1>
              <p className="text-xs text-muted-foreground">
                {members.length} members
              </p>
            </div>
          </div>

          {/* AI Suggest Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIPlaceSuggestion}
            disabled={aiLoading}
            className="gap-2 rounded-full"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Suggest Places</span>
          </Button>

          {/* Member Avatars - Clickable to show all members */}
          <div 
            className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowMembersDialog(true)}
            title="View all members"
          >
            {members.slice(0, 4).map((member) => {
              const initials = member.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U";

              return (
                <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {members.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold mb-2">Start the conversation</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-4">
              Say hello to your group! Plan a meetup or just get to know each other.
            </p>
            <Button
              variant="outline"
              onClick={handleAIPlaceSuggestion}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              Get AI Place Suggestions
            </Button>
          </div>
        ) : (
          messages
            .filter((message) => !message.is_deleted)
            .map((message) => {
              const isOwn = message.sender_id === user?.id;
              const isAI = message.content.startsWith("🤖 AI");
              const sender = getMemberInfo(message.sender_id);
              const initials = sender.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U";

              return (
                <div
                  key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[85%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground mb-1 block">
                      {sender.full_name || "Anonymous"}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isAI
                        ? "bg-accent/10 border border-accent/20 text-foreground rounded-bl-md"
                        : isOwn
                        ? "bg-gradient-gold text-white rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
        <div className="container mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-border/50 focus-visible:ring-primary"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Members Dialog - Show all members */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Members ({members.length})
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {members.map((member) => {
              const initials = member.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U";
              
              const isCurrentUser = member.user_id === user?.id;

              return (
                <div
                  key={member.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentUser 
                      ? 'bg-primary/5 border border-primary/20' 
                      : 'hover:bg-secondary/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isCurrentUser) {
                      navigate(`/u/${member.user_id}`);
                      setShowMembersDialog(false);
                    }
                  }}
                >
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-gold text-primary-foreground font-display font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm truncate">
                        {member.full_name || "Anonymous"}
                      </h4>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {member.specialty && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {member.specialty}
                        </p>
                      )}
                      {member.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChat;
