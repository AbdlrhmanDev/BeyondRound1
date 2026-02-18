'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Users, MessageSquare, Trash2, UserMinus, XCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";
import {
  getGroupDetail, getGroupMessages, deleteMessage, removeFromGroup,
  disbandGroup, sendSystemMessage,
} from "@/services/adminService";
import MessageDeleteDialog from "@/components/admin/MessageDeleteDialog";
import GroupDisbandDialog from "@/components/admin/GroupDisbandDialog";
import SystemMessageDialog from "@/components/admin/SystemMessageDialog";

export default function AdminGroupDetailPage() {
  const params = useParams();
  const groupId = params?.id as string;
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  const [detail, setDetail] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [disbandDialogOpen, setDisbandDialogOpen] = useState(false);
  const [systemMsgDialogOpen, setSystemMsgDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getGroupDetail(groupId);
    setDetail(data);

    if (data?.conversationId) {
      setMsgLoading(true);
      const msgs = await getGroupMessages(data.conversationId);
      setMessages(msgs);
      setMsgLoading(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (groupId) fetchData();
  }, [groupId]);

  const handleRemoveMember = async (userId: string) => {
    const success = await removeFromGroup(groupId, userId, "Removed by admin");
    if (success) {
      toast({ title: "Member removed" });
      fetchData();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDeleteMessage = async (reason: string) => {
    if (!selectedMessageId) return;
    const success = await deleteMessage(selectedMessageId, reason);
    if (success) {
      toast({ title: "Message deleted" });
      if (detail?.conversationId) {
        const msgs = await getGroupMessages(detail.conversationId);
        setMessages(msgs);
      }
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setSelectedMessageId(null);
  };

  const handleDisband = async (reason: string) => {
    const success = await disbandGroup(groupId, reason);
    if (success) {
      toast({ title: "Group disbanded" });
      fetchData();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
    setDisbandDialogOpen(false);
  };

  const handleSystemMessage = async (content: string) => {
    const success = await sendSystemMessage(groupId, content);
    if (success) {
      toast({ title: "System message sent" });
      if (detail?.conversationId) {
        const msgs = await getGroupMessages(detail.conversationId);
        setMessages(msgs);
      }
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
    setSystemMsgDialogOpen(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!detail?.group) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Group not found</p>
          <Link href={pathWithLocale("/admin/groups")}>
            <Button variant="link" className="mt-4">Back to groups</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { group, members } = detail;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={pathWithLocale("/admin/groups")}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{group.name || "Unnamed Group"}</h1>
            <p className="text-sm text-muted-foreground capitalize">{group.group_type} group</p>
          </div>
          <Badge variant={group.status === "active" ? "default" : "secondary"}>{group.status}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Info */}
          <Card>
            <CardHeader><CardTitle>Group Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{group.group_type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{group.gender_composition || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Week</span><span>{group.match_week || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(group.created_at), "MMM d, yyyy")}</span></div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.id || m.user_id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{m.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <Link href={pathWithLocale(`/admin/users/${m.user_id}`)} className="text-sm hover:underline text-primary">
                        {m.profiles?.full_name || m.user_id.slice(0, 8)}
                      </Link>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRemoveMember(m.user_id)}
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSystemMsgDialogOpen(true)}
              >
                <Send className="h-4 w-4 mr-2" /> Send System Message
              </Button>
              {group.status !== "disbanded" && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setDisbandDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Disband Group
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {msgLoading ? (
              <p className="text-muted-foreground">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No messages</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg: any) => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 rounded border">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.profiles?.full_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{msg.profiles?.full_name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </span>
                        {msg.deleted_at && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                      </div>
                      <p className="text-sm mt-1">{msg.content}</p>
                    </div>
                    {!msg.deleted_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => { setSelectedMessageId(msg.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MessageDeleteDialog
        open={deleteDialogOpen}
        onConfirm={handleDeleteMessage}
        onCancel={() => { setDeleteDialogOpen(false); setSelectedMessageId(null); }}
      />
      <GroupDisbandDialog
        open={disbandDialogOpen}
        groupName={group.name || "this group"}
        onConfirm={handleDisband}
        onCancel={() => setDisbandDialogOpen(false)}
      />
      <SystemMessageDialog
        open={systemMsgDialogOpen}
        onConfirm={handleSystemMessage}
        onCancel={() => setSystemMsgDialogOpen(false)}
      />
    </AdminLayout>
  );
}
