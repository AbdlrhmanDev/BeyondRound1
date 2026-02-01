import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, RefreshCw, MapPin, Stethoscope, Ban, UserCheck, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import UserEditDialog from "@/components/admin/UserEditDialog";
import UserBanDialog from "@/components/admin/UserBanDialog";
import { logAdminAction } from "@/lib/auditLog";
import { getAllUsers, banUser, unbanUser, updateUserProfile, UserProfile } from "@/services/adminService";

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [banningUser, setBanningUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    const usersData = await getAllUsers();
    setUsers(usersData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnban = async (user: UserProfile) => {
    const oldValues = { status: user.status, banned_at: user.banned_at, ban_reason: user.ban_reason };
    
    const success = await unbanUser(user.id);

    if (!success) {
      toast({ title: "Error", description: "Failed to unban user", variant: "destructive" });
    } else {
      await logAdminAction({
        action: "user_unban",
        targetUserId: user.user_id,
        targetTable: "profiles",
        targetId: user.id,
        oldValues,
        newValues: { status: "active", banned_at: null, ban_reason: null },
      });
      
      toast({ title: "Success", description: `${user.full_name || "User"} has been unbanned` });
      fetchUsers();
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.city?.toLowerCase().includes(query) ||
      user.specialty?.toLowerCase().includes(query)
    );
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    suspended: "bg-yellow-500/10 text-yellow-500",
    banned: "bg-red-500/10 text-red-500",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">{users.length} registered users</p>
          </div>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <p className="text-muted-foreground col-span-full">{t("common.loading")}</p>
          ) : filteredUsers.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No users found
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {user.full_name || "No name"}
                        </h3>
                        <Badge className={statusColors[user.status] || statusColors.active}>
                          {user.status}
                        </Badge>
                      </div>
                      {user.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.city}
                          {user.neighborhood && `, ${user.neighborhood}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {user.specialty && (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{user.specialty}</span>
                      </div>
                    )}
                    
                    {user.ban_reason && (
                      <p className="text-xs text-destructive">
                        Reason: {user.ban_reason}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge variant={user.completed_at ? "default" : "secondary"}>
                        {user.completed_at ? "Onboarded" : "Incomplete"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {user.status === "banned" || user.status === "suspended" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-green-600 hover:text-green-700"
                          onClick={() => handleUnban(user)}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => setBanningUser(user)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Ban
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <UserEditDialog
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={fetchUsers}
      />

      {/* Ban Dialog */}
      <UserBanDialog
        user={banningUser}
        open={!!banningUser}
        onClose={() => setBanningUser(null)}
        onBan={fetchUsers}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
