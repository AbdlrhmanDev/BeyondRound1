import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import MatchCountdown from "@/components/MatchCountdown";
import { 
  Users, 
  Heart, 
  Calendar,
  Stethoscope, 
  Sparkles,
  ArrowRight,
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
  };
}

interface MatchGroup {
  id: string;
  name: string | null;
  match_week: string;
  created_at: string;
  members: GroupMember[];
  conversation_id?: string;
  member_count: number;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [groupsCount, setGroupsCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Check for pending onboarding data in localStorage
        const pendingDataStr = localStorage.getItem('pending_onboarding_data');
        if (pendingDataStr) {
          try {
            const pendingData = JSON.parse(pendingDataStr);
            const { personalInfo, answers } = pendingData;
            
            // Save pending onboarding data
            console.log('💾 Found pending onboarding data, saving now...');
            
            // Update profile
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                full_name: personalInfo?.name || null,
                city: personalInfo?.city || null,
                neighborhood: personalInfo?.neighborhood || null,
                gender: personalInfo?.gender || null,
                birth_year: personalInfo?.birthYear ? parseInt(personalInfo.birthYear) : null,
                gender_preference: personalInfo?.genderPreference || null,
                nationality: personalInfo?.nationality || null,
              } as any)
              .eq("user_id", user.id);

            if (profileError) {
              console.error('Profile update error:', profileError);
            }

            // Save preferences
            const { error: prefsError } = await supabase.from("onboarding_preferences").upsert({
              user_id: user.id,
              specialty: answers?.specialty?.[0] || null,
              specialty_preference: answers?.specialty_preference?.[0] || null,
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

            if (prefsError) {
              console.error('Preferences save error:', prefsError);
              toast({
                title: "Error saving data",
                description: `Preferences save failed: ${prefsError.message}. Click "Save Pending Data" button to retry.`,
                variant: "destructive",
              });
            } else {
              console.log('✅ Pending onboarding data saved successfully');
              // Remove from localStorage after successful save
              localStorage.removeItem('pending_onboarding_data');
              
              // Refresh data
              const [profileRes, prefsRes] = await Promise.all([
                supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
                supabase.from("onboarding_preferences").select("*").eq("user_id", user.id).maybeSingle(),
              ]);

              if (profileRes.data) setProfile(profileRes.data);
              if (prefsRes.data) setPreferences(prefsRes.data);
              
              toast({
                title: "Profile data saved",
                description: "Your onboarding data has been saved successfully!",
              });
            }
          } catch (parseError) {
            console.error('Error parsing pending onboarding data:', parseError);
            localStorage.removeItem('pending_onboarding_data');
          }
        }

        const [profileRes, prefsRes, memberRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("onboarding_preferences").select("*, other_interests, sports, music_preferences, movie_preferences").eq("user_id", user.id).maybeSingle(),
          supabase.from("group_members").select("group_id").eq("user_id", user.id),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (prefsRes.data) setPreferences(prefsRes.data);
        
        // Fetch groups if user is a member
        if (memberRes.data && memberRes.data.length > 0) {
          setGroupsCount(memberRes.data.length);
          const groupIds = memberRes.data.map((m) => m.group_id);

          const { data: groupsData } = await supabase
            .from("match_groups")
            .select("*")
            .in("id", groupIds)
            .eq("status", "active")
            .order("match_week", { ascending: false })
            .limit(1);

          if (groupsData) {
            const enrichedGroups: MatchGroup[] = await Promise.all(
              groupsData.map(async (group) => {
                // Get member user IDs
                const { data: membersData } = await supabase
                  .from("group_members")
                  .select("user_id")
                  .eq("group_id", group.id);

                const memberUserIds = (membersData || []).map((m) => m.user_id);
                const otherMemberIds = memberUserIds.filter((id) => id !== user.id).slice(0, 4);

                // Get member profiles
                const members = await Promise.all(
                  otherMemberIds.map(async (memberId) => {
                    const { data: profileData } = await supabase
                      .from("profiles")
                      .select("full_name, avatar_url")
                      .eq("user_id", memberId)
                      .maybeSingle();
                    
                    return {
                      user_id: memberId,
                      profile: {
                        full_name: profileData?.full_name || null,
                        avatar_url: profileData?.avatar_url || null,
                      },
                    };
                  })
                );

                // Get conversation ID
                const { data: convoData } = await supabase
                  .from("group_conversations")
                  .select("id")
                  .eq("group_id", group.id)
                  .maybeSingle();

                return {
                  id: group.id,
                  name: group.name,
                  match_week: group.match_week,
                  created_at: group.created_at,
                  members,
                  conversation_id: convoData?.id,
                  member_count: memberUserIds.length,
                };
              })
            );

            setGroups(enrichedGroups);
          }
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-12">
            <Skeleton className="h-12 w-56 rounded-2xl" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-80 rounded-3xl lg:col-span-4" />
            <Skeleton className="h-80 rounded-3xl lg:col-span-8" />
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

  // Combine all interests
  const allInterests = [
    ...(preferences?.other_interests || []),
    ...(preferences?.sports || []),
    ...(preferences?.music_preferences || []),
    ...(preferences?.movie_preferences || []),
    ...(preferences?.interests || []),
  ].filter(Boolean);

  // Manual save function for pending onboarding data
  const handleManualSave = async () => {
    if (!user) return;
    
    const pendingDataStr = localStorage.getItem('pending_onboarding_data');
    if (!pendingDataStr) {
      toast({
        title: "No pending data",
        description: "There's no pending onboarding data to save.",
        variant: "default",
      });
      return;
    }

    try {
      const pendingData = JSON.parse(pendingDataStr);
      const { personalInfo, answers } = pendingData;
      
      toast({
        title: "Saving data...",
        description: "Please wait while we save your onboarding data.",
      });

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: personalInfo?.name || null,
          city: personalInfo?.city || null,
          neighborhood: personalInfo?.neighborhood || null,
          gender: personalInfo?.gender || null,
          birth_year: personalInfo?.birthYear ? parseInt(personalInfo.birthYear) : null,
          gender_preference: personalInfo?.genderPreference || null,
          nationality: personalInfo?.nationality || null,
        } as any)
        .eq("user_id", user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast({
          title: "Profile update failed",
          description: profileError.message,
          variant: "destructive",
        });
        return;
      }

      // Save preferences
      const { error: prefsError } = await supabase.from("onboarding_preferences").upsert({
        user_id: user.id,
        specialty: answers?.specialty?.[0] || null,
        specialty_preference: answers?.specialty_preference?.[0] || null,
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

      if (prefsError) {
        console.error('Preferences save error:', prefsError);
        toast({
          title: "Preferences save failed",
          description: prefsError.message,
          variant: "destructive",
        });
        return;
      }

      // Success - clear localStorage and reload data
      localStorage.removeItem('pending_onboarding_data');
      
      // Refresh data immediately
      const [profileRes, prefsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("onboarding_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (prefsRes.data) setPreferences(prefsRes.data);
      
      toast({
        title: "✅ Data saved successfully!",
        description: "Your onboarding data has been saved and your profile is now complete!",
      });
    } catch (error: any) {
      console.error('Manual save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if there's pending data or incomplete profile
  const hasPendingData = localStorage.getItem('pending_onboarding_data') !== null;
  const isProfileIncomplete = !preferences?.completed_at;

  return (
    <DashboardLayout>
      <main className="container mx-auto px-6 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Overview</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-3">
                Hey, {firstName} <span className="inline-block animate-float">👋</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Ready to connect with physicians who share your journey?
              </p>
            </div>
            {(hasPendingData || isProfileIncomplete) && (
              <Button
                onClick={handleManualSave}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                {hasPendingData ? "💾 Save Pending Data" : "Complete Profile"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <Card 
              className="overflow-hidden border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up cursor-pointer hover:shadow-2xl transition-all duration-300"
              onClick={() => navigate("/profile")}
            >
              <div className="h-24 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.25),transparent_60%)]" />
              </div>
              <CardContent className="-mt-12 relative pb-6 px-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl bg-secondary/80 backdrop-blur-sm">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-2xl font-display font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-5">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {profile?.full_name || "Complete Your Profile"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5">{user?.email}</p>
                </div>

                <div className="mt-6 space-y-3">
                  {preferences?.specialty && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/80 backdrop-blur-sm border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Specialty</p>
                        <p className="text-sm font-semibold text-foreground truncate">{preferences.specialty}</p>
                      </div>
                    </div>
                  )}
                  {preferences?.career_stage && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/80 backdrop-blur-sm border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Career Stage</p>
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
                    Complete Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Next Group Matching - Prominent Display */}
            <div className="animate-fade-up delay-100">
              <MatchCountdown />
            </div>

            {/* Matches Section */}
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden animate-fade-up delay-200 hover:shadow-2xl transition-shadow">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display font-semibold">Your Matches</CardTitle>
                      <p className="text-sm text-muted-foreground">Physicians who share your interests</p>
                    </div>
                  </div>
                  {groups.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/matches")}
                      className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {groups.length > 0 ? (
                  <div>
                    {groups.slice(0, 1).map((group) => {
                      const groupDate = group.match_week 
                        ? new Date(group.match_week).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : new Date(group.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                      
                      return (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-3 rounded-xl cursor-pointer group hover:bg-secondary/50 transition-colors"
                          onClick={() => {
                            if (group.conversation_id) {
                              navigate(`/group-chat/${group.conversation_id}`);
                            } else {
                              navigate("/matches");
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Avatar className="h-12 w-12 border-0 shadow-md">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-display font-bold">
                                {group.name?.replace(/[^A-Z]/g, '').slice(0, 2) || 'G1'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-semibold text-foreground mb-1 truncate">
                                {group.name || `Group 1`}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {group.member_count} members • {groupDate}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shadow-inner">
                      <Users className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                      {preferences?.completed_at ? "Finding Your Matches..." : "Start Your Journey"}
                    </h4>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      {preferences?.completed_at 
                        ? "We're curating meaningful connections for you. Check back soon!"
                        : "Complete your profile to start connecting with physicians who understand your world."}
                    </p>
                    {!preferences?.completed_at && (
                      <Button 
                        onClick={() => navigate("/onboarding")} 
                        className="bg-primary hover:opacity-90 rounded-xl px-6 h-11 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interests Card */}
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-300 hover:shadow-2xl transition-shadow">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-display font-semibold">Interests</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    + Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {allInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allInterests.slice(0, 10).map((interest, index) => (
                      <Badge 
                        key={`${interest}-${index}`} 
                        variant="secondary" 
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/80 hover:bg-secondary/90 border border-border/50 transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add your interests to find like-minded physicians.
                  </p>
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
