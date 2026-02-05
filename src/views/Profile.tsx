'use client';

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { getProfile, updateProfile } from "@/services/profileService";
import { getOnboardingPreferences, saveOnboardingPreferences, OnboardingPreferences } from "@/services/onboardingService";
import { uploadAvatar } from "@/services/storageService";
import { LocationSelect } from "@/components/LocationSelect";
import {
  Camera,
  MapPin,
  Globe,
  CreditCard,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Users,
  Calendar,
  Pencil,
  MessageSquare,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Crown,
  Star,
  Zap,
} from "lucide-react";
import SmartFeedback from "@/components/SmartFeedback";
import EmailNotificationsToggle from "@/components/EmailNotificationsToggle";
import { cn } from "@/lib/utils";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  languages: string[] | null;
  license_url: string | null;
}

interface UserStats {
  meetups: number;
  doctorsMet: number;
}

// Subscription types
type SubscriptionPlan = 'free' | 'trial' | 'monthly' | 'premium';

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'expired' | 'none';
  trialUsed: boolean;
  nextBillingDate?: string;
  cancelAtPeriodEnd?: boolean;
}

// Plan data
const SUBSCRIPTION_PLANS = {
  trial: {
    id: 'trial',
    name: 'One-Time Trial',
    price: 9.99,
    period: 'one-time',
    popular: false,
    features: [
      'Weekly curated group matches',
      'Group chat access',
      'RoundsBot icebreakers',
      'Basic matching algorithm',
    ],
    cta: 'Start One-Time Trial',
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 14.99,
    period: 'month',
    popular: true,
    features: [
      'Everything in Trial',
      'Priority matching algorithm',
      'Expanded profile & interests',
      'Early access to new features',
      'Priority customer support',
    ],
    cta: 'Subscribe Monthly',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 29.99,
    period: 'month',
    popular: false,
    features: [
      'Everything in Monthly',
      'Advanced lifestyle compatibility',
      'AI-powered activity suggestions',
      'Filters by specialty, age & more',
      'Smaller group preference (2-3)',
      'Exclusive member events',
    ],
    cta: 'Go Premium',
  },
} as const;

// Specialties data
const SPECIALTIES = [
  { id: "General Practice", label: "General Practice", icon: "🏥" },
  { id: "Internal Medicine", label: "Internal Medicine", icon: "🩺" },
  { id: "Surgery", label: "Surgery", icon: "⚕️" },
  { id: "Pediatrics", label: "Pediatrics", icon: "👶" },
  { id: "Cardiology", label: "Cardiology", icon: "❤️" },
  { id: "Neurology", label: "Neurology", icon: "🧠" },
  { id: "Psychiatry", label: "Psychiatry", icon: "💭" },
  { id: "Emergency Medicine", label: "Emergency Medicine", icon: "🚑" },
  { id: "Anesthesiology", label: "Anesthesiology", icon: "💉" },
  { id: "Radiology", label: "Radiology", icon: "📷" },
  { id: "Dermatology", label: "Dermatology", icon: "✨" },
  { id: "Orthopedics", label: "Orthopedics", icon: "🦴" },
  { id: "Ophthalmology", label: "Ophthalmology", icon: "👁️" },
  { id: "Gynecology", label: "OB/GYN", icon: "👩‍⚕️" },
  { id: "Oncology", label: "Oncology", icon: "🎗️" },
  { id: "Other", label: "Other", icon: "➕" },
];

// Interests data
const INTERESTS = [
  { id: "running", label: "Running", icon: "🏃" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "gym", label: "Gym/Weights", icon: "🏋️" },
  { id: "tennis", label: "Tennis/Padel", icon: "🎾" },
  { id: "hiking", label: "Hiking", icon: "🥾" },
  { id: "yoga", label: "Yoga/Pilates", icon: "🧘" },
  { id: "reading", label: "Reading", icon: "📚" },
  { id: "cooking", label: "Cooking", icon: "👨‍🍳" },
  { id: "photography", label: "Photography", icon: "📸" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "art", label: "Art/Museums", icon: "🎨" },
  { id: "board_games", label: "Board Games", icon: "🎲" },
  { id: "video_games", label: "Video Games", icon: "🎮" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "wine", label: "Wine/Food", icon: "🍷" },
];

