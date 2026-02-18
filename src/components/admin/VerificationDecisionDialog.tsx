'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface VerificationDecisionDialogProps {
  open: boolean;
  action: "approve" | "reject" | "reupload";
  userName: string;
  reason: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const actionLabels = {
  approve: { title: "Approve Verification", description: "approve the verification for", color: "bg-green-600 hover:bg-green-700 text-white" },
  reject: { title: "Reject Verification", description: "reject the verification for", color: "bg-red-600 hover:bg-red-700 text-white" },
  reupload: { title: "Request Re-upload", description: "request new documents from", color: "bg-amber-600 hover:bg-amber-700 text-white" },
};

const VerificationDecisionDialog = ({
  open, action, userName, reason, loading, onConfirm, onCancel,
}: VerificationDecisionDialogProps) => {
  const config = actionLabels[action];

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {config.description} <strong>{userName}</strong>?
            {reason && (
              <span className="block mt-2 p-2 bg-muted rounded text-sm">
                Reason: {reason}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading} className={config.color}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VerificationDecisionDialog;
