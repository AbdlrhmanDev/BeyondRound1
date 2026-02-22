'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Ban, UserCheck, Trash2, RotateCcw, Shield, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";
import {
  getUserDetail, banUserRpc, unbanUserRpc, softDeleteUser, restoreUser, changeUserRole,
} from "@/services/adminService";
import UserBanDialog from "@/components/admin/UserBanDialog";
import UserSoftDeleteDialog from "@/components/admin/UserSoftDeleteDialog";
import UserRoleDialog from "@/components/admin/UserRoleDialog";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params?.user_id as string;
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getUserDetail(userId);
    setDetail(data);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleUnban = async () => {
    const success = await unbanUserRpc(userId);
    if (success) {
      toast({ title: "Success", description: "User unbanned" });
      fetchData();
    } else {
      toast({ title: "Error", description: "Failed to unban", variant: "destructive" });
    }
  };

  const handleRestore = async () => {
    const success = await restoreUser(userId);
    if (success) {
      toast({ title: "Success", description: "User restored" });
      fetchData();
    } else {
      toast({ title: "Error", description: "Failed to restore", variant: "destructive" });
    }
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

  if (!detail?.profile) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">User not found</p>
          <Link href={pathWithLocale("/admin/users")}>
            <Button variant="link" className="mt-4">Back to users</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { profile, preferences, groups, reports, verification } = detail;
  const isBanned = profile.status === "banned" || profile.status === "suspended";
  const isSoftDeleted = profile.soft_delete;

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    suspended: "bg-yellow-500/10 text-yellow-600",
    banned: "bg-red-500/10 text-red-600",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={pathWithLocale("/admin/users")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || "Unknown User"}</h1>
            <p className="text-sm text-muted-foreground">{userId.slice(0, 8)}...</p>
          </div>
          <Badge className={statusColors[profile.status] || statusColors.active}>{profile.status}</Badge>
          {isSoftDeleted && <Badge variant="destructive">Soft Deleted</Badge>}
          {profile.verification_status === "approved" && (
            <Badge className="bg-green-500/10 text-green-600">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="City" value={profile.city} />
              <InfoRow label="Neighborhood" value={profile.neighborhood} />
              <InfoRow label="Gender" value={profile.gender} />
              <InfoRow label="Joined" value={profile.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : null} />
              {profile.ban_reason && <InfoRow label="Ban Reason" value={profile.ban_reason} />}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader><CardTitle>Onboarding Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Specialty" value={preferences?.specialty} />
              <InfoRow label="Career Stage" value={preferences?.career_stage} />
              <InfoRow label="Completed" value={preferences?.completed_at ? format(new Date(preferences.completed_at), "MMM d, yyyy") : "Not completed"} />
            </CardContent>
          </Card>

          {/* Verification */}
          <Card>
            <CardHeader><CardTitle>Verification</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Status" value={profile.verification_status || "None"} />
              {verification && (
                <>
                  <InfoRow label="Method" value={verification.document_type?.replace(/_/g, " ")} />
                  <InfoRow label="Submitted" value={verification.created_at ? format(new Date(verification.created_at), "MMM d, yyyy") : null} />
                  <Link href={pathWithLocale(`/admin/verifications/${userId}`)}>
                    <Button size="sm" variant="link" className="p-0 h-auto">View Verification</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card>
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {isBanned ? (
              <Button variant="outline" onClick={handleUnban} className="text-green-600">
                <UserCheck className="h-4 w-4 mr-2" /> Unban User
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setBanDialogOpen(true)}>
                <Ban className="h-4 w-4 mr-2" /> Ban User
              </Button>
            )}
            {isSoftDeleted ? (
              <Button variant="outline" onClick={handleRestore}>
                <RotateCcw className="h-4 w-4 mr-2" /> Restore User
              </Button>
            ) : (
              <Button variant="outline" className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Soft Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setRoleDialogOpen(true)}>
              <Shield className="h-4 w-4 mr-2" /> Change Role
            </Button>
          </CardContent>
        </Card>

        {/* Groups */}
        {groups.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Groups ({groups.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groups.map((g: any) => (
                  <div key={g.id || g.group_id} className="flex justify-between items-center p-2 rounded border text-sm">
                    <Link href={pathWithLocale(`/admin/groups/${g.group_id}`)} className="text-primary hover:underline">
                      {g.match_groups?.name || g.group_id?.slice(0, 8)}
                    </Link>
                    <Badge variant="secondary">{g.match_groups?.status || "—"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports */}
        {reports.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Reports ({reports.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center p-2 rounded border text-sm">
                    <Link href={pathWithLocale(`/admin/reports/${r.id}`)} className="text-primary hover:underline">
                      {r.reason}
                    </Link>
                    <Badge variant={r.status === "pending" ? "destructive" : "secondary"}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <UserBanDialog
        user={banDialogOpen ? { id: profile.id, user_id: userId, full_name: profile.full_name, status: profile.status } : null}
        open={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        onBan={fetchData}
      />
      <UserSoftDeleteDialog
        open={deleteDialogOpen}
        userName={profile.full_name || "this user"}
        onConfirm={async (reason) => {
          const success = await softDeleteUser(userId, reason);
          if (success) { toast({ title: "User soft deleted" }); fetchData(); }
          else { toast({ title: "Error", variant: "destructive" }); }
          setDeleteDialogOpen(false);
        }}
        onCancel={() => setDeleteDialogOpen(false)}
      />
      <UserRoleDialog
        open={roleDialogOpen}
        userName={profile.full_name || "this user"}
        onConfirm={async (role, reason) => {
          const success = await changeUserRole(userId, role, reason);
          if (success) { toast({ title: "Role changed" }); fetchData(); }
          else { toast({ title: "Error", variant: "destructive" }); }
          setRoleDialogOpen(false);
        }}
        onCancel={() => setRoleDialogOpen(false)}
      />
    </AdminLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
