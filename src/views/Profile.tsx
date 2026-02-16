'use client';

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import {
  CheckCircle2,
  Camera,
  MapPin,
  Globe,
  Calendar,
  Users,
  Pencil,
  ChevronRight,
  Shield,
  FileText,
  LogOut,
  MessageSquare,
  Bell,
  ExternalLink,
  Trash2,
  Clock,
  AlertTriangle,
  Upload,
  X,
  ShieldCheck,
  Loader2,
  AlertCircle,
  BellRing,
  HelpCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
type VerificationStatus = "not_started" | "pending" | "verified" | "rejected";

interface ProfileData {
  full_name: string;
  initials: string;
  avatar_url: string | null;
  specialty: string;
  city: string;
  country: string;
  verification_status: VerificationStatus;
  bio: string;
  languages: string[];
  interests: string[];
  email_notifications: boolean;
  push_notifications: boolean;
}

// ─── Mock Data ──────────────────────────────────────────
const initialProfile: ProfileData = {
  full_name: "Dr. Sarah Chen",
  initials: "SC",
  avatar_url: null,
  specialty: "Internal Medicine",
  city: "Berlin",
  country: "Germany",
  verification_status: "not_started",
  bio: "Internal medicine physician. Originally from Munich, now based in Berlin.",
  languages: ["English", "German"],
  interests: ["Running", "Cooking", "Travel", "Photography", "Wine", "Yoga"],
  email_notifications: true,
  push_notifications: false,
};

// ─── Available Options ──────────────────────────────────
const CITIES = [
  "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne",
  "Düsseldorf", "Stuttgart", "Leipzig", "Dresden", "Hannover",
];

const LANGUAGES = [
  "English", "German", "French", "Spanish", "Turkish",
  "Arabic", "Russian", "Portuguese", "Italian", "Mandarin",
];

const SPECIALTIES = [
  "Internal Medicine", "Pediatrics", "Surgery", "Neurology",
  "Cardiology", "Dermatology", "Psychiatry", "Radiology",
  "Orthopedics", "Anesthesiology", "Emergency Medicine",
  "Family Medicine", "Ophthalmology", "ENT", "Urology",
];

const ALL_INTERESTS = [
  "Running", "Cooking", "Travel", "Photography", "Wine",
  "Yoga", "Cycling", "Board Games", "Music", "Reading",
  "Hiking", "Coffee", "Art", "Tennis", "Swimming",
  "Meditation", "Gardening", "Film", "Dance", "Climbing",
];

const mockStats = {
  meetups: 3,
  doctorsMet: 12,
};

// ─── Edit Profile Sheet ─────────────────────────────────
function EditProfileSheet({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onSave: (updates: Partial<ProfileData>) => void;
}) {
  const [name, setName] = useState(profile.full_name);
  const [specialty, setSpecialty] = useState(profile.specialty);
  const [bio, setBio] = useState(profile.bio);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests);
  const [saving, setSaving] = useState(false);

  // Sync when profile changes or sheet opens
  const handleOpen = useCallback(
    (value: boolean) => {
      if (value) {
        setName(profile.full_name);
        setSpecialty(profile.specialty);
        setBio(profile.bio);
        setSelectedInterests(profile.interests);
      }
      onOpenChange(value);
    },
    [onOpenChange, profile]
  );

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 8
          ? [...prev, interest]
          : prev
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      const words = name.trim().split(" ");
      const initials =
        words.length >= 2
          ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
          : name.trim().slice(0, 2).toUpperCase();

      onSave({
        full_name: name.trim(),
        initials,
        specialty,
        bio: bio.trim(),
        interests: selectedInterests,
      });
      setSaving(false);
      onOpenChange(false);
    }, 800);
  }, [name, specialty, bio, selectedInterests, onSave, onOpenChange]);

  const hasChanges =
    name !== profile.full_name ||
    specialty !== profile.specialty ||
    bio !== profile.bio ||
    JSON.stringify(selectedInterests) !== JSON.stringify(profile.interests);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            Edit profile
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Update your name, specialty, and interests.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-2">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. First Last"
              className="h-12 rounded-[14px]"
              aria-label="Full name"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Specialty
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full h-12 rounded-[14px] border border-input bg-background px-4 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Medical specialty"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              About you
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about yourself..."
              maxLength={200}
              className="w-full h-24 rounded-[14px] border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Bio"
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Interests ({selectedInterests.length}/8)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.96] min-h-[36px] ${
                      selected
                        ? "bg-accent text-white"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                    aria-pressed={selected}
                    aria-label={interest}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !hasChanges || saving}
            className="w-full h-[52px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit City Sheet ────────────────────────────────────
