'use client';

import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Search, RefreshCw, Trash2, Plus, Loader2, FileText, ZoomIn,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  getVerificationQueue, deleteVerificationRequest,
  createVerificationRequest, searchUsers, getSignedDocumentUrl, VerificationRequest,
} from "@/services/adminService";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
};

const DOC_TYPES = [
  { value: "medical_license", label: "Medical License" },
  { value: "approbation",     label: "Approbation" },
  { value: "hospital_id",     label: "Hospital ID" },
  { value: "employment_proof",label: "Employment Proof" },
];

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  // Signed thumbnail URLs keyed by request id
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<VerificationRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createDocType, setCreateDocType] = useState("medical_license");
  const [createUserQuery, setCreateUserQuery] = useState("");
  const [createResults, setCreateResults] = useState<any[]>([]);
  const [createSearching, setCreateSearching] = useState(false);
  const [createSelected, setCreateSelected] = useState<any | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getVerificationQueue(statusFilter);
    setRequests(data);
    setLoading(false);

    // Batch-load signed URLs for all rows that have a file
    const withFiles = data.filter((r) => r.file_url);
    if (withFiles.length === 0) return;
    const entries = await Promise.all(
      withFiles.map(async (r) => {
        const url = await getSignedDocumentUrl(r.file_url!);
        return [r.id, url] as [string, string | null];
      })
    );
    const map: Record<string, string> = {};
    for (const [id, url] of entries) {
      if (url) map[id] = url;
    }
    setSignedUrls(map);
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  // Debounced user search for create modal
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!createUserQuery.trim() || createUserQuery.length < 2) { setCreateResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setCreateSearching(true);
      const data = await searchUsers(createUserQuery);
      setCreateResults(data);
      setCreateSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [createUserQuery]);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.full_name?.toLowerCase().includes(q) || r.user_id.toLowerCase().includes(q);
  });

  const isOverdue = (createdAt: string, status: string) => {
    if (status !== "pending") return false;
    return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60) > 48;
  };

  const counts = {
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const ok = await deleteVerificationRequest(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (ok) { toast({ title: "Request deleted" }); fetchRequests(); }
    else toast({ title: "Delete failed", variant: "destructive" });
  };

  const handleCreate = async () => {
    if (!createSelected) return;
    setCreateLoading(true);
    const result = await createVerificationRequest(createSelected.user_id, createDocType);
    setCreateLoading(false);
    if (result.success) {
      toast({ title: "Request created", description: `Pending request created for ${createSelected.full_name}` });
      setCreateOpen(false);
      setCreateSelected(null);
      setCreateUserQuery("");
      setCreateDocType("medical_license");
      fetchRequests();
    } else {
      toast({ title: "Failed to create request", description: result.error, variant: "destructive" });
    }
  };

  const resetCreateModal = () => {
    setCreateOpen(false);
    setCreateSelected(null);
    setCreateUserQuery("");
    setCreateResults([]);
    setCreateDocType("medical_license");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-8 w-8" />
              Verification Queue
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {counts.pending > 0 && <span className="text-amber-600 font-medium">{counts.pending} pending · </span>}
              {counts.approved} approved · {counts.rejected} rejected
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchRequests}>
              <RefreshCw className="h-4 w-4 mr-2" />Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Create Request
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <Button key={status} variant={statusFilter === status ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && counts[status as keyof typeof counts] > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({counts[status as keyof typeof counts]})</span>
                )}
              </Button>
            ))}
          </div>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Verification Requests</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />Loading...
              </div>
            ) : filteredRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No verification requests found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-2 font-medium text-muted-foreground">Doc</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Doctor</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Specialty</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">City</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Document</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Submitted</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">SLA</th>
                      <th className="py-3 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">
                          {signedUrls[r.id] ? (
                            (r.file_url ?? "").toLowerCase().includes(".pdf") ? (
                              <a href={signedUrls[r.id]} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center w-12 h-12 rounded border bg-muted hover:bg-muted/80">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </a>
                            ) : (
                              <button
                                className="w-12 h-12 rounded border overflow-hidden bg-muted hover:ring-2 hover:ring-primary/50 transition-all group relative shrink-0"
                                onClick={() => setLightboxUrl(signedUrls[r.id])}
                              >
                                <img
                                  src={signedUrls[r.id]}
                                  alt="License"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-90 drop-shadow" />
                                </div>
                              </button>
                            )
                          ) : r.file_url ? (
                            <div className="flex items-center justify-center w-12 h-12 rounded border bg-muted">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-12 h-12 rounded border bg-muted/50">
                              <FileText className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Link href={pathWithLocale(`/admin/verifications/${r.user_id}`)} className="font-medium hover:underline text-primary">
                            {r.full_name || "Unknown"}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{r.specialty || "—"}</td>
                        <td className="py-3 px-2 text-muted-foreground">{r.city || "—"}</td>
                        <td className="py-3 px-2 text-muted-foreground capitalize">
                          {r.document_type?.replace(/_/g, " ") || "—"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={statusColors[r.status] ?? statusColors.pending}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {isOverdue(r.created_at, r.status)
                            ? <Badge variant="destructive">Overdue</Badge>
                            : r.status === "pending"
                              ? <span className="text-xs text-muted-foreground">Within SLA</span>
                              : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete verification request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the request for <strong>{deleteTarget?.full_name || "this user"}</strong> and reset their verification status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Thumbnail lightbox */}
      {lightboxUrl && (
        <Dialog open={!!lightboxUrl} onOpenChange={(v) => !v && setLightboxUrl(null)}>
          <DialogContent className="max-w-5xl w-full p-2">
            <img
              src={lightboxUrl}
              alt="License document"
              className="w-full h-auto max-h-[85vh] object-contain rounded"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Create request modal */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && resetCreateModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Verification Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* User search */}
            <div className="space-y-2">
              <Label>Doctor</Label>
              {createSelected ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={createSelected.avatar_url || undefined} />
                    <AvatarFallback>{createSelected.full_name?.charAt(0) ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{createSelected.full_name}</p>
                    <p className="text-xs text-muted-foreground">{createSelected.city || "—"}</p>
                  </div>
                  <button className="text-xs text-muted-foreground underline" onClick={() => { setCreateSelected(null); setCreateUserQuery(""); }}>
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by name..."
                    value={createUserQuery}
                    onChange={(e) => setCreateUserQuery(e.target.value)}
                    autoFocus
                  />
                  {createSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {createResults.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full border rounded-lg bg-background shadow-md divide-y max-h-48 overflow-y-auto">
                      {createResults.map((u) => (
                        <button key={u.user_id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left" onClick={() => { setCreateSelected(u); setCreateUserQuery(""); setCreateResults([]); }}>
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback>{u.full_name?.charAt(0) ?? "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.full_name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{u.city || "—"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document type */}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={createDocType} onValueChange={setCreateDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              The request will use the license file the doctor already uploaded. If they have no file yet, the request is created without a document.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCreateModal} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!createSelected || createLoading}>
              {createLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
