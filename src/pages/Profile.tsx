import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LocationSelect } from "@/components/LocationSelect";
import { getProfile, updateProfile } from "@/services/profileService";
import { getOnboardingPreferences, markOnboardingComplete } from "@/services/onboardingService";
import { uploadAvatar, uploadLicense } from "@/services/storageService";
import { 
  Camera, 
  Save,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Heart,
  Users,
  MapPin,
  Calendar,
  Dumbbell,
  FileText,
  Upload,
  Check
} from "lucide-react";

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

interface OnboardingPreferences {
  specialty: string | null;
  career_stage: string | null;
  interests: string[] | null;
  friendship_type: string[] | null;
  meeting_frequency: string | null;
  completed_at: string | null;
  goals: string[] | null;
  sports: string[] | null;
  social_style: string[] | null;
  culture_interests: string[] | null;
  lifestyle: string[] | null;
  availability_slots: string[] | null;
  open_to_business: boolean | null;
}

const Profile = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useLocalizedNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  
  // File upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("profile.toastFileTooLarge"), description: t("profile.toastMax5MB"), variant: "destructive" });
      return;
    }
    
    setAvatarUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      
      if (!publicUrl) {
        throw new Error("Failed to upload avatar");
      }
      
      const updatedProfile = await updateProfile(user.id, { avatar_url: publicUrl });
      
      if (updatedProfile) {
        setProfile({
          full_name: updatedProfile.full_name,
          avatar_url: updatedProfile.avatar_url,
          city: updatedProfile.city || null,
          neighborhood: updatedProfile.neighborhood || null,
          languages: updatedProfile.languages || null,
          license_url: updatedProfile.license_url || null,
        });
      }
      
      toast({ title: t("profile.toastProfilePhotoUpdated") });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: t("profile.toastUploadFailed"), description: t("profile.toastPleaseTryAgain"), variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLicenseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("profile.toastFileTooLarge"), description: t("profile.toastMax10MB"), variant: "destructive" });
      return;
    }
    
    setLicenseUploading(true);
    try {
      const filePath = await uploadLicense(user.id, file);
      
      if (!filePath) {
        throw new Error("Failed to upload license");
      }
      
      const updatedProfile = await updateProfile(user.id, { license_url: filePath });
      
      if (updatedProfile) {
        setProfile({
          full_name: updatedProfile.full_name,
          avatar_url: updatedProfile.avatar_url,
          city: updatedProfile.city || null,
          neighborhood: updatedProfile.neighborhood || null,
          languages: updatedProfile.languages || null,
          license_url: updatedProfile.license_url || null,
        });
      }
      
      // Check if profile is now complete and mark it
      const isNowComplete = updatedProfile?.full_name && updatedProfile?.city && filePath;
      
      if (isNowComplete) {
        const existingPrefs = await getOnboardingPreferences(user.id);
        if (!existingPrefs?.completed_at) {
          await markOnboardingComplete(user.id);
          
          // Refresh preferences
          const prefsData = await getOnboardingPreferences(user.id);
          if (prefsData) {
            setPreferences(prefsData);
          }
        }
      }
      
      toast({ 
        title: t("profile.toastLicenseUpdated"),
        description: isNowComplete
          ? t("profile.toastProfileCompleteRefresh")
          : t("profile.toastFillCityAndSave")
      });
    } catch (error) {
      console.error("Error uploading license:", error);
      toast({ title: t("profile.toastUploadFailed"), description: t("profile.toastPleaseTryAgain"), variant: "destructive" });
    } finally {
      setLicenseUploading(false);
    }
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
          setFullName(profileData.full_name || "");
          setCountry(profileData.country || "");
          setState(profileData.state || "");
          setCity(profileData.city || "");
          setNeighborhood(profileData.neighborhood || "");
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

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update profile using service
      const updatedProfile = await updateProfile(user.id, {
        full_name: fullName,
        country: country || null,
        state: state || null,
        city: city || null,
        neighborhood: neighborhood || null,
      });

      if (!updatedProfile) {
        throw new Error("Failed to update profile");
      }

      // Update local state
      setProfile({
        full_name: updatedProfile.full_name,
        avatar_url: updatedProfile.avatar_url,
        city: updatedProfile.city || null,
        neighborhood: updatedProfile.neighborhood || null,
        languages: updatedProfile.languages || null,
        license_url: updatedProfile.license_url || null,
      });
      setFullName(updatedProfile.full_name || "");
      setCity(updatedProfile.city || "");
      setNeighborhood(updatedProfile.neighborhood || "");

      // Check if profile is complete (has name, city, and license)
      const isComplete = fullName && city && profile?.license_url;
      
      if (isComplete) {
        // Mark onboarding as complete if not already
        const existingPrefs = await getOnboardingPreferences(user.id);
        if (!existingPrefs?.completed_at) {
          const success = await markOnboardingComplete(user.id);
          if (success) {
            // Refresh preferences
            const prefsData = await getOnboardingPreferences(user.id);
            if (prefsData) {
              setPreferences(prefsData);
            }
          }
        }
      }
      
      toast({
        title: t("profile.toastProfileUpdated"),
        description: isComplete 
          ? t("profile.toastProfileCompleteNextRound")
          : t("profile.toastChangesSavedFillCity"),
      });
      
      // If profile is complete, refresh preferences to update UI
      if (isComplete) {
        const { data: prefsData } = await supabase
          .from("onboarding_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (prefsData) {
          setPreferences(prefsData as any);
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("profile.toastFailedToUpdateProfile"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatSlot = (slot: string) => {
    const slotMap: Record<string, string> = {
      fri_evening: "Fri Eve",
      sat_morning: "Sat AM",
      sat_afternoon: "Sat PM",
      sat_evening: "Sat Eve",
      sun_morning: "Sun AM",
      sun_afternoon: "Sun PM",
      sun_evening: "Sun Eve",
    };
    return slotMap[slot] || slot;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Skeleton className="h-10 sm:h-12 w-40 sm:w-48 mb-6 sm:mb-8 rounded-xl" />
          <Skeleton className="h-80 sm:h-96 rounded-2xl sm:rounded-3xl" />
        </div>
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 animate-fade-up">
          <div className="flex items-center gap-2 min-w-0">
            <LocalizedLink to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("common.dashboard")}
            </LocalizedLink>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-primary">{t("dashboard.profile")}</span>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden animate-fade-up">
            <div className="h-24 bg-gradient-gold relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
            </div>
            <CardContent className="-mt-12 relative pb-6 px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-gold text-primary-foreground text-3xl font-display font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {avatarUploading ? (
                      <div className="h-6 w-6 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-background" />
                    )}
                  </button>
                </div>
                <div className="flex-1 pt-4 sm:pt-0">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {profile?.full_name || t("profile.addYourName")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {profile?.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {[profile.country, profile.state, profile.city, profile.neighborhood].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical License Section */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-75">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-display">{t("profile.medicalLicense")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <input
                ref={licenseInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleLicenseChange}
                className="hidden"
              />
              {profile?.license_url ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("profile.licenseUploaded")}</p>
                      <p className="text-xs text-muted-foreground">{t("profile.clickToUpdate")}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => licenseInputRef.current?.click()}
                    disabled={licenseUploading}
                    className="rounded-lg"
                  >
                    {licenseUploading ? t("profile.uploading") : t("profile.update")}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => licenseInputRef.current?.click()}
                  disabled={licenseUploading}
                  className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-secondary/30 transition-colors text-center"
                >
                  {licenseUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">{t("profile.uploading")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{t("profile.uploadMedicalLicense")}</p>
                      <p className="text-xs text-muted-foreground">{t("profile.licenseFileHint")}</p>
                    </div>
                  )}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-100">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-display">{t("profile.basicInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("profile.fullNamePlaceholder")}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("profile.location")}</p>
                  <p className="text-xs text-muted-foreground">{t("profile.locationHint")}</p>
                </div>
                <LocationSelect
                  country={country}
                  state={state}
                  city={city}
                  neighborhood={neighborhood}
                  onCountryChange={setCountry}
                  onStateChange={setState}
                  onCityChange={setCity}
                  onNeighborhoodChange={setNeighborhood}
                  showNationality={false}
                  className="w-full"
                  variant="profile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="rounded-xl h-12 bg-secondary/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-200">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display">{t("profile.professionalDetails")}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg"
                  onClick={() => navigate("/onboarding")}
                >
                  {t("profile.editPreferences")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              {preferences?.specialty ? (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("profile.specialty")}</p>
                      <p className="text-sm font-medium text-foreground">{preferences.specialty}</p>
                    </div>
                  </div>
                  
                  {preferences.career_stage && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("profile.careerStage")}</p>
                        <p className="text-sm font-medium text-foreground">{preferences.career_stage}</p>
                      </div>
                    </div>
                  )}
                  
                  {preferences.meeting_frequency && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("profile.meetingPreference")}</p>
                        <p className="text-sm font-medium text-foreground">{preferences.meeting_frequency}</p>
                      </div>
                    </div>
                  )}

                  {preferences.open_to_business && (
                    <Badge className="bg-primary/10 text-primary border-0">
                      {t("profile.openToBusiness")}
                    </Badge>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {t("profile.completeOnboardingHint")}
                  </p>
                  <Button 
                    onClick={() => navigate("/onboarding")}
                  >
                    {t("profile.completeOnboarding")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sports & Activities */}
          {preferences?.sports && preferences.sports.length > 0 && (
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-250">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-display">{t("profile.sportsAndFitness")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                  {preferences.sports.map((sport) => (
                    <Badge 
                      key={sport} 
                      variant="secondary" 
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {sport}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          {preferences?.availability_slots && preferences.availability_slots.length > 0 && (
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-300">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-display">{t("profile.weekendAvailability")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                  {preferences.availability_slots.map((slot) => (
                    <Badge 
                      key={slot} 
                      variant="outline" 
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {formatSlot(slot)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interests & Goals */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-350">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg font-display">{t("profile.interestsAndGoals")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {(preferences?.social_style?.length || preferences?.culture_interests?.length || preferences?.lifestyle?.length || preferences?.goals?.length) ? (
                <div className="space-y-4">
                  {preferences?.social_style && preferences.social_style.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">{t("profile.socialStyle")}</p>
                      <div className="flex flex-wrap gap-2">
                        {preferences.social_style.map((style) => (
                          <Badge 
                            key={style} 
                            variant="secondary" 
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                          >
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferences?.culture_interests && preferences.culture_interests.length > 0 && (
                    <div className="pt-4 border-t border-border/40">
                      <p className="text-sm font-medium text-muted-foreground mb-3">{t("profile.culture")}</p>
                      <div className="flex flex-wrap gap-2">
                        {preferences.culture_interests.map((interest) => (
                          <Badge 
                            key={interest} 
                            variant="secondary" 
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferences?.lifestyle && preferences.lifestyle.length > 0 && (
                    <div className="pt-4 border-t border-border/40">
                      <p className="text-sm font-medium text-muted-foreground mb-3">{t("profile.lifestyle")}</p>
                      <div className="flex flex-wrap gap-2">
                        {preferences.lifestyle.map((item) => (
                          <Badge 
                            key={item} 
                            variant="secondary" 
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {preferences?.goals && preferences.goals.length > 0 && (
                    <div className="pt-4 border-t border-border/40">
                      <p className="text-sm font-medium text-muted-foreground mb-3">{t("profile.lookingFor")}</p>
                      <div className="flex flex-wrap gap-2">
                        {preferences.goals.map((goal) => (
                          <Badge 
                            key={goal} 
                            variant="outline" 
                            className="px-3 py-1.5 rounded-full text-xs font-medium border-primary/30 text-primary"
                          >
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("profile.addInterestsThroughOnboarding")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Profile;