function EditCitySheet({
  open,
  onOpenChange,
  currentCity,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCity: string;
  onSave: (city: string) => void;
}) {
  const [selected, setSelected] = useState(currentCity);
  const [saving, setSaving] = useState(false);

  const handleOpen = useCallback(
    (value: boolean) => {
      if (value) setSelected(currentCity);
      onOpenChange(value);
    },
    [onOpenChange, currentCity]
  );

  const handleSave = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      onSave(selected);
      setSaving(false);
      onOpenChange(false);
    }, 600);
  }, [selected, onSave, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            Your city
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Choose the city where you'd like to meet other doctors.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pt-4 pb-2">
          <div className="space-y-1">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelected(city)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] text-left transition-all min-h-[48px] active:scale-[0.99] ${
                  selected === city
                    ? "bg-accent/10 border border-accent/30"
                    : "hover:bg-muted/40"
                }`}
                aria-pressed={selected === city}
              >
                <div className="flex items-center gap-3">
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${
                      selected === city ? "text-accent" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      selected === city ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {city}
                  </span>
                </div>
                {selected === city && (
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={selected === currentCity || saving}
            className="w-full h-[52px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update city"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit Language Sheet ────────────────────────────────
function EditLanguageSheet({
  open,
  onOpenChange,
  currentLanguages,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLanguages: string[];
  onSave: (languages: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(currentLanguages);
  const [saving, setSaving] = useState(false);

  const handleOpen = useCallback(
    (value: boolean) => {
      if (value) setSelected(currentLanguages);
      onOpenChange(value);
    },
    [onOpenChange, currentLanguages]
  );

  const toggleLanguage = useCallback((lang: string) => {
    setSelected((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }, []);

  const handleSave = useCallback(() => {
    if (selected.length === 0) return;
    setSaving(true);
    setTimeout(() => {
      onSave(selected);
      setSaving(false);
      onOpenChange(false);
    }, 600);
  }, [selected, onSave, onOpenChange]);

  const hasChanges = JSON.stringify(selected.sort()) !== JSON.stringify([...currentLanguages].sort());

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            Languages
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Select the languages you speak. This helps us match you with compatible groups.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pt-4 pb-2">
          <div className="space-y-1">
            {LANGUAGES.map((lang) => {
              const isSelected = selected.includes(lang);
              return (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] text-left transition-all min-h-[48px] active:scale-[0.99] ${
                    isSelected
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-muted/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <Globe
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-accent" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {lang}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selected.length === 0 && (
            <p className="text-xs text-red-500 text-center">Select at least one language.</p>
          )}

          <Button
            onClick={handleSave}
            disabled={selected.length === 0 || !hasChanges || saving}
            className="w-full h-[52px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update languages"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Verification Badge ─────────────────────────────────
function VerificationBadge({
  status,
  onTap,
}: {
  status: VerificationStatus;
  onTap: () => void;
}) {
  const config = {
    not_started: {
      label: "Not verified",
      className: "bg-muted text-muted-foreground border-border",
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    pending: {
      label: "Verification pending",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    verified: {
      label: "Verified doctor",
      className: "bg-primary/10 text-primary border-primary/20",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    rejected: {
      label: "Verification needed",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
  };

  const { label, className, icon } = config[status];

  return (
    <button
      onClick={onTap}
      className="min-h-[44px] flex items-center justify-center"
      aria-label={`Verification status: ${label}. Tap to manage verification.`}
    >
      <Badge className={`gap-1.5 px-3 py-1 cursor-pointer ${className}`}>
        {icon}
        {label}
      </Badge>
    </button>
  );
}

// ─── Verification Sheet ─────────────────────────────────
function VerificationSheet({
  open,
  onOpenChange,
  status,
  onSubmit,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: VerificationStatus;
  onSubmit: () => void;
  onRetry: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback(() => {
    setUploadError(null);
    setUploading(true);
    // Simulate file upload
    setTimeout(() => {
      setFileName("medical_license.pdf");
      setUploading(false);
    }, 1500);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!fileName) return;
    onSubmit();
    setFileName(null);
  }, [fileName, onSubmit]);

  const handleRetry = useCallback(() => {
    setFileName(null);
    setUploadError(null);
    onRetry();
  }, [onRetry]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            {status === "rejected" ? "Resubmit verification" : "Doctor verification"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground leading-relaxed">
            {status === "rejected"
              ? "Your previous submission couldn't be verified. Please upload a clearer document."
              : "Verify your medical credentials to join meetups and connect with other doctors."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-4">
          {/* Not started / Rejected: show upload form */}
          {(status === "not_started" || status === "rejected") && (
            <>
              {/* What we accept */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Accepted documents
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Medical license (Approbationsurkunde)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Hospital ID or official letter
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Medical chamber registration
                  </li>
                </ul>
              </div>

              {/* Upload area */}
              <div className="space-y-3">
                {!fileName ? (
                  <button
                    onClick={handleFileSelect}
                    disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-[18px] border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 transition-colors min-h-[120px] active:scale-[0.99]"
                    aria-label="Upload verification document"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          Upload document
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PDF, JPG, or PNG · Max 10 MB
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-[14px] bg-primary/5 border border-primary/20">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1 truncate">
                      {fileName}
                    </span>
                    <button
                      onClick={() => setFileName(null)}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Remove uploaded file"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-start gap-2 p-3 rounded-[12px] bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900" role="alert" aria-live="assertive">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 p-3 rounded-[12px] bg-muted/40">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your document is encrypted and only used for verification. It will not be
                  shared or stored after review.
                </p>
              </div>

              {/* Submit CTA */}
              <Button
                onClick={status === "rejected" ? handleRetry : handleSubmit}
                disabled={!fileName}
                className="w-full h-[52px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {status === "rejected" ? "Resubmit for review" : "Submit for review"}
              </Button>

              {/* Timeline note */}
              <p className="text-center text-xs text-muted-foreground">
                Reviews typically take 1–2 business days.
              </p>
            </>
          )}

          {/* Pending state */}
          {status === "pending" && (
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  Under review
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                  We're reviewing your document. This usually takes 1–2 business days. We'll
                  notify you once it's complete.
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-[12px] bg-muted/40 text-left">
                <BellRing className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  You'll receive a notification when your verification is approved.
                </p>
              </div>
            </div>
          )}

          {/* Verified state */}
          {status === "verified" && (
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  You're verified
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                  Your doctor status has been confirmed. You have full access to all
                  BeyondRounds features.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete Account Dialog ──────────────────────────────
function DeleteAccountFlow({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<"warning" | "confirm" | "success">("warning");
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const navigate = useLocalizedNavigate();

  const handleClose = useCallback(
    (value: boolean) => {
      if (!value) {
        // Reset state when closing
        setTimeout(() => {
          setStep("warning");
          setConfirmText("");
          setReason("");
          setDeleting(false);
        }, 300);
      }
      onOpenChange(value);
    },
    [onOpenChange]
  );

  const handleDelete = useCallback(() => {
    setDeleting(true);
    // Simulate deletion
    setTimeout(() => {
      setDeleting(false);
      setStep("success");
    }, 2000);
  }, []);

  const handleDone = useCallback(() => {
    handleClose(false);
    onConfirm();
  }, [handleClose, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[24px] max-w-[400px] mx-4 p-0 overflow-hidden">
        {/* Warning step */}
        {step === "warning" && (
          <div className="p-6 space-y-5">
            <DialogHeader className="space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="font-display text-xl font-bold text-foreground text-center">
                Delete your account?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center leading-relaxed">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                What happens when you delete
              </p>
              <ul className="space-y-2.5">
                {[
                  "Your profile and personal data will be permanently removed",
                  "Your chat history will no longer be visible to group members",
                  "Any active meetup reservations will be cancelled",
                  "Your verification status will be revoked",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Need help instead? */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => {
                  handleClose(false);
                  navigate("/contact");
                }}
                className="text-xs text-accent font-medium underline underline-offset-2 min-h-[44px] flex items-center"
              >
                Need help instead? Contact us
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="flex-1 h-12 rounded-full font-semibold"
              >
                Keep my account
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className="flex-1 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold active:scale-[0.98] transition-all"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Confirm step */}
        {step === "confirm" && (
          <div className="p-6 space-y-5">
            <DialogHeader className="space-y-2">
              <DialogTitle className="font-display text-lg font-bold text-foreground text-center">
                Confirm deletion
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center leading-relaxed">
                Type <span className="font-mono font-semibold text-foreground">DELETE</span> below
                to confirm.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="h-12 rounded-[14px] text-center font-mono tracking-wider"
                aria-label="Type DELETE to confirm account deletion"
                autoComplete="off"
              />

              {/* Optional reason */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Reason for leaving (optional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-12 rounded-[14px] border border-input bg-background px-4 text-sm text-foreground appearance-none cursor-pointer"
                  aria-label="Reason for deleting account"
                >
                  <option value="">Select a reason...</option>
                  <option value="not_useful">Not finding it useful</option>
                  <option value="no_time">Don't have time</option>
                  <option value="privacy">Privacy concerns</option>
                  <option value="moving">Moving to a different city</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("warning")}
                className="flex-1 h-12 rounded-full font-semibold"
              >
                Go back
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="flex-1 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {deleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Delete my account"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success step */}
        {step === "success" && (
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Account scheduled for deletion
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your account has been scheduled for deletion. All data will be removed within
                30 days. You'll receive a confirmation email.
              </p>
            </div>
            <Button
              onClick={handleDone}
              className="w-full h-12 rounded-full font-semibold active:scale-[0.98] transition-all"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Feedback Sheet ─────────────────────────────────────
function FeedbackSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1000);
  }, [feedback]);

  const handleClose = useCallback(
    (value: boolean) => {
      if (!value) {
        setTimeout(() => {
          setFeedback("");
          setSubmitted(false);
        }, 300);
      }
      onOpenChange(value);
    },
    [onOpenChange]
  );

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-[24px]">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            Feedback & suggestions
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Help us make BeyondRounds better for you.
          </SheetDescription>
        </SheetHeader>

        {!submitted ? (
          <div className="space-y-4 pt-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What's on your mind? Share ideas, report issues, or suggest improvements..."
              className="w-full h-32 rounded-[14px] border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Your feedback"
            />
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || submitting}
              className="w-full h-[52px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send feedback"
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                Thank you
              </h3>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us build a better experience for doctors.
              </p>
            </div>
            <Button
              onClick={() => handleClose(false)}
              variant="outline"
              className="h-11 rounded-full px-8 font-semibold"
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Sign Out Confirmation ──────────────────────────────
function SignOutDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[24px] max-w-[360px] mx-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-display text-lg font-bold text-foreground text-center">
            Sign out?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            You can sign back in anytime with your email.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-full font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Settings Row ───────────────────────────────────────
function SettingsRow({
  icon: Icon,
  label,
  description,
  onClick,
  external,
  danger,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  external?: boolean;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left min-h-[56px] active:bg-muted/50"
      aria-label={description ? `${label}: ${description}` : label}
    >
      <div className="flex items-center gap-4">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? "bg-red-500/10" : "bg-muted/80"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${danger ? "text-red-600" : "text-muted-foreground"}`}
          />
        </div>
        <div>
          <p
            className={`text-sm font-semibold ${
              danger ? "text-red-600" : "text-foreground"
            }`}
          >
            {label}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {trailing || (
        <>
          {external ? (
            <ExternalLink className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          )}
        </>
      )}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function Profile() {
  const { signOut } = useAuth();
  const navigate = useLocalizedNavigate();

  // Profile state
  const [profile, setProfile] = useState<ProfileData>(initialProfile);

  // UI state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editCityOpen, setEditCityOpen] = useState(false);
  const [editLanguageOpen, setEditLanguageOpen] = useState(false);
  const [verificationSheetOpen, setVerificationSheetOpen] = useState(false);
  const [feedbackSheetOpen, setFeedbackSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [emailNotifLoading, setEmailNotifLoading] = useState(false);
  const [pushNotifLoading, setPushNotifLoading] = useState(false);

  // ── Handlers ────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch {
      setSigningOut(false);
    }
  }, [signOut, navigate]);

  const handleVerificationSubmit = useCallback(() => {
    setProfile((prev) => ({ ...prev, verification_status: "pending" as VerificationStatus }));
  }, []);

  const handleVerificationRetry = useCallback(() => {
    // Reset to not_started so user can re-upload
    setProfile((prev) => ({ ...prev, verification_status: "not_started" as VerificationStatus }));
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    // After deletion animation, sign out
    setTimeout(async () => {
      await signOut();
      navigate("/");
    }, 500);
  }, [signOut, navigate]);

  const handleProfileSave = useCallback((updates: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCitySave = useCallback((city: string) => {
    setProfile((prev) => ({ ...prev, city }));
  }, []);

  const handleLanguageSave = useCallback((languages: string[]) => {
    setProfile((prev) => ({ ...prev, languages }));
  }, []);

  const handleToggleEmailNotif = useCallback(() => {
    setEmailNotifLoading(true);
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        email_notifications: !prev.email_notifications,
      }));
      setEmailNotifLoading(false);
    }, 600);
  }, []);

  const handleTogglePushNotif = useCallback(() => {
    setPushNotifLoading(true);
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        push_notifications: !prev.push_notifications,
      }));
      setPushNotifLoading(false);
    }, 600);
  }, []);

  const handleAvatarEdit = useCallback(() => {
    // In production: open file picker → upload → update profile
    alert("Avatar upload would open here");
  }, []);

  // ── Verification helper text for account row ──────
  const verificationHelper: Record<VerificationStatus, string> = {
    not_started: "Verify to join meetups",
    pending: "Review in progress",
    verified: "Your status is confirmed",
    rejected: "Resubmit your document",
  };

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* ── Profile Header ──────────────────────────── */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarEdit}
              className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background active:scale-[0.95] transition-transform"
              aria-label="Change profile photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight mb-1">
            {profile.full_name}
          </h1>

          {profile.specialty && (
            <p className="text-sm text-muted-foreground mb-3 bg-muted/50 px-3 py-1 rounded-full">
              {profile.specialty}
            </p>
          )}

          <VerificationBadge
            status={profile.verification_status}
            onTap={() => setVerificationSheetOpen(true)}
          />
        </div>

        {/* ── Stats ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-[18px] bg-card border border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {mockStats.meetups}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                Meetups
              </span>
            </CardContent>
          </Card>
          <Card className="rounded-[18px] bg-card border border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {mockStats.doctorsMet}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                Doctors met
              </span>
            </CardContent>
          </Card>
        </div>

        {/* ── Preferences ─────────────────────────────── */}
        <Card className="rounded-[20px] bg-card border border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border/60 bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Preferences
              </h2>
            </div>

            <div className="divide-y divide-border/60">
              {/* City */}
              <button
                onClick={() => setEditCityOpen(true)}
                className="w-full flex items-center gap-4 px-5 py-4 min-h-[56px] hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
                aria-label={`City: ${profile.city}. Tap to change.`}
              >
                <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">City</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.city}, {profile.country}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>

              {/* Language */}
              <button
                onClick={() => setEditLanguageOpen(true)}
                className="w-full flex items-center gap-4 px-5 py-4 min-h-[56px] hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
                aria-label={`Languages: ${profile.languages.join(", ")}. Tap to change.`}
              >
                <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Language</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.languages.join(", ")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>

              {/* Email notifications */}
              <div className="flex items-center gap-4 px-5 py-4 min-h-[56px]">
                <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Email notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meetup reminders and updates
                  </p>
                </div>
                <Switch
                  checked={profile.email_notifications}
                  onCheckedChange={handleToggleEmailNotif}
                  loading={emailNotifLoading}
                  aria-label="Toggle email notifications"
                />
              </div>

              {/* Push notifications */}
              <div className="flex items-center gap-4 px-5 py-4 min-h-[56px]">
                <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
                  <BellRing className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Push notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chat messages and match alerts
                  </p>
                </div>
                <Switch
                  checked={profile.push_notifications}
                  onCheckedChange={handleTogglePushNotif}
                  loading={pushNotifLoading}
                  aria-label="Toggle push notifications"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Account ─────────────────────────────────── */}
        <Card className="rounded-[20px] bg-card border border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border/60 bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Account
              </h2>
            </div>

            <div className="divide-y divide-border/60">
              <SettingsRow
                icon={Pencil}
                label="Edit profile"
                description="Name, specialty, interests"
                onClick={() => setEditProfileOpen(true)}
              />

              <SettingsRow
                icon={ShieldCheck}
                label="Doctor verification"
                description={verificationHelper[profile.verification_status]}
                onClick={() => setVerificationSheetOpen(true)}
              />

              <SettingsRow
                icon={MessageSquare}
                label="Feedback & suggestions"
                description="Help us improve BeyondRounds"
                onClick={() => setFeedbackSheetOpen(true)}
              />

              <SettingsRow
                icon={Shield}
                label="Privacy policy"
                onClick={() => navigate("/privacy")}
                external
              />

              <SettingsRow
                icon={FileText}
                label="Terms of service"
                onClick={() => navigate("/terms")}
                external
              />

              <SettingsRow
                icon={Trash2}
                label="Delete account"
                description="Permanently remove your data"
                onClick={() => setDeleteDialogOpen(true)}
                danger
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Sign Out ────────────────────────────────── */}
        <Card className="rounded-[20px] bg-card border border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setSignOutDialogOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[56px] active:bg-red-100 dark:active:bg-red-950/50"
              aria-label="Sign out of your account"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-semibold">Sign out</span>
            </button>
          </CardContent>
        </Card>

        {/* Bottom spacing for nav */}
        <div className="h-4" />
      </main>

      {/* ── Modals & Sheets ──────────────────────────── */}
      <EditProfileSheet
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={profile}
        onSave={handleProfileSave}
      />

      <EditCitySheet
        open={editCityOpen}
        onOpenChange={setEditCityOpen}
        currentCity={profile.city}
        onSave={handleCitySave}
      />

      <EditLanguageSheet
        open={editLanguageOpen}
        onOpenChange={setEditLanguageOpen}
        currentLanguages={profile.languages}
        onSave={handleLanguageSave}
      />

      <VerificationSheet
        open={verificationSheetOpen}
        onOpenChange={setVerificationSheetOpen}
        status={profile.verification_status}
        onSubmit={handleVerificationSubmit}
        onRetry={handleVerificationRetry}
      />

      <FeedbackSheet
        open={feedbackSheetOpen}
        onOpenChange={setFeedbackSheetOpen}
      />

      <DeleteAccountFlow
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />

      <SignOutDialog
        open={signOutDialogOpen}
        onOpenChange={setSignOutDialogOpen}
        onConfirm={handleSignOut}
        loading={signingOut}
      />
    </DashboardLayout>
  );
}
