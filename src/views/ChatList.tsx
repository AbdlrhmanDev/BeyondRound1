'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { getUserGroupMemberships, getGroupsByIds, getGroupMembers } from "@/services/matchService";
import { getGroupConversationsByGroupIds } from "@/services/conversationService";
import { getPublicProfile } from "@/services/profileService";
import { getOrCreateGroupConversation } from "@/services/conversationService";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";
import { ChatListEmptyState } from "@/components/ChatEmptyState";
import { format } from "date-fns";

interface GroupChatItem {
  id: string;
  groupId: string;
  name: string;
  conversationId: string | null;
  members: { user_id: string; full_name: string | null; avatar_url: string | null }[];
  matchWeek: string;
}

export default function ChatListPage() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetch = async () => {
      try {
        const memberships = await getUserGroupMemberships(user.id);
        if (!memberships?.length) {
          setGroups([]);
          return;
        }

        const groupIds = memberships.map((m) => m.group_id);
        const [groupsData, conversationsData] = await Promise.all([
          getGroupsByIds(groupIds),
          getGroupConversationsByGroupIds(groupIds),
        ]);

        const conversationsMap = new Map(
          conversationsData.map((c) => [c.group_id, c.id])
        );

        const result: GroupChatItem[] = [];
        for (const g of groupsData || []) {
          const members = await getGroupMembers(g.id);
          const otherMemberIds = members
            .map((m) => m.user_id)
            .filter((id) => id !== user.id);
          const profiles = await Promise.all(
            otherMemberIds.slice(0, 4).map((id) => getPublicProfile(id))
          );

          result.push({
            id: g.id,
            groupId: g.id,
            name: g.name || `${g.match_week} - Group`,
            conversationId: conversationsMap.get(g.id) || null,
            members: profiles
              .filter(Boolean)
              .map((p) => ({
                user_id: p!.user_id,
                full_name: p!.full_name,
                avatar_url: p!.avatar_url,
              })),
            matchWeek: g.match_week,
          });
        }

        setGroups(result);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user?.id]);

  const openChat = async (item: GroupChatItem) => {
    try {
      const conversationId =
        item.conversationId ||
        (await getOrCreateGroupConversation(item.groupId));
      navigate(`/group-chat/${conversationId}`);
    } catch {
      toast({
        title: t("chat.errorOpen", "Could not open chat"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-24 w-full rounded-2xl mb-4" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          {t("chat.title", "Chat")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("chat.subtitle", "Your active group chats.")}
        </p>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t("chat.activeGroups", "Active Group Chats")}
          </h2>

          {groups.length === 0 ? (
            <ChatListEmptyState onBookMeetup={() => navigate("/dashboard")} />
          ) : (
            groups.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openChat(item)}
                className="w-full text-left rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4"
              >
                <div className="flex -space-x-2 flex-shrink-0">
                  {item.members.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.user_id}
                      className="h-10 w-10 border-2 border-background"
                    >
                      <AvatarImage src={m.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {m.full_name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.members.length} {t("chat.members", "members")} ·{" "}
                    {format(new Date(item.matchWeek), "MMM d")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
