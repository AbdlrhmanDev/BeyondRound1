'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft, Check, RotateCcw, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
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
  VerificationRequest,
} from "@/services/adminService";
import VerificationDecisionDialog from "@/components/admin/VerificationDecisionDialog";

type DecisionType = "approve" | "reject" | "reupload";

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const userId = params?.user_id as string;
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<DecisionType>("approve");

  const fetchData = async () => {
    setLoading(true);
    const data = await getVerificationDetail(userId);
    setRequest(data);

    if (data?.file_url) {
      const url = await getSignedDocumentUrl(data.file_url);
      if (url) setSignedUrls([url]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const openConfirmation = (action: DecisionType) => {
    if ((action === "reject" || action === "reupload") && !reason.trim()) {
      toast({ title: "Error", description: "Reason is required", variant: "destructive" });
      return;
    }
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    let success = false;

    switch (dialogAction) {
      case "approve":
        success = await approveVerification(userId, reason || undefined);
        break;
      case "reject":
        success = await rejectVerification(userId, reason);
        break;
      case "reupload":
        success = await requestReupload(userId, reason);
        break;
    }

    setActionLoading(false);
    setDialogOpen(false);

    if (success) {
      toast({ title: "Success", description: `Verification ${dialogAction === "approve" ? "approved" : dialogAction === "reject" ? "rejected" : "re-upload requested"}` });
      fetchData();
      setReason("");
    } else {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={pathWithLocale("/admin/verifications")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-8 w-8" />
              Verification Review
            </h1>
            <p className="text-muted-foreground">
              {request.full_name || "Unknown User"}
            </p>
          </div>
          <Badge className={
            request.status === "approved" ? "bg-green-500/10 text-green-600" :
            request.status === "rejected" ? "bg-red-500/10 text-red-600" :
            "bg-amber-500/10 text-amber-600"
          }>
            {isReuploadRequest ? "Re-upload Requested" : request.status}
          </Badge>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: User Summary */}
          <Card>
            <CardHeader>
              <CardTitle>User Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Full Name" value={request.full_name} />
              <InfoRow label="City" value={request.city} />
              <InfoRow label="Specialty" value={request.specialty} />
              <InfoRow label="Career Stage" value={request.career_stage} />
              <InfoRow label="Verification Status" value={request.verification_status} />
              <InfoRow label="Document Type" value={request.document_type?.replace(/_/g, " ")} />
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
            </CardContent>
          </Card>

          {/* Right: Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {signedUrls.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No documents available
                </p>
              ) : (
                <div className="space-y-4">
                  {signedUrls.map((url, i) => {
                    const isPdf = url.toLowerCase().includes(".pdf");
                    return (
                      <div key={i} className="border rounded-lg overflow-hidden">
                        {isPdf ? (
                          <div className="p-4 flex items-center gap-3">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">PDF Document {i + 1}</p>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                View PDF
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={`Document ${i + 1}`}
                              className="w-full max-h-96 object-contain bg-muted"
                            />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Decision Panel */}
        {isPending && (
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">
                  Reason for decision {" "}
                  <span className="text-muted-foreground text-xs">(required for reject/re-upload)</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for your decision..."
                  className="mt-2 min-h-[80px]"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => openConfirmation("approve")}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Verification
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openConfirmation("reupload")}
                  disabled={actionLoading || !reason.trim()}
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Re-upload
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openConfirmation("reject")}
                  disabled={actionLoading || !reason.trim()}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <VerificationDecisionDialog
        open={dialogOpen}
        action={dialogAction}
        userName={request.full_name || "this user"}
        reason={reason}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
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