// Languages data
const LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useLocalizedNavigate();
  const { toast } = useToast();

  // Data state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats] = useState<UserStats>({ meetups: 3, doctorsMet: 12 });

  // Subscription state (TODO: fetch from backend)
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: 'free',
    status: 'none',
    trialUsed: false,
    nextBillingDate: undefined,
    cancelAtPeriodEnd: false,
  });

  // Modal/Drawer states
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [cityDrawerOpen, setCityDrawerOpen] = useState(false);
  const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [subscriptionDrawerOpen, setSubscriptionDrawerOpen] = useState(false);

  // Form state for edit profile modal
  const [editForm, setEditForm] = useState({
    name: "",
    specialty: "",
    interests: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Location state for city picker
  const [locationForm, setLocationForm] = useState({
    country: "",
    state: "",
    city: "",
  });

  // File upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Constants for avatar upload
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  // Name edit state
  const [editedName, setEditedName] = useState("");

  // Initialize form data when profile/preferences load
  useEffect(() => {
    if (profile) {
      setEditedName(profile.full_name || "");
      setLocationForm({
        country: profile.country || "",
        state: profile.state || "",
        city: profile.city || "",
      });
    }
    if (preferences) {
      setEditForm({
        name: profile?.full_name || "",
        specialty: preferences.specialty || "",
        interests: [
          ...(preferences.interests || []),
          ...(preferences.sports || []),
          ...(preferences.other_interests || []),
        ],
      });
    }
  }, [profile, preferences]);

  // Avatar file selection handler with validation
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error state
    setAvatarError(null);

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension || '')) {
      setAvatarError(t("profile.avatarInvalidType"));
      toast({
        title: t("profile.avatarInvalidType"),
        description: t("profile.avatarAllowedTypes"),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError(t("profile.toastFileTooLarge"));
      toast({
        title: t("profile.toastFileTooLarge"),
        description: t("profile.avatarMaxSize"),
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.onerror = () => {
      setAvatarError(t("profile.avatarReadError"));
      toast({
        title: t("profile.avatarReadError"),
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Avatar upload handler (from modal)
  const handleAvatarUpload = async () => {
    if (!selectedFile || !user) return;

    setAvatarUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, selectedFile);

      if (!publicUrl) {
        throw new Error("Failed to upload avatar");
      }

      const updatedProfile = await updateProfile(user.id, { avatar_url: publicUrl });

      if (updatedProfile) {
        // Optimistic update
        setProfile(prev => prev ? { ...prev, avatar_url: updatedProfile.avatar_url } : null);
      }

      toast({ title: t("profile.toastProfilePhotoUpdated") });
      setAvatarModalOpen(false);
      setAvatarPreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: t("profile.toastUploadFailed"), description: t("profile.toastPleaseTryAgain"), variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Name update handler
  const handleNameSave = async () => {
    if (!user || !editedName.trim()) return;

    setIsSaving(true);
    // Optimistic update
    const previousName = profile?.full_name;
    setProfile(prev => prev ? { ...prev, full_name: editedName.trim() } : null);
    setNameModalOpen(false);

    try {
      const updatedProfile = await updateProfile(user.id, { full_name: editedName.trim() });
      if (!updatedProfile) {
        // Revert on failure
        setProfile(prev => prev ? { ...prev, full_name: previousName || null } : null);
        toast({ title: t("profile.toastUpdateFailed"), variant: "destructive" });
      } else {
        toast({ title: t("profile.toastNameUpdated") });
      }
    } catch (error) {
      console.error("Error updating name:", error);
      setProfile(prev => prev ? { ...prev, full_name: previousName || null } : null);
      toast({ title: t("profile.toastUpdateFailed"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // City update handler
  const handleCitySave = async () => {
    if (!user) return;

    setIsSaving(true);
    const previousLocation = {
      country: profile?.country,
      state: profile?.state,
      city: profile?.city,
    };

    // Optimistic update
    setProfile(prev => prev ? {
      ...prev,
      country: locationForm.country,
      state: locationForm.state,
      city: locationForm.city,
    } : null);
    setCityDrawerOpen(false);

    try {
      const updatedProfile = await updateProfile(user.id, {
        country: locationForm.country,
        state: locationForm.state,
        city: locationForm.city,
      });

      if (!updatedProfile) {
        setProfile(prev => prev ? { ...prev, ...previousLocation } : null);
        toast({ title: t("profile.toastUpdateFailed"), variant: "destructive" });
      } else {
        toast({ title: t("profile.toastLocationUpdated") });
      }
    } catch (error) {
      console.error("Error updating location:", error);
      setProfile(prev => prev ? { ...prev, ...previousLocation } : null);
      toast({ title: t("profile.toastUpdateFailed"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Language change handler
  const handleLanguageChange = async (langId: string) => {
    // Change app language
    i18n.changeLanguage(langId);
    setLanguageDrawerOpen(false);
    toast({ title: t("profile.toastLanguageUpdated") });
  };

  // Edit Profile save handler
  const handleEditProfileSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const previousProfile = { ...profile };
    const previousPrefs = { ...preferences };

    // Optimistic update
    setProfile(prev => prev ? { ...prev, full_name: editForm.name } : null);
    setPreferences(prev => prev ? {
      ...prev,
      specialty: editForm.specialty,
      interests: editForm.interests.filter(i => INTERESTS.map(int => int.id).includes(i)),
    } : null);
    setEditProfileModalOpen(false);

    try {
      // Update profile name
      await updateProfile(user.id, { full_name: editForm.name });

      // Update preferences
      await saveOnboardingPreferences(user.id, {
        specialty: editForm.specialty,
        interests: editForm.interests.filter(i => INTERESTS.map(int => int.id).includes(i)),
      });

      toast({ title: t("profile.toastProfileUpdated") });
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfile(previousProfile as Profile);
      setPreferences(previousPrefs as OnboardingPreferences);
      toast({ title: t("profile.toastUpdateFailed"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Interest toggle in edit form
  const toggleInterest = (interestId: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [profileData, prefsData] = await Promise.all([
          getProfile(user.id),
          getOnboardingPreferences(user.id),
        ]);

        if (profileData) {
          setProfile({
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            country: profileData.country || null,
            state: profileData.state || null,
            city: profileData.city || null,
            neighborhood: profileData.neighborhood || null,
            languages: profileData.languages || null,
            license_url: profileData.license_url || null,
          });
        }
        if (prefsData) {
          setPreferences(prefsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <div className="flex flex-col items-center mb-6">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-40 mb-2 rounded" />
            <Skeleton className="h-4 w-24 mb-2 rounded" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-40 rounded-xl mb-4" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || "U";

  const isVerified = !!profile?.license_url;
  const displayName = profile?.full_name || t("profile.addYourName");
  const locationDisplay = [profile?.city, profile?.country].filter(Boolean).join(", ") || t("profile.notSet");
  const currentLang = LANGUAGES.find(l => l.id === i18n.language) || LANGUAGES[0];

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Profile Header - Centered */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Avatar with edit button */}
          <div className="relative mb-4">
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="relative group"
              aria-label={t("profile.changePhoto")}
            >
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Camera className="h-4 w-4" />
            </div>
          </div>

          {/* Name (clickable to edit) */}
          <button
            onClick={() => {
              setEditedName(profile?.full_name || "");
              setNameModalOpen(true);
            }}
            className="group flex items-center gap-2 mb-1"
          >
            <h1 className="font-display text-xl font-bold text-foreground">
              {displayName}
            </h1>
            <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Specialty */}
          {preferences?.specialty && (
            <p className="text-sm text-muted-foreground mb-3">
              {preferences.specialty}
            </p>
          )}

          {/* Verified Badge */}
          {isVerified && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1.5 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("profile.verifiedDoctor")}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="rounded-xl bg-card border border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.meetups}</span>
              <span className="text-xs text-muted-foreground">{t("profile.meetups")}</span>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-card border border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.doctorsMet}</span>
              <span className="text-xs text-muted-foreground">{t("profile.doctorsMet")}</span>
            </CardContent>
          </Card>
        </div>

        {/* Preferences Section */}
        <Card className="rounded-xl bg-card border border-border shadow-sm mb-4">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("profile.preferences")}
              </h2>
            </div>

            {/* City */}
            <button
              onClick={() => setCityDrawerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{t("profile.city")}</p>
                  <p className="text-xs text-muted-foreground">{locationDisplay}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Language */}
            <button
              onClick={() => setLanguageDrawerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{t("profile.language")}</p>
                  <p className="text-xs text-muted-foreground">{currentLang.flag} {currentLang.label}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Email Notifications */}
            <EmailNotificationsToggle />
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="rounded-xl bg-card border border-border shadow-sm mb-4">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("profile.account")}
              </h2>
            </div>

            {/* Edit Profile */}
            <button
              onClick={() => {
                setEditForm({
                  name: profile?.full_name || "",
                  specialty: preferences?.specialty || "",
                  interests: [
                    ...(preferences?.interests || []),
                    ...(preferences?.sports || []),
                    ...(preferences?.other_interests || []),
                  ],
                });
                setEditProfileModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{t("profile.editProfile")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.editProfileDesc")}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Subscription & Payments */}
            <button
              onClick={() => setSubscriptionDrawerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center",
                  subscription.plan === 'premium' ? "bg-amber-100 dark:bg-amber-900/30" :
                  subscription.plan !== 'free' ? "bg-primary/10" : "bg-secondary"
                )}>
                  {subscription.plan === 'premium' ? (
                    <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : subscription.plan !== 'free' ? (
                    <Star className="h-4 w-4 text-primary" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{t("profile.subscription")}</p>
                  <p className="text-xs text-muted-foreground">
                    {subscription.plan === 'free'
                      ? t("profile.freePlan")
                      : subscription.plan === 'trial'
                      ? t("profile.plans.trial.name")
                      : subscription.plan === 'monthly'
                      ? t("profile.plans.monthly.name")
                      : t("profile.plans.premium.name")
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {subscription.plan !== 'free' && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                    {t("profile.active")}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>

            {/* Feedback & Suggestions */}
            <button
              onClick={() => setFeedbackOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("profile.feedbackSuggestions")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Privacy */}
            <button
              onClick={() => window.open("/privacy", "_blank")}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("profile.privacy")}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Terms of Service */}
            <button
              onClick={() => window.open("/terms", "_blank")}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("profile.termsOfService")}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Log Out Button */}
        <Card className="rounded-xl bg-card border border-border shadow-sm">
          <CardContent className="p-0">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">{t("common.signOut")}</span>
            </button>
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile nav */}
        <div className="h-4" />

        {/* ========== MODALS & DRAWERS ========== */}

        {/* Avatar Upload Modal */}
        <Dialog open={avatarModalOpen} onOpenChange={(open) => {
          setAvatarModalOpen(open);
          if (!open) {
            setAvatarPreview(null);
            setSelectedFile(null);
            setAvatarError(null);
          }
        }}>
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>{t("profile.changePhoto")}</DialogTitle>
              <DialogDescription>{t("profile.changePhotoDesc")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {/* Circular Avatar Preview */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {avatarError && (
                <p className="text-sm text-red-500 text-center">{avatarError}</p>
              )}

              {/* File Input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />

              {/* Select Photo Button */}
              <Button
                variant="outline"
                onClick={() => avatarInputRef.current?.click()}
                className="rounded-xl"
              >
                <Camera className="h-4 w-4 mr-2" />
                {selectedFile ? t("profile.changePhoto") : t("profile.selectPhoto")}
              </Button>

              {/* File Type Hint */}
              <p className="text-xs text-muted-foreground text-center">
                {t("profile.avatarHint")}
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setAvatarModalOpen(false);
                setAvatarPreview(null);
                setSelectedFile(null);
                setAvatarError(null);
              }} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleAvatarUpload}
                disabled={!selectedFile || avatarUploading || !!avatarError}
                className="rounded-xl"
              >
                {avatarUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("profile.uploading")}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("common.save")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Name Edit Modal */}
        <Dialog open={nameModalOpen} onOpenChange={setNameModalOpen}>
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>{t("profile.editName")}</DialogTitle>
              <DialogDescription>{t("profile.editNameDesc")}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("profile.fullName")}
              </Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder={t("profile.enterYourName")}
                className="mt-2 rounded-xl"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setNameModalOpen(false)} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleNameSave}
                disabled={!editedName.trim() || isSaving}
                className="rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.save")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* City Picker Drawer */}
        <Drawer open={cityDrawerOpen} onOpenChange={setCityDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader>
                <DrawerTitle>{t("profile.selectCity")}</DrawerTitle>
                <DrawerDescription>{t("profile.selectCityDesc")}</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-4">
                <LocationSelect
                  country={locationForm.country}
                  state={locationForm.state}
                  city={locationForm.city}
                  onCountryChange={(country) => setLocationForm(prev => ({ ...prev, country, state: "", city: "" }))}
                  onStateChange={(state) => setLocationForm(prev => ({ ...prev, state, city: "" }))}
                  onCityChange={(city) => setLocationForm(prev => ({ ...prev, city }))}
                  showNationality={false}
                  variant="profile"
                />
              </div>
              <DrawerFooter>
                <Button onClick={handleCitySave} disabled={isSaving} className="rounded-xl">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("common.save")}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="rounded-xl">{t("common.cancel")}</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Language Picker Drawer */}
        <Drawer open={languageDrawerOpen} onOpenChange={setLanguageDrawerOpen}>
          <DrawerContent className="max-h-[50vh]">
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader>
                <DrawerTitle>{t("profile.selectLanguage")}</DrawerTitle>
                <DrawerDescription>{t("profile.selectLanguageDesc")}</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors",
                      i18n.language === lang.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-secondary hover:bg-secondary/80 border-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium text-foreground">{lang.label}</span>
                    </div>
                    {i18n.language === lang.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Edit Profile Full-Screen Modal */}
        <Dialog open={editProfileModalOpen} onOpenChange={setEditProfileModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("profile.editProfile")}
              </DialogTitle>
              <DialogDescription>{t("profile.editProfileModalDesc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="editName" className="text-sm font-medium">
                  {t("profile.fullName")}
                </Label>
                <Input
                  id="editName"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t("profile.enterYourName")}
                  className="rounded-xl"
                />
              </div>

              {/* Specialty */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("profile.specialty")}</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, specialty: spec.id }))}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                        editForm.specialty === spec.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-foreground"
                      )}
                    >
                      <span>{spec.icon}</span>
                      <span className="truncate">{spec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("profile.interests")}</Label>
                <p className="text-xs text-muted-foreground">{t("profile.selectInterests")}</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                        editForm.interests.includes(interest.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-foreground"
                      )}
                    >
                      <span>{interest.icon}</span>
                      <span>{interest.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditProfileModalOpen(false)} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleEditProfileSave}
                disabled={isSaving || !editForm.name.trim()}
                className="rounded-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Drawer */}
        <Drawer open={subscriptionDrawerOpen} onOpenChange={setSubscriptionDrawerOpen}>
          <DrawerContent className="max-h-[90vh]">
            <div className="mx-auto w-full max-w-lg overflow-y-auto">
              <DrawerHeader className="text-center">
                <DrawerTitle className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  {t("profile.subscriptionPayments")}
                </DrawerTitle>
                <DrawerDescription>{t("profile.choosePlan")}</DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-6 space-y-4">
                {/* If user has active subscription - show current plan info */}
                {subscription.status === 'active' && subscription.plan !== 'free' && (
                  <Card className="rounded-xl border-2 border-primary bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground">
                            {t("profile.currentPlan")}
                          </Badge>
                          <span className="font-bold text-foreground">
                            {SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS]?.name || 'Free'}
                          </span>
                        </div>
                        {subscription.plan !== 'trial' && (
                          <span className="text-lg font-bold text-primary">
                            €{SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS]?.price}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </span>
                        )}
                      </div>

                      {subscription.nextBillingDate && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {t("profile.nextBilling")}: <span className="font-medium">{subscription.nextBillingDate}</span>
                        </p>
                      )}

                      {subscription.cancelAtPeriodEnd && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                          {t("profile.canceledAtPeriodEnd")}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl"
                          onClick={() => {
                            // TODO: Redirect to Stripe Customer Portal
                            toast({ title: t("profile.stripePortalComingSoon") });
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t("profile.manageInStripe")}
                        </Button>
                        {!subscription.cancelAtPeriodEnd && subscription.plan !== 'trial' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
                            onClick={() => {
                              // TODO: Cancel subscription
                              toast({ title: t("profile.cancelConfirm"), variant: "destructive" });
                            }}
                          >
                            {t("profile.cancelSubscription")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Plans Grid */}
                <div className="space-y-3">
                  {/* Trial Plan - Show only if trial not used and user is on free plan */}
                  {!subscription.trialUsed && subscription.plan === 'free' && (
                    <Card className="rounded-xl border-2 border-border hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="h-4 w-4 text-amber-500" />
                              <h3 className="font-bold text-foreground">{t("profile.plans.trial.name")}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">{t("profile.plans.trial.desc")}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-foreground">€9.99</span>
                            <p className="text-xs text-muted-foreground">{t("profile.oneTime")}</p>
                          </div>
                        </div>

                        <ul className="space-y-1.5 mb-4">
                          {['weeklyMatches', 'groupChat', 'roundsBot', 'basicMatching'].map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                              {t(`profile.plans.trial.features.${feature}`)}
                            </li>
                          ))}
                        </ul>

                        <Button
                          className="w-full rounded-xl"
                          variant="outline"
                          onClick={() => {
                            // TODO: Start trial checkout
                            toast({ title: t("profile.startingCheckout") });
                          }}
                        >
                          {t("profile.plans.trial.cta")}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Monthly Plan - Most Popular */}
                  <Card className={cn(
                    "rounded-xl border-2 transition-all relative overflow-hidden",
                    subscription.plan === 'monthly'
                      ? "border-primary bg-primary/5"
                      : "border-primary/50 hover:border-primary"
                  )}>
                    {/* Popular Badge */}
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
                        {t("profile.mostPopular")}
                      </div>
                    </div>

                    <CardContent className="p-4 pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-foreground">{t("profile.plans.monthly.name")}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{t("profile.plans.monthly.desc")}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-primary">€14.99</span>
                          <p className="text-xs text-muted-foreground">/{t("profile.perMonth")}</p>
                        </div>
                      </div>

                      <ul className="space-y-1.5 mb-4">
                        {['everythingTrial', 'priorityMatching', 'expandedProfile', 'earlyAccess', 'prioritySupport'].map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            {t(`profile.plans.monthly.features.${feature}`)}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full rounded-xl"
                        disabled={subscription.plan === 'monthly' || subscription.plan === 'premium'}
                        onClick={() => {
                          // TODO: Start monthly checkout
                          toast({ title: t("profile.startingCheckout") });
                        }}
                      >
                        {subscription.plan === 'monthly' ? t("profile.currentPlan") : t("profile.plans.monthly.cta")}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Premium Plan */}
                  <Card className={cn(
                    "rounded-xl border-2 transition-all",
                    subscription.plan === 'premium'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <h3 className="font-bold text-foreground">{t("profile.plans.premium.name")}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{t("profile.plans.premium.desc")}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-foreground">€29.99</span>
                          <p className="text-xs text-muted-foreground">/{t("profile.perMonth")}</p>
                        </div>
                      </div>

                      <ul className="space-y-1.5 mb-4">
                        {['everythingMonthly', 'advancedCompatibility', 'aiSuggestions', 'advancedFilters', 'smallerGroups', 'exclusiveEvents'].map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            {t(`profile.plans.premium.features.${feature}`)}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90"
                        disabled={subscription.plan === 'premium'}
                        onClick={() => {
                          // TODO: Start premium checkout
                          toast({ title: t("profile.startingCheckout") });
                        }}
                      >
                        {subscription.plan === 'premium' ? t("profile.currentPlan") : t("profile.plans.premium.cta")}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Money-back guarantee note */}
                <p className="text-center text-xs text-muted-foreground pt-2">
                  {t("profile.moneyBackGuarantee")}
                </p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Smart Feedback Drawer */}
        <SmartFeedback
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          context="profile_suggestion"
        />
      </main>
    </DashboardLayout>
  );
};

export default Profile;
