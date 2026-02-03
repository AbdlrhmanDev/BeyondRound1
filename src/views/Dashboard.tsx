'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import MatchCountdown from "@/components/MatchCountdown";
import { getProfile, getPublicProfile, updateProfile } from "@/services/profileService";
import { getOnboardingPreferences, saveOnboardingPreferences, markOnboardingComplete, getPublicPreferences } from "@/services/onboardingService";
import { getGroupMembers, getUserGroupMemberships, getGroupsByIds } from "@/services/matchService";
import { getGroupConversationsByGroupIds } from "@/services/conversationService";
import { 
  Users, 
  Heart, 
  Calendar,
  Stethoscope, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  Camera,
  Music,
  Film,
  Activity,
  Star,
  Hourglass,
  Clock,
  CheckCircle2,
  MapPin
} from "lucide-react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface OnboardingPreferences {
  specialty: string | null;
  career_stage: string | null;
  interests: string[] | null;
  other_interests: string[] | null;
  sports: string[] | null;
  music_preferences: string[] | null;
  movie_preferences: string[] | null;
  friendship_type: string[] | null;
  meeting_frequency: string | null;
  completed_at: string | null;
}

interface GroupMember {
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
  };
  preferences?: {
    specialty: string | null;
  };
}

interface MatchGroup {
  id: string;
  name: string | null;
  match_week: string;
  created_at: string;
  members: GroupMember[];
  allMembers?: GroupMember[]; // All members for city detection
  conversation_id?: string;
  member_count: number;
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useLocalizedNavigate();
  const locale = i18n.language === "de" ? "de-DE" : "en-US";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [groupsCount, setGroupsCount] = useState(0);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const formatGroupName = useCallback((group: MatchGroup): string => {
    const allMembers = group.allMembers || group.members;
    const cities = Array.from(new Set(allMembers.map(m => m.profile.city).filter(Boolean)));
    const city = cities[0] || t("dashboard.unknown");
    
    let dateStr = "";
    if (group.match_week) {
      try {
        const matchDate = new Date(group.match_week);
        dateStr = matchDate.toLocaleDateString(locale, { month: "short", day: "numeric" });
      } catch (e) {
        dateStr = t("dashboard.unknown");
      }
    } else {
      dateStr = t("dashboard.unknown");
    }
    
    return `${dateStr} - ${city}`;
  }, [t, locale]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    const fetchData = async () => {
      try {
        // Check for pending onboarding data in localStorage
        const pendingDataStr = localStorage.getItem('pending_onboarding_data');
        if (pendingDataStr) {
          try {
            const pendingData = JSON.parse(pendingDataStr);
            const { personalInfo, answers } = pendingData;
            
            // Save pending onboarding data
            const { logInfo, logError } = await import('@/utils/logger');
            logInfo('Found pending onboarding data, saving now...', 'Dashboard');
            
            // Update profile using service
            const profileUpdate = await updateProfile(userId, {
              full_name: personalInfo?.name || null,
              country: personalInfo?.country || null,
              state: personalInfo?.state || null,
              city: personalInfo?.city || null,
              neighborhood: personalInfo?.neighborhood || null,
              gender: personalInfo?.gender || null,
              birth_year: personalInfo?.birthYear ? parseInt(personalInfo.birthYear) : null,
              gender_preference: personalInfo?.genderPreference || null,
              nationality: personalInfo?.nationality || null,
            });

            if (!profileUpdate) {
              logError('Profile update error', 'Dashboard');
              // Skip preferences save if profile failed - user may not exist in auth yet
            } else {
            // Save preferences using service (only if profile exists)
            const prefsSuccess = await saveOnboardingPreferences(userId, {
              specialty: answers?.specialty?.[0] || null,
              specialty_preference: answers?.specialty_preference?.[0] || null,
              group_language_preference: answers?.group_language_preference?.[0] || null,
              career_stage: answers?.stage?.[0] || null,
              sports: answers?.sports || [],
              activity_level: answers?.activity_level?.[0] || null,
              music_preferences: answers?.music_preferences || [],
              movie_preferences: answers?.movie_preferences || [],
              other_interests: answers?.other_interests || [],
              meeting_activities: answers?.meeting_activities || [],
              social_energy: answers?.social_energy?.[0] || null,
              conversation_style: answers?.conversation_style?.[0] || null,
              availability_slots: answers?.availability || [],
              meeting_frequency: answers?.meeting_frequency?.[0] || null,
              goals: answers?.goals || [],
              dietary_preferences: answers?.dietary_preferences || [],
              life_stage: answers?.life_stage?.[0] || null,
              ideal_weekend: answers?.ideal_weekend || [],
              open_to_business: answers?.goals?.includes("business") || false,
              completed_at: new Date().toISOString(),
            });

            if (!prefsSuccess) {
              logError('Preferences save error', 'Dashboard');
              toast({
                title: t("dashboard.toastPendingSaveFailed"),
                description: t("dashboard.toastPendingSaveFailedDesc"),
                variant: "destructive",
              });
            } else {
              logInfo('Pending onboarding data saved successfully', 'Dashboard');
              // Remove from localStorage after successful save
              localStorage.removeItem('pending_onboarding_data');
              
              // Refresh data using services
              const [profileData, prefsData] = await Promise.all([
                getProfile(userId),
                getOnboardingPreferences(userId),
              ]);

              if (profileData) setProfile(profileData);
              if (prefsData) setPreferences(prefsData);
              
              toast({
                title: t("dashboard.toastProfileDataSaved"),
                description: t("dashboard.toastProfileDataSavedDesc"),
              });
            }
            }
          } catch (parseError) {
            const { logError } = await import('@/utils/logger');
            logError('Error parsing pending onboarding data', 'Dashboard', parseError);
            localStorage.removeItem('pending_onboarding_data');
          }
        }

        // Fetch profile and preferences using services
        const [profileData, prefsData, memberData] = await Promise.all([
          getProfile(userId),
          getOnboardingPreferences(userId),
          getUserGroupMemberships(userId),
        ]);

        if (profileData) setProfile(profileData);
        if (prefsData) setPreferences(prefsData);
        
        // Fetch groups if user is a member
        if (memberData && memberData.length > 0) {
          setGroupsCount(memberData.length);
          const groupIds = memberData.map((m) => m.group_id);

          // Get group info for the most recent active group using service
          const groupsData = await getGroupsByIds(groupIds, 1);

          if (groupsData && groupsData.length > 0) {
            const allGroupIds = groupsData.map(g => g.id);
            
            // Fetch all data in parallel using services
            const [allMembersData, allConversationsData] = await Promise.all([
              Promise.all(allGroupIds.map(id => getGroupMembers(id))).then(results => 
                results.flatMap((members, index) => 
                  members.map(m => ({ group_id: allGroupIds[index], user_id: m.user_id }))
                )
              ),
              getGroupConversationsByGroupIds(allGroupIds),
            ]);

            // Get all unique member user IDs
            const allMemberUserIds = Array.from(new Set(
              allMembersData.map(m => m.user_id).filter(id => id !== userId)
            ));

            // Fetch all profiles and preferences using service
            const [allProfilesPromises, allPrefsPromises] = await Promise.all([
              Promise.all(allMemberUserIds.map(id => getPublicProfile(id))),
              Promise.all(allMemberUserIds.map(id => getPublicPreferences(id))),
            ]);
            
            const profilesMap = new Map(
              allProfilesPromises
                .filter((p): p is NonNullable<typeof p> => p !== null)
                .map(p => [p.user_id, p])
            );
            
            const prefsMap = new Map(
              allPrefsPromises
                .filter((p): p is NonNullable<typeof p> => p !== null)
                .map(p => [p.user_id, p])
            );
            
            const allProfilesData = allMemberUserIds.map(userId => {
              const profile = profilesMap.get(userId);
              const prefs = prefsMap.get(userId);
              return {
                user_id: userId,
                full_name: profile?.full_name || null,
                avatar_url: profile?.avatar_url || null,
                city: profile?.city || null,
                specialty: prefs?.specialty || null,
              };
            });

            // Create lookup maps
            const membersByGroup = new Map<string, string[]>();
            allMembersData.forEach(m => {
              if (!membersByGroup.has(m.group_id)) {
                membersByGroup.set(m.group_id, []);
              }
              membersByGroup.get(m.group_id)!.push(m.user_id);
            });

            const conversationsMap = new Map(
              allConversationsData.map(c => [c.group_id, c.id])
            );

            const profilesMapForGroups = new Map(
              allProfilesData.map(p => [p.user_id, p])
            );

            // Build enriched groups synchronously (no async needed)
            const enrichedGroups: MatchGroup[] = groupsData.map((group) => {
              const memberUserIds = membersByGroup.get(group.id) || [];
              const otherMemberIds = memberUserIds.filter((id) => id !== userId);
              const displayMemberIds = otherMemberIds.slice(0, 4);

              const completeProfiles = otherMemberIds.map(memberId => {
                const profileData = profilesMapForGroups.get(memberId);
                return {
                  user_id: memberId,
                  profile: {
                    full_name: profileData?.full_name || null,
                    avatar_url: profileData?.avatar_url || null,
                    city: profileData?.city || null,
                  },
                  preferences: {
                    specialty: profileData?.specialty || null,
                  },
                };
              });

              const members = completeProfiles.filter(m => displayMemberIds.includes(m.user_id));

              return {
                id: group.id,
                name: group.name,
                match_week: group.match_week,
                created_at: group.created_at,
                members,
                allMembers: completeProfiles,
                conversation_id: conversationsMap.get(group.id),
                member_count: memberUserIds.length,
              };
            });

            setGroups(enrichedGroups);
          }
        }
      } catch (error) {
        const { handleError } = await import('@/utils/errorHandler');
        const errorMessage = handleError(error, 'Dashboard');
        toast({
          title: t("dashboard.toastErrorLoadingData"),
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchData();
    // Only refetch when user id changes; toast/navigate are stable enough for use inside effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Memoize displayed group to prevent unnecessary re-renders
  const displayedGroup = useMemo(() => groups[0], [groups]);

  // Calculate all interests (must be before useMemo hooks)
  const allInterests = useMemo(() => [
    ...(preferences?.other_interests || []),
    ...(preferences?.sports || []),
    ...(preferences?.music_preferences || []),
    ...(preferences?.movie_preferences || []),
    ...(preferences?.interests || []),
  ].filter(Boolean), [preferences]);

  // Calculate profile completion percentage (must be before early return)
  const calculateProfileCompletion = useMemo(() => {
    let completedFields = 0;
    const totalFields = 7; // name, specialty, career_stage, city, interests (min 3), avatar, completed_at
    
    if (profile?.full_name) completedFields++;
    if (preferences?.specialty) completedFields++;
    if (preferences?.career_stage) completedFields++;
    if (profile?.avatar_url) completedFields++;
    if (allInterests.length >= 3) completedFields++;
    if (preferences?.completed_at) completedFields += 2; // Bonus for completion
    
    return Math.min(Math.round((completedFields / totalFields) * 100), 100);
  }, [profile, preferences, allInterests.length]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-between items-center mb-8 sm:mb-12">
            <Skeleton className="h-10 sm:h-12 w-40 sm:w-56 rounded-xl sm:rounded-2xl" />
            <div className="flex gap-2 sm:gap-3">
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
            <Skeleton className="h-64 sm:h-80 rounded-2xl sm:rounded-3xl lg:col-span-4" />
            <Skeleton className="h-64 sm:h-80 rounded-2xl sm:rounded-3xl lg:col-span-8" />
          </div>
        </div>
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  const firstName = profile?.full_name?.split(" ")[0] || "Doctor";

  // Combine all interests with their categories
  const getInterestCategory = (interest: string): { category: string; icon: any; color: string } => {
    const sports = preferences?.sports || [];
    const music = preferences?.music_preferences || [];
    const movies = preferences?.movie_preferences || [];
    
    if (sports.includes(interest)) {
      return { category: 'sports', icon: Activity, color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
    }
    if (music.includes(interest)) {
      return { category: 'music', icon: Music, color: 'bg-purple-500/10 text-purple-600 border-purple-200' };
    }
    if (movies.includes(interest)) {
      return { category: 'movies', icon: Film, color: 'bg-pink-500/10 text-pink-600 border-pink-200' };
    }
    return { category: 'other', icon: Star, color: 'bg-primary/10 text-primary border-primary/20' };
  };

  // Manual save function for pending onboarding data
  const handleManualSave = async () => {
    if (!user) return;
    
    const pendingDataStr = localStorage.getItem('pending_onboarding_data');
    if (!pendingDataStr) {
      toast({
        title: t("dashboard.toastNoPendingData"),
        description: t("dashboard.toastNoPendingDataDesc"),
        variant: "default",
      });
      return;
    }

    try {
      const pendingData = JSON.parse(pendingDataStr);
      const { personalInfo, answers } = pendingData;
      
      toast({
        title: t("dashboard.toastSavingData"),
        description: t("dashboard.toastSavingDataDesc"),
      });

      // Update profile using service
      const profileUpdate = await updateProfile(user.id, {
        full_name: personalInfo?.name || null,
        city: personalInfo?.city || null,
        neighborhood: personalInfo?.neighborhood || null,
        gender: personalInfo?.gender || null,
        birth_year: personalInfo?.birthYear ? parseInt(personalInfo.birthYear) : null,
        gender_preference: personalInfo?.genderPreference || null,
        nationality: personalInfo?.nationality || null,
      });

      if (!profileUpdate) {
        console.error('Profile update error');
        toast({
          title: t("dashboard.toastProfileUpdateFailed"),
          description: t("dashboard.toastProfileUpdateFailedDesc"),
          variant: "destructive",
        });
        return;
      }

      // Save preferences using service
      const prefsSuccess = await saveOnboardingPreferences(user.id, {
        specialty: answers?.specialty?.[0] || null,
        specialty_preference: answers?.specialty_preference?.[0] || null,
        group_language_preference: answers?.group_language_preference?.[0] || null,
        career_stage: answers?.stage?.[0] || null,
        sports: answers?.sports || [],
        activity_level: answers?.activity_level?.[0] || null,
        music_preferences: answers?.music_preferences || [],
        movie_preferences: answers?.movie_preferences || [],
        other_interests: answers?.other_interests || [],
        meeting_activities: answers?.meeting_activities || [],
        social_energy: answers?.social_energy?.[0] || null,
        conversation_style: answers?.conversation_style?.[0] || null,
        availability_slots: answers?.availability || [],
        meeting_frequency: answers?.meeting_frequency?.[0] || null,
        goals: answers?.goals || [],
        dietary_preferences: answers?.dietary_preferences || [],
        life_stage: answers?.life_stage?.[0] || null,
        ideal_weekend: answers?.ideal_weekend || [],
        open_to_business: answers?.goals?.includes("business") || false,
        completed_at: new Date().toISOString(),
      });

      if (!prefsSuccess) {
        const { logError } = await import('@/utils/logger');
        logError('Preferences save error', 'Dashboard');
        toast({
          title: t("dashboard.toastPreferencesFailed"),
          description: t("dashboard.toastPreferencesFailedDesc"),
          variant: "destructive",
        });
        return;
      }

      // Success - clear localStorage and reload data
      localStorage.removeItem('pending_onboarding_data');
      
      // Refresh data immediately
      // Refresh data using services
      const [profileData, prefsData] = await Promise.all([
        getProfile(user.id),
        getOnboardingPreferences(user.id),
      ]);

      if (profileData) setProfile(profileData);
      if (prefsData) setPreferences(prefsData);
      
      toast({
        title: t("dashboard.toastDataSaved"),
        description: t("dashboard.toastDataSavedDesc"),
      });
    } catch (error: any) {
      console.error('Manual save error:', error);
      toast({
        title: t("dashboard.toastErrorSaving"),
        description: error.message || t("dashboard.toastErrorSavingDesc"),
        variant: "destructive",
      });
    }
  };

  // Check if there's pending data or incomplete profile
  const hasPendingData = localStorage.getItem('pending_onboarding_data') !== null;
  const isProfileIncomplete = !preferences?.completed_at;

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">{t("common.dashboard")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("dashboard.overview")}</span>
          </div>
          <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-3">
                {t("dashboard.hey", { name: firstName })} <span className="inline-block animate-float">👋</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                {t("dashboard.readyToConnect")}
              </p>
            </div>
            {hasPendingData && (
              <Button
                onClick={handleManualSave}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto"
              >
                💾 {t("dashboard.savePendingData")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Profile (first on mobile so incomplete users see it immediately) */}
          <div className="lg:col-span-4 space-y-5 order-1">
            {/* Profile Card */}
            <Card 
              className="overflow-hidden border-0 rounded-3xl animate-fade-up cursor-pointer transition-all duration-300 bg-card
                shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.05)]
                hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.08)]
                hover:-translate-y-0.5"
              onClick={() => navigate("/profile")}
            >
              <div className="h-24 bg-primary relative overflow-hidden">
              </div>
              <CardContent className="-mt-12 relative pb-6 px-6">
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl bg-secondary">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-2xl font-display font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!profile?.avatar_url && (
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary border-4 border-background flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors group"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/profile");
                      }}
                      title={t("dashboard.addProfilePhoto")}>
                      <Camera className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {profile?.full_name || t("dashboard.completeProfile")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5">{user?.email}</p>
                </div>

                {/* Profile Completion Progress */}
                {!preferences?.completed_at && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{t("dashboard.profilePercentComplete", { percent: calculateProfileCompletion })}</span>
                      <span className="text-muted-foreground">{calculateProfileCompletion}%</span>
                    </div>
                    <Progress value={calculateProfileCompletion} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.finishProfile")}
                    </p>
                  </div>
                )}

                {/* Success State */}
                {preferences?.completed_at && (
                  <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{t("dashboard.readyForNextRound")} 🎉</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("dashboard.profileCompleteReady")}
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {preferences?.specialty && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">{t("dashboard.specialty")}</p>
                        <p className="text-sm font-semibold text-foreground truncate">{preferences.specialty}</p>
                      </div>
                    </div>
                  )}
                  {preferences?.career_stage && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">{t("dashboard.careerStage")}</p>
                        <p className="text-sm font-semibold text-foreground truncate">{preferences.career_stage}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!preferences?.completed_at && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/onboarding");
                    }} 
                    className="w-full mt-6 bg-primary hover:opacity-90 rounded-xl h-11 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    {t("dashboard.completeProfile")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-8 space-y-5 order-2">
            {/* Next Group Matching - Supporting Display */}
            <div className="animate-fade-up delay-100">
              <MatchCountdown />
            </div>

            {/* Matches Section */}
            <Card className="border-0 rounded-3xl overflow-hidden animate-fade-up delay-200 bg-card transition-all duration-300
              shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.05)]
              hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.08)]
              hover:-translate-y-0.5">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display font-semibold">{t("dashboard.yourMatches")}</CardTitle>
                      <p className="text-sm text-muted-foreground">{t("dashboard.physiciansShareInterests")}</p>
                    </div>
                  </div>
                  {groups.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/matches")}
                      className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      {t("dashboard.viewAll")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {displayedGroup ? (
                  <div className="space-y-4">
                    {(() => {
                      const group = displayedGroup;
                      const groupDate = group.match_week 
                        ? new Date(group.match_week).toLocaleDateString(locale, {
                            month: "short",
                            day: "numeric",
                          })
                        : new Date(group.created_at).toLocaleDateString(locale, {
                            month: "short",
                            day: "numeric",
                          });
                      
                      // Get shared specialties for match reason
                      const specialties = group.members
                        .map(m => m.preferences?.specialty)
                        .filter(Boolean) as string[];
                      const uniqueSpecialties = Array.from(new Set(specialties));
                      const sharedInterests = allInterests.slice(0, 3);
                      
                      return (
                        <div key={group.id} className="space-y-4">
                          {/* Group Header */}
                          <div
                            className="flex items-start gap-4 p-4 rounded-xl cursor-pointer group hover:bg-secondary/50 transition-colors border border-border/50"
                            onClick={() => {
                              if (group.conversation_id) {
                                navigate(`/group-chat/${group.conversation_id}`);
                              } else {
                                navigate("/matches");
                              }
                            }}
                          >
                            <div className="flex -space-x-2 flex-shrink-0">
                              {group.members.slice(0, 4).map((member, idx) => (
                                <Avatar key={member.user_id} className="h-10 w-10 border-2 border-background shadow-md">
                                  <AvatarImage src={member.profile.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-display font-bold">
                                    {member.profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {group.member_count > 4 && (
                                <div className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shadow-md">
                                  +{group.member_count - 4}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-semibold text-foreground mb-1">
                                {formatGroupName(group)}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {uniqueSpecialties.slice(0, 2).map((spec, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    <Stethoscope className="h-3 w-3 mr-1" />
                                    {spec}
                                  </Badge>
                                ))}
                                {group.members[0]?.profile.city && (
                                  <Badge variant="outline" className="text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {group.members[0].profile.city}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t("dashboard.physiciansMatched", { count: group.member_count, date: groupDate })}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors mt-1" />
                          </div>
                          
                          {/* Match Reason */}
                          {(sharedInterests.length > 0 || uniqueSpecialties.length > 0) && (
                            <div className="px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
                              <p className="text-xs text-muted-foreground mb-1.5 font-medium">{t("dashboard.whyThisMatch")}</p>
                              <p className="text-sm text-foreground">
                                {uniqueSpecialties.length > 0 && (
                                  <>{t("dashboard.matchedBecauseSpecialty", { specialties: uniqueSpecialties.join(", ") })}</>
                                )}
                                {uniqueSpecialties.length > 0 && sharedInterests.length > 0 && t("dashboard.andSelected")}
                                {sharedInterests.length > 0 && (
                                  <>{t("dashboard.selected")}<span className="font-semibold text-primary">{sharedInterests.join(", ")}</span></>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-lg">
                      <Hourglass className="h-14 w-14 text-primary animate-pulse" />
                    </div>
                    <h4 className="font-display text-2xl font-semibold text-foreground mb-3">
                      {preferences?.completed_at ? t("dashboard.onWaitingList") : t("dashboard.startYourJourney")}
                    </h4>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                      {preferences?.completed_at 
                        ? t("dashboard.groupBeingFormed")
                        : t("dashboard.completeProfileToStart")}
                    </p>
                    {!preferences?.completed_at && (
                      <Button 
                        onClick={() => navigate("/onboarding")} 
                        className="bg-primary hover:opacity-90 rounded-xl px-8 h-12 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        {t("dashboard.completeProfile")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    {preferences?.completed_at && (
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
                          <Clock className="h-4 w-4 mr-2" />
                          {t("dashboard.nextMatchingRoundSoon")}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interests Card */}
            <Card className="border-0 rounded-3xl animate-fade-up delay-300 bg-card transition-all duration-300
              shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.05)]
              hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.08)]
              hover:-translate-y-0.5">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-display font-semibold">{t("dashboard.interests")}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/interests")}
                    className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    + {t("dashboard.add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {allInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {allInterests.slice(0, 12).map((interest, index) => {
                      const { icon: Icon, color } = getInterestCategory(interest as string);
                      return (
                        <Badge 
                          key={`${interest}-${index}`} 
                          variant="secondary" 
                          className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all hover:scale-105 ${color} flex items-center gap-1.5`}
                        >
                          <Icon className="h-3 w-3" />
                          {interest}
                        </Badge>
                      );
                    })}
                    {allInterests.length > 12 && (
                      <Badge 
                        variant="secondary" 
                        className="px-3.5 py-2 rounded-full text-xs font-medium bg-secondary/80 hover:bg-secondary/90 border border-border/50 transition-colors"
                      >
                        +{t("dashboard.more", { count: allInterests.length - 12 })}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
                      <Heart className="h-8 w-8 text-primary/30" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {t("dashboard.interestsDetermine")}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {t("dashboard.addAtLeast3")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/interests")}
                      className="gap-2 border-primary/20 hover:bg-primary/5"
                    >
                      <Heart className="h-4 w-4 text-primary" />
                      {t("dashboard.addInterests")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;
