import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  ChevronRight,
  MessageCircle
} from "lucide-react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface OnboardingPreferences {
  specialty: string | null;
  career_stage: string | null;
  interests: string[] | null;
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
        const [profileRes, prefsRes, memberRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("onboarding_preferences").select("*").eq("user_id", user.id).maybeSingle(),
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

  return (
    <DashboardLayout>
      <main className="container mx-auto px-6 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-primary">Dashboard</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Overview</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Hey, {firstName} <span className="inline-block animate-float">👋</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Ready to connect with physicians who share your journey?
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <Card 
              className="overflow-hidden border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up cursor-pointer hover:shadow-2xl transition-shadow"
              onClick={() => navigate("/profile")}
            >
              <div className="h-20 bg-gradient-gold relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
              </div>
              <CardContent className="-mt-10 relative pb-6">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-gold text-primary-foreground text-2xl font-display font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {profile?.full_name || "Complete Your Profile"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                </div>

                <div className="mt-6 space-y-3">
                  {preferences?.specialty && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Specialty</p>
                        <p className="text-sm font-medium text-foreground">{preferences.specialty}</p>
                      </div>
                    </div>
                  )}
                  {preferences?.career_stage && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Career Stage</p>
                        <p className="text-sm font-medium text-foreground">{preferences.career_stage}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!preferences?.completed_at && (
                  <Button 
                    onClick={() => navigate("/onboarding")} 
                    className="w-full mt-6 bg-gradient-gold hover:opacity-90 rounded-xl h-11 font-medium shadow-glow-sm"
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
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden animate-fade-up delay-200">
              <CardHeader className="border-b border-border/40 bg-secondary/30 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display">Your Matches</CardTitle>
                      <p className="text-sm text-muted-foreground">Physicians who share your interests</p>
                    </div>
                  </div>
                  {groups.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/matches")}
                      className="gap-2"
                    >
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {groups.length > 0 ? (
                  <div>
                    {groups.slice(0, 1).map((group) => {
                      const groupInitials = group.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "GRP";
                      
                      return (
                        <Card
                          key={group.id}
                          className="border border-border/50 hover:border-primary/30 transition-all cursor-pointer group bg-card/50 hover:bg-card"
                          onClick={() => {
                            if (group.conversation_id) {
                              navigate(`/group-chat/${group.conversation_id}`);
                            } else {
                              navigate("/matches");
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                  <Avatar className="h-14 w-14 border-2 border-background">
                                    <AvatarFallback className="bg-gradient-gold text-primary-foreground text-lg font-display font-bold">
                                      {groupInitials.slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {group.members.length > 0 && (
                                    <div className="absolute -bottom-1 -right-1 flex -space-x-2">
                                      {group.members.slice(0, 3).map((member) => {
                                        const initials = member.profile.full_name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase() || "?";
                                        
                                        return (
                                          <Avatar
                                            key={member.user_id}
                                            className="h-6 w-6 border-2 border-background"
                                          >
                                            <AvatarImage src={member.profile.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs bg-secondary">
                                              {initials.slice(0, 1)}
                                            </AvatarFallback>
                                          </Avatar>
                                        );
                                      })}
                                      {group.member_count > 4 && (
                                        <div className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                                          <span className="text-xs font-medium text-muted-foreground">
                                            +{group.member_count - 4}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-display font-semibold text-foreground mb-1 truncate">
                                    {group.name || `Group ${group.id.slice(0, 6)}`}
                                  </h4>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3.5 w-3.5" />
                                      {group.member_count} members
                                    </span>
                                    {group.match_week && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(group.match_week).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {group.conversation_id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/group-chat/${group.conversation_id}`);
                                  }}
                                >
                                  <MessageCircle className="h-5 w-5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
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
                        className="bg-gradient-gold hover:opacity-90 rounded-xl px-6 h-11 font-medium shadow-glow-sm"
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
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-300">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-lg font-display">Interests</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {preferences?.interests && preferences.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences.interests.map((interest) => (
                      <Badge 
                        key={interest} 
                        variant="secondary" 
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary"
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
                {preferences?.friendship_type && preferences.friendship_type.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-border/40">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Looking for</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.friendship_type.map((type) => (
                        <Badge 
                          key={type} 
                          variant="outline" 
                          className="px-3 py-1.5 rounded-full text-xs font-medium border-primary/30 text-primary"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
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
