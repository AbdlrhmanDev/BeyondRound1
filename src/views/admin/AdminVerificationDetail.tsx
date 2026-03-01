'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, ArrowLeft, Check, RotateCcw, X, Loader2,
  FileText, ExternalLink, Trash2, Copy, CheckCheck, ZoomIn,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";
import {
  getVerificationDetail,
  getSignedDocumentUrl,
  approveVerification,
  rejectVerification,
  requestReupload,
  deleteVerificationRequest,
  VerificationRequest,
} from "@/services/adminService";
import VerificationDecisionDialog from "@/components/admin/VerificationDecisionDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";

type DecisionType = "approve" | "reject" | "reupload";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  approved: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-600 border-red-200",
};

const docTypeLabels: Record<string, string> = {
  medical_license: "Medical License",
  approbation: "Approbation",
  hospital_id: "Hospital ID",
  employment_proof: "Employment Proof",
};

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const userId = params?.user_id as string;
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Decision dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<DecisionType>("approve");

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Image lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getVerificationDetail(userId);
    setRequest(data);

    if (data?.file_url) {
      setUrlLoading(true);
      const url = await getSignedDocumentUrl(data.file_url);
      setSignedUrl(url);
      setUrlLoading(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const openConfirmation = (action: DecisionType) => {
    if ((action === "reject" || action === "reupload") && !reason.trim()) {
      toast({ title: "Reason required", description: "Enter a reason before rejecting or requesting re-upload.", variant: "destructive" });
      return;
    }
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    let success = false;
    switch (dialogAction) {
      case "approve":  success = await approveVerification(userId, reason || undefined); break;
      case "reject":   success = await rejectVerification(userId, reason); break;
      case "reupload": success = await requestReupload(userId, reason); break;
    }
    setActionLoading(false);
    setDialogOpen(false);
    if (success) {
      toast({ title: "Done", description: `Verification ${dialogAction === "approve" ? "approved" : dialogAction === "reject" ? "rejected" : "re-upload requested"}` });
      fetchData();
      setReason("");
    } else {
      toast({ title: "Error", description: "Action failed — check console", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    setDeleteLoading(true);
    const ok = await deleteVerificationRequest(request.id);
    setDeleteLoading(false);
    setDeleteOpen(false);
    if (ok) {
      toast({ title: "Request deleted" });
      window.history.back();
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const copyUrl = () => {
    if (!request?.file_url) return;
    navigator.clipboard.writeText(request.file_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!request) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Verification request not found</p>
          <Link href={pathWithLocale("/admin/verifications")}>
            <Button variant="link" className="mt-4">Back to queue</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isPending = request.status === "pending";
  const isReuploadRequest = request.rejection_reason?.startsWith("REUPLOAD_REQUESTED:");
  const isPdf = (request.file_url ?? "").toLowerCase().includes(".pdf");
  const docLabel = docTypeLabels[request.document_type] ?? request.document_type?.replace(/_/g, " ");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={pathWithLocale("/admin/verifications")}>
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                Verification Review
              </h1>
              <p className="text-muted-foreground text-sm">{request.full_name || "Unknown User"}</p>
            </div>
            <Badge className={statusColors[request.status] ?? statusColors.pending}>
              {isReuploadRequest ? "Re-upload Requested" : request.status}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Request
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: User Summary */}
          <Card>
            <CardHeader><CardTitle>User Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Full Name" value={request.full_name} />
              <InfoRow label="City" value={request.city} />
              <InfoRow label="Specialty" value={request.specialty} />
              <InfoRow label="Career Stage" value={request.career_stage} />
              <InfoRow label="Document Type" value={docLabel} />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Profile Status</span>
                <Badge className={statusColors[request.verification_status ?? "pending"] ?? statusColors.pending}>
                  {request.verification_status ?? "—"}
                </Badge>
              </div>
              <InfoRow label="Submitted" value={request.created_at ? format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a") : null} />
              {request.reviewed_at && (
                <InfoRow label="Last Reviewed" value={format(new Date(request.reviewed_at), "MMM d, yyyy 'at' h:mm a")} />
              )}
              {request.rejection_reason && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Previous Notes</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">
                    {request.rejection_reason.replace("REUPLOAD_REQUESTED: ", "")}
                  </p>
                </div>
              )}

              {/* File URL */}
              {request.file_url && (
                <div className="pt-1 border-t">
                  <span className="text-xs text-muted-foreground block mb-1">File URL</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1 block">
                      {request.file_url.split('/').pop()}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyUrl}>
                      {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <a href={request.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Document Preview
                {signedUrl && !isPdf && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setLightboxOpen(true)}>
                    <ZoomIn className="h-3.5 w-3.5" />
                    Full size
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urlLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !signedUrl ? (
                <div className="text-center py-12 space-y-2">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No document available</p>
                </div>
              ) : isPdf ? (
                <div className="space-y-3">
                  <embed
                    src={signedUrl}
                    type="application/pdf"
                    className="w-full rounded border bg-muted"
                    style={{ height: "480px" }}
                  />
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open PDF in new tab
                    </Button>
                  </a>
                </div>
              ) : (
                <button
                  className="w-full cursor-zoom-in group relative rounded overflow-hidden border bg-muted"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={signedUrl}
                    alt="License document"
                    className="w-full max-h-96 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow" />
                  </div>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Decision Panel */}
        {isPending && (
          <Card>
            <CardHeader><CardTitle>Decision</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">
                  Reason{" "}
                  <span className="text-muted-foreground text-xs">(required for reject / re-upload)</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for your decision..."
                  className="mt-2 min-h-[80px]"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => openConfirmation("approve")} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" onClick={() => openConfirmation("reupload")} disabled={actionLoading || !reason.trim()} className="border-amber-500 text-amber-600 hover:bg-amber-50 gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Request Re-upload
                </Button>
                <Button variant="destructive" onClick={() => openConfirmation("reject")} disabled={actionLoading || !reason.trim()} className="gap-2">
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Decision confirmation dialog */}
      <VerificationDecisionDialog
        open={dialogOpen}
        action={dialogAction}
        userName={request.full_name || "this user"}
        reason={reason}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete verification request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the request for <strong>{request.full_name || "this user"}</strong> and reset their verification status. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image lightbox */}
      {signedUrl && !isPdf && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl w-full p-2">
            <img
              src={signedUrl}
              alt="License document"
              className="w-full h-auto max-h-[85vh] object-contain rounded"
            />
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
