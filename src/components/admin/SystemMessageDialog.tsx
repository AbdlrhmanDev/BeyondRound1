'use client';

import { useState } from "react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SystemMessageDialogProps {
  open: boolean;
  onConfirm: (content: string) => Promise<void>;
  onCancel: () => void;
}

const SystemMessageDialog = ({ open, onConfirm, onCancel }: SystemMessageDialogProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!content.trim()) return;
    setLoading(true);
    await onConfirm(content.trim());
    setLoading(false);
    setContent("");
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onCancel(); setContent(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send System Message</AlertDialogTitle>
          <AlertDialogDescription>
            This message will appear in the group chat as a system notification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="system-msg">Message *</Label>
          <Textarea id="system-msg" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter system message..." className="mt-2" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading || !content.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Message
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SystemMessageDialog;
