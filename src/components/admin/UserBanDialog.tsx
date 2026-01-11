import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { logAdminAction } from "@/lib/auditLog";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  status?: string;
}

interface UserBanDialogProps {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onBan: () => void;
}

const UserBanDialog = ({ user, open, onClose, onBan }: UserBanDialogProps) => {
  const [banType, setBanType] = useState<"suspended" | "banned">("suspended");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBan = async () => {
    if (!user) return;
    
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    const oldValues = { status: user.status || "active" };
    const newValues = {
      status: banType,
      banned_at: new Date().toISOString(),
      ban_reason: reason.trim(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(newValues)
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
    } else {
      // Log the action
      await logAdminAction({
        action: banType === "banned" ? "user_ban" : "user_suspend",
        targetUserId: user.user_id,
        targetTable: "profiles",
        targetId: user.id,
        oldValues,
        newValues,
        reason: reason.trim(),
      });

      toast({ 
        title: "Success", 
        description: `${user.full_name || "User"} has been ${banType}` 
      });
      onBan();
      onClose();
      setReason("");
      setBanType("suspended");
    }
    setIsLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setReason("");
      setBanType("suspended");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Ban / Suspend User
          </DialogTitle>
          <DialogDescription>
            This action will restrict {user?.full_name || "this user"}'s access to the platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Action Type</Label>
            <RadioGroup
              value={banType}
              onValueChange={(value) => setBanType(value as "suspended" | "banned")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suspended" id="suspended" />
                <Label htmlFor="suspended" className="font-normal cursor-pointer">
                  <span className="font-medium text-yellow-600">Suspend</span>
                  <span className="text-muted-foreground ml-2">— Temporary restriction, can be reversed</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="banned" id="banned" />
                <Label htmlFor="banned" className="font-normal cursor-pointer">
                  <span className="font-medium text-red-600">Ban</span>
                  <span className="text-muted-foreground ml-2">— Permanent removal from platform</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this user is being banned/suspended..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleBan} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {banType === "banned" ? "Ban User" : "Suspend User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserBanDialog;
