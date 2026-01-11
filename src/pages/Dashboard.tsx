import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
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
  Search,
  MapPin,
  Languages,
  Plus
} from "lucide-react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  languages: string[] | null;
}

interface OnboardingPreferences {
  specialty: string | null;
  career_stage: string | null;
  interests: string[] | null;
  friendship_type: string[] | null;
  meeting_frequency: string | null;
  completed_at: string | null;
  sports: string[] | null;
  social_style: string[] | null;
  culture_interests: string[] | null;
  lifestyle: string[] | null;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [profileRes, prefsRes, connectionsRes, matchesRes, groupsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("onboarding_preferences").select("*").eq("user_id", user.id).maybeSingle(),
          // Count accepted matches (connections)
          supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
            .eq("status", "accepted"),
          // Count all matches (pending + accepted)
          supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`),
          // Count groups user is a member of
          supabase
            .from("group_members")
            .select("group_id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (prefsRes.data) setPreferences(prefsRes.data);
        if (connectionsRes.count !== null) setConnectionsCount(connectionsRes.count);
        if (matchesRes.count !== null) setMatchesCount(matchesRes.count);
        if (groupsRes.count !== null) setGroupsCount(groupsRes.count);

        // Create welcome notification if user has profile but no welcome notification
        if (profileRes.data) {
          const { data: existingWelcome } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "welcome")
            .maybeSingle();
          
          if (!existingWelcome) {
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "welcome",
              title: "Welcome to BeyondRounds!",
              message: "Complete your profile to start connecting with physicians who share your interests.",
              link: "/profile",
            });
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
  
  // Combine all interests from different categories
  const allInterests = [
    ...(preferences?.interests || []),
    ...(preferences?.sports || []),
    ...(preferences?.social_style || []),
    ...(preferences?.culture_interests || []),
    ...(preferences?.lifestyle || []),
  ];
  const topInterests = allInterests.slice(0, 6);

  return (
    <DashboardLayout>
      <main className="container mx-auto px-6 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-up">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Hey, Dr. {firstName} <span className="inline-block animate-float">👋</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Ready to connect with physicians who share your journey?
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Summary Card */}
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
                  {(profile?.city || profile?.neighborhood) && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-foreground">
                          {profile.city || "Not set"}
                          {profile.neighborhood && ` • ${profile.neighborhood}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile?.languages && profile.languages.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Languages className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.languages.slice(0, 3).map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs px-2 py-0.5">
                              {lang}
                            </Badge>
                          ))}
                          {profile.languages.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              +{profile.languages.length - 3}
                            </Badge>
                          )}
                        </div>
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

            {/* Stats Mini-Cards */}
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl p-6 animate-fade-up delay-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-secondary/50">
                  <p className="font-display text-3xl font-bold text-foreground">
                    {loading ? "..." : connectionsCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Connections</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-secondary/50">
                  <p className="font-display text-3xl font-bold text-foreground">
                    {loading ? "..." : matchesCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Matches</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Your Matches Card */}
            <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden animate-fade-up delay-100">
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
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {groupsCount > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-display text-xl font-semibold text-foreground mb-4">
                        Next Group Matching
                      </h4>
                      <MatchCountdown />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center">
                      <Users className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                      Find your matches
                    </h4>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                      Complete your profile and preferences to be included in the next matching round.
                    </p>
                    <Button 
                      onClick={() => navigate("/discover")}
                      className="bg-gradient-gold hover:opacity-90 rounded-xl px-6 h-11 font-medium shadow-glow-sm"
                    >
                      Go to Discover
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Two CTA Cards Side-by-Side */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="border-0 shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden animate-fade-up delay-200 cursor-pointer hover:shadow-2xl transition-all"
                onClick={() => navigate("/matches")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h5 className="font-display font-semibold text-foreground">Your Groups</h5>
                      <p className="text-xs text-muted-foreground">View matched groups</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    View Groups
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-xl shadow-foreground/5 rounded-3xl overflow-hidden animate-fade-up delay-200 cursor-pointer hover:shadow-2xl transition-all"
                onClick={() => navigate("/discover")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Search className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h5 className="font-display font-semibold text-foreground">Discover</h5>
                      <p className="text-xs text-muted-foreground">Browse physicians</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    Browse Physicians
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Interests & Events Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Interests Card */}
              <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-300">
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-accent" />
                      </div>
                      <CardTitle className="text-lg font-display">Interests</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {topInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topInterests.map((interest, idx) => (
                        <Badge 
                          key={`${interest}-${idx}`}
                          variant="secondary" 
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Add interests to improve match quality
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate("/profile")}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Interests
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Events Card */}
              <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-300">
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-display">Events</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-3">
                      <Calendar className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No upcoming events yet…
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;
