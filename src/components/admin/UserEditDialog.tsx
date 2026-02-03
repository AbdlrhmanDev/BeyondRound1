'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logAdminAction } from "@/lib/auditLog";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  city: string | null;
  neighborhood: string | null;
  gender: string | null;
}

interface UserEditDialogProps {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserEditDialog = ({ user, open, onClose, onSave }: UserEditDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    city: "",
    neighborhood: "",
    gender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        city: user.city || "",
        neighborhood: user.neighborhood || "",
        gender: user.gender || "",
      });
    }
  }, [user]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      setFormData({
        full_name: user.full_name || "",
        city: user.city || "",
        neighborhood: user.neighborhood || "",
        gender: user.gender || "",
      });
    }
    if (!isOpen) onClose();
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const oldValues = {
      full_name: user.full_name,
      city: user.city,
      neighborhood: user.neighborhood,
      gender: user.gender,
    };

    const newValues = {
      full_name: formData.full_name || null,
      city: formData.city || null,
      neighborhood: formData.neighborhood || null,
      gender: formData.gender || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(newValues as Record<string, unknown>)
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      // Log the action
      await logAdminAction({
        action: "user_edit",
        targetUserId: user.user_id,
        targetTable: "profiles",
        targetId: user.id,
        oldValues,
        newValues,
      });

      toast({ title: "Success", description: "Profile updated successfully" });
      onSave();
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update the user's profile information. Changes will be logged in the audit log.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              placeholder="Enter neighborhood"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
