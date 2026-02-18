'use client';

import { useState } from "react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface UserRoleDialogProps {
  open: boolean;
  userName: string;
  onConfirm: (role: string, reason: string) => Promise<void>;
  onCancel: () => void;
}

const UserRoleDialog = ({ open, userName, onConfirm, onCancel }: UserRoleDialogProps) => {
  const [role, setRole] = useState("user");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(role, reason.trim());
    setLoading(false);
    setReason("");
    setRole("user");
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onCancel(); setReason(""); setRole("user"); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Role</AlertDialogTitle>
          <AlertDialogDescription>
            Change the role for <strong>{userName}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>New Role</Label>
            <RadioGroup value={role} onValueChange={setRole}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="role-user" />
                <Label htmlFor="role-user" className="font-normal cursor-pointer">User</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderator" id="role-mod" />
                <Label htmlFor="role-mod" className="font-normal cursor-pointer">Moderator</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="font-normal cursor-pointer">Admin</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="role-reason">Reason *</Label>
            <Textarea
              id="role-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for role change..."
              className="mt-2"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Change Role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserRoleDialog;
