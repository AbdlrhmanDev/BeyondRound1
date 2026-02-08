'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { getProfile, getPublicProfile, updateProfile } from "@/services/profileService";
import { getOnboardingPreferences, saveOnboardingPreferences, getPublicPreferences } from "@/services/onboardingService";
import { getGroupMembers, getUserGroupMemberships, getGroupsByIds } from "@/services/matchService";
import { getGroupConversationsByGroupIds } from "@/services/conversationService";
import {
  Users,
  MessageCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Edit3,
  ChevronRight
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
  allMembers?: GroupMember[];
  conversation_id?: string;
  member_count: number;
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useLocalizedNavigate();
  const locale = i18n.language === "de" ? "de-DE" : "en-US";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Format group name: {City} – {Month} {Day} – Meetup
  const formatGroupName = useCallback((group: MatchGroup): string => {
    const allMembers = group.allMembers || group.members;
    const cities = Array.from(new Set(allMembers.map(m => m.profile.city).filter(Boolean)));
    const city = cities[0] || "Your City";

    let dateStr = "";
    if (group.match_week) {
      try {
        const matchDate = new Date(group.match_week);
        dateStr = matchDate.toLocaleDateString(locale, { month: "short", day: "numeric" });
      } catch {
        dateStr = "TBD";
      }
    } else {
      dateStr = "TBD";
    }

    return `${city} – ${dateStr} – Meetup`;
  }, [locale]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    const fetchData = async () => {
      try {
        // Check for pending onboarding data
        const pendingDataStr = localStorage.getItem('pending_onboarding_data');
        if (pendingDataStr) {
          try {
            const pendingData = JSON.parse(pendingDataStr);
            const { personalInfo, answers } = pendingData;

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

            if (profileUpdate) {
              await saveOnboardingPreferences(userId, {
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
              localStorage.removeItem('pending_onboarding_data');
            }
          } catch {
            localStorage.removeItem('pending_onboarding_data');
          }
        }

        // Fetch profile and preferences
        const [profileData, prefsData, memberData] = await Promise.all([
          getProfile(userId),
          getOnboardingPreferences(userId),
          getUserGroupMemberships(userId),
        ]);

        if (profileData) setProfile(profileData);
        if (prefsData) setPreferences(prefsData);

        // Fetch groups
        if (memberData && memberData.length > 0) {
          const groupIds = memberData.map((m) => m.group_id);
          const groupsData = await getGroupsByIds(groupIds, 1);

          if (groupsData && groupsData.length > 0) {
            const allGroupIds = groupsData.map(g => g.id);

            const [allMembersData, allConversationsData] = await Promise.all([
              Promise.all(allGroupIds.map(id => getGroupMembers(id))).then(results =>
                results.flatMap((members, index) =>
                  members.map(m => ({ group_id: allGroupIds[index], user_id: m.user_id }))
                )
              ),
              getGroupConversationsByGroupIds(allGroupIds),
            ]);

            const allMemberUserIds = Array.from(new Set(
              allMembersData.map(m => m.user_id).filter(id => id !== userId)
            ));

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

            const allProfilesData = allMemberUserIds.map(memberId => {
              const memberProfile = profilesMap.get(memberId);
              const memberPrefs = prefsMap.get(memberId);
              return {
                user_id: memberId,
                full_name: memberProfile?.full_name || null,
                avatar_url: memberProfile?.avatar_url || null,
                city: memberProfile?.city || null,
                specialty: memberPrefs?.specialty || null,
              };
            });

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

            const enrichedGroups: MatchGroup[] = groupsData.map((group) => {
              const memberUserIds = membersByGroup.get(group.id) || [];
              const otherMemberIds = memberUserIds.filter((id) => id !== userId);

              const completeProfiles = otherMemberIds.map(memberId => {
                const memberProfileData = profilesMapForGroups.get(memberId);
                return {
                  user_id: memberId,
                  profile: {
                    full_name: memberProfileData?.full_name || null,
                    avatar_url: memberProfileData?.avatar_url || null,
                    city: memberProfileData?.city || null,
                  },
                  preferences: {
                    specialty: memberProfileData?.specialty || null,
                  },
                };
              });

              return {
                id: group.id,
                name: group.name,
                match_week: group.match_week,
                created_at: group.created_at,
                members: completeProfiles.slice(0, 4),
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
          title: "Something went wrong",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchData();
  }, [user?.id, toast]);

  const displayedGroup = useMemo(() => groups[0], [groups]);

  const allInterests = useMemo(() => [
    ...(preferences?.other_interests || []),
    ...(preferences?.sports || []),
    ...(preferences?.music_preferences || []),
    ...(preferences?.movie_preferences || []),
    ...(preferences?.interests || []),
  ].filter(Boolean), [preferences]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
            <Skeleton className="h-8 w-48 rounded mb-2" />
            <Skeleton className="h-5 w-72 rounded mb-8" />
            <Skeleton className="h-64 rounded-xl mb-5" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const isProfileComplete = !!preferences?.completed_at;
  const GROUP_SIZE = 4;

  // Enter group handler
  const handleEnterGroup = (group: MatchGroup) => {
    if (group.conversation_id) {
      navigate(`/group-chat/${group.conversation_id}`);
    } else {
      navigate("/matches");
    }
  };

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:py-8 max-w-md mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            This week
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">

          {/* Current Group Card */}
          {displayedGroup ? (
            <Card className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
              {/* Group Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium border-primary/20 bg-primary/5 text-primary">
                        Your weekend group
                      </Badge>
                    </div>
                    <h2 className="font-semibold text-lg text-foreground tracking-tight">
                      {formatGroupName(displayedGroup)}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {displayedGroup.allMembers?.[0]?.profile.city || "Your area"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group Members */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {displayedGroup.members.slice(0, 4).map((member) => (
                        <Avatar key={member.user_id} className="h-10 w-10 border-2 border-background ring-1 ring-border/10">
                          <AvatarImage src={member.profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                            {member.profile.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {displayedGroup.member_count > 4 && (
                        <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-1 ring-border/10">
                          +{displayedGroup.member_count - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary block">
                      {displayedGroup.member_count}/{GROUP_SIZE} joined
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action */}
              <div className="p-5 bg-muted/30">
                <Button
                  onClick={() => handleEnterGroup(displayedGroup)}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  Open group
                </Button>
              </div>

              {/* What happens next */}
              <div className="p-5 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  What happens next
                </p>
                <div className="space-y-4 relative">
                  {/* Vertical Line Line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-border/60" />

                  <div className="flex gap-4 relative">
                    <div className="h-6 w-6 rounded-full bg-background border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary z-10 shrink-0 shadow-sm">1</div>
                    <div>
                      <span className="text-sm font-medium text-foreground block">Join the chat</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">Say hello to your group</span>
                    </div>
                  </div>
                  <div className="flex gap-4 relative">
                    <div className="h-6 w-6 rounded-full bg-background border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary z-10 shrink-0 shadow-sm">2</div>
                    <div>
                      <span className="text-sm font-medium text-foreground block">Introduce yourself</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">Share a bit about your work</span>
                    </div>
                  </div>
                  <div className="flex gap-4 relative">
                    <div className="h-6 w-6 rounded-full bg-background border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary z-10 shrink-0 shadow-sm">3</div>
                    <div>
                      <span className="text-sm font-medium text-foreground block">Plan meeting</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">Vote on a place or time</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interests Context */}
              {allInterests.length > 0 && (
                <div className="px-5 py-4 border-t border-border bg-muted/10">
                  <div className="flex flex-wrap gap-2">
                    {allInterests.slice(0, 5).map((interest, index) => (
                      <span
                        key={`${interest}-${index}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border text-muted-foreground"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            /* No Group Yet - Waiting State */
            <Card className="rounded-2xl bg-card border border-border shadow-sm">
              <CardContent className="py-12 px-6 text-center">
                {isProfileComplete ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-primary/60" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Your group is forming
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6 leading-relaxed">
                      We're curating a group of physicians in your area. Matches are finalized every Thursday.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Next group: This Thursday</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Get started
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                      Complete your profile to join a trusted circle of local physicians.
                    </p>
                    <Button
                      onClick={() => navigate("/onboarding")}
                      className="h-12 px-8 rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                      Complete Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Group Info (when user has a group) */}
          {displayedGroup && (
            <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Next group forms Thursday</p>
                <p className="text-xs text-muted-foreground">Matches refresh weekly</p>
              </div>
            </div>
          )}

          {/* Profile Status (when incomplete) */}
          {!isProfileComplete && (
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Profile incomplete</p>
                  <p className="text-xs text-muted-foreground">Finish to join a group</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/onboarding")}
                className="rounded-lg h-9 px-4 font-medium"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;
