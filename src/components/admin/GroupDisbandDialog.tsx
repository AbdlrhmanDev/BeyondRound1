'use client';

import { useState } from "react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface GroupDisbandDialogProps {
  open: boolean;
  groupName: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

const GroupDisbandDialog = ({ open, groupName, onConfirm, onCancel }: GroupDisbandDialogProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(reason.trim());
    setLoading(false);
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onCancel(); setReason(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disband Group</AlertDialogTitle>
          <AlertDialogDescription>
            This will disband <strong>{groupName}</strong>. Members will no longer be able to chat. This action is logged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="disband-reason">Reason *</Label>
          <Textarea id="disband-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for disbanding..." className="mt-2" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading || !reason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Disband Group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GroupDisbandDialog;
