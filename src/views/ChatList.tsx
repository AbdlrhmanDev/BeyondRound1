'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserGroups } from "@/services/matchService";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GroupChat from "@/views/GroupChat";

/**
 * /chat route — auto-detects the user's most recent active group conversation
 * and renders GroupChat with that conversation ID.
 */
export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useLocalizedNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const findConversation = async () => {
      try {
        setLoading(true);

        // Fetch user's active groups (sorted by score then match_week desc)
        const groups = await fetchUserGroups(user.id);

        if (groups.length > 0) {
          // Find the first group that has a conversation_id
          const groupWithChat = groups.find((g) => g.conversation_id);
          if (groupWithChat?.conversation_id) {
            setConversationId(groupWithChat.conversation_id);
            setLoading(false);
            return;
          }
        }

        // Fallback: query group_conversations directly for any conversation this user belongs to
        if (supabase) {
          const { data: memberships } = await supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", user.id);

          if (memberships && memberships.length > 0) {
            const groupIds = memberships.map((m) => m.group_id);
            const { data: conversations } = await supabase
              .from("group_conversations")
              .select("id, group_id, created_at")
              .in("group_id", groupIds)
              .order("created_at", { ascending: false })
              .limit(1);

            if (conversations && conversations.length > 0) {
              setConversationId(conversations[0].id);
              setLoading(false);
              return;
            }
          }
        }

        // No conversation found
        setLoading(false);
      } catch (err) {
        console.error("Error finding conversation:", err);
        setError(true);
        setLoading(false);
      }
    };

    findConversation();
  }, [user, authLoading, navigate]);

  // Loading state
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-6 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Something went wrong loading your chat.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // No conversation found — empty state
  if (!conversationId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No group chat yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Join a weekend gathering to start chatting with your group.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")} size="sm">
            Find a gathering
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Render GroupChat with the detected conversation ID
  return <GroupChat conversationIdProp={conversationId} />;
}
