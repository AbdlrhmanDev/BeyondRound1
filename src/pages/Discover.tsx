import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Sparkles, 
  MapPin,
  Stethoscope,
  UserPlus,
  RefreshCw,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscoverProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  specialty: string | null;
  interests: string[] | null;
  sports: string[] | null;
  goals: string[] | null;
  match_score: number;
}

const Discover = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMatch, setSendingMatch] = useState<string | null>(null);
  const [sentMatches, setSentMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get existing matches to exclude
      const { data: existingMatches } = await (supabase as any)
        .from("matches")
        .select("user_id, matched_user_id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);

      const excludeIds = new Set([user.id]);
      existingMatches?.forEach((m: any) => {
        excludeIds.add(m.user_id);
        excludeIds.add(m.matched_user_id);
      });

      // Get all profiles (RLS will filter based on policies)
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast({
          title: "Error loading profiles",
          description: profilesError.message || "Could not load profiles",
          variant: "destructive",
        });
        setProfiles([]);
        return;
      }

      if (!allProfiles || allProfiles.length === 0) {
        setProfiles([]);
        return;
      }

      // Filter and calculate scores using the database function
      const enrichedProfiles: DiscoverProfile[] = [];

      for (const profile of allProfiles) {
        if (excludeIds.has(profile.user_id)) continue;

        // Get preferences first - skip if no preferences or incomplete onboarding
        const { data: prefs, error: prefsError } = await supabase
          .from("onboarding_preferences")
          .select("specialty, interests, sports, goals, completed_at")
          .eq("user_id", profile.user_id)
          .maybeSingle();

        // Skip profiles without preferences or incomplete onboarding
        if (prefsError || !prefs || !prefs.completed_at) {
          continue;
        }

        // Call the database function to calculate match score
        const { data: scoreResult, error: scoreError } = await supabase.rpc("calculate_match_score", {
          user_a_id: user.id,
          user_b_id: profile.user_id,
        });

        // If score calculation fails, skip this profile
        if (scoreError) {
          console.warn(`Error calculating score for user ${profile.user_id}:`, scoreError);
          continue;
        }

        const matchScore = scoreResult ?? 0;

        enrichedProfiles.push({
          user_id: profile.user_id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          city: (profile as any).city || null,
          neighborhood: (profile as any).neighborhood || null,
          specialty: prefs.specialty || null,
          interests: prefs.interests || null,
          sports: (prefs as any)?.sports || null,
          goals: (prefs as any)?.goals || null,
          match_score: Number(matchScore),
        });
      }

      // Sort by match score (highest first)
      enrichedProfiles.sort((a, b) => b.match_score - a.match_score);
      
      // Only show profiles with some compatibility
      const relevantProfiles = enrichedProfiles.filter(p => p.match_score > 0);
      setProfiles(relevantProfiles.slice(0, 20));
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error loading profiles",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const handleConnect = async (targetUserId: string) => {
    if (!user) return;

    setSendingMatch(targetUserId);
    try {
      const { error } = await (supabase as any).from("matches").insert({
        user_id: user.id,
        matched_user_id: targetUserId,
        status: "pending",
        match_score: profiles.find(p => p.user_id === targetUserId)?.match_score || 0,
      });

      if (error) throw error;

      setSentMatches((prev) => new Set([...prev, targetUserId]));
      toast({
        title: "Connection request sent!",
        description: "They'll be notified of your interest.",
      });
    } catch (error) {
      console.error("Error sending match:", error);
      toast({
        title: "Error",
        description: "Could not send connection request",
        variant: "destructive",
      });
    } finally {
      setSendingMatch(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500/10 text-green-600 border-green-500/30";
    if (score >= 50) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    return "bg-muted text-muted-foreground";
  };

  const formatGoals = (goals: string[] | null) => {
    if (!goals) return [];
    const goalMap: Record<string, string> = {
      casual_friends: "Casual",
      close_friends: "Close Friends",
      activity_partners: "Activities",
      social_group: "Social Group",
      mentorship: "Mentorship",
      business: "Business",
    };
    return goals.slice(0, 2).map(g => goalMap[g] || g);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-6 py-8">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Discover Physicians</h1>
            <p className="text-muted-foreground text-sm mt-1">Find physicians who share your interests</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfiles} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        {/* Score legend */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>Match quality:</span>
          <Badge className="bg-green-500/10 text-green-600 border border-green-500/30">70%+ Excellent</Badge>
          <Badge className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/30">50%+ Good</Badge>
        </div>

        {profiles.length === 0 ? (
          <Card className="border-0 shadow-xl rounded-3xl max-w-md mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">No matches yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete your profile and check back for new physicians in your area.
              </p>
              <Button onClick={fetchProfiles}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const initials = profile.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U";

              const alreadySent = sentMatches.has(profile.user_id);
              const formattedGoals = formatGoals(profile.goals);

              return (
                <Card 
                  key={profile.user_id}
                  className="border-0 shadow-xl shadow-foreground/5 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="h-20 bg-gradient-gold relative">
                    {profile.match_score > 0 && (
                      <Badge className={`absolute top-3 right-3 border ${getScoreColor(profile.match_score)}`}>
                        {profile.match_score}% match
                      </Badge>
                    )}
                  </div>
                  <CardContent className="-mt-10 relative pb-6 px-6">
                    <Avatar 
                      className="h-20 w-20 border-4 border-background shadow-lg cursor-pointer"
                      onClick={() => navigate(`/u/${profile.user_id}`)}
                    >
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-gold text-primary-foreground text-2xl font-display font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="mt-4">
                      <h3 
                        className="font-display text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/u/${profile.user_id}`)}
                      >
                        {profile.full_name || "Anonymous"}
                      </h3>

                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                        {profile.specialty && (
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {profile.specialty}
                          </span>
                        )}
                        {profile.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.city}
                            {profile.neighborhood && `, ${profile.neighborhood}`}
                          </span>
                        )}
                      </div>

                      {/* Sports/Activities */}
                      {profile.sports && profile.sports.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {profile.sports.slice(0, 3).map((sport) => (
                            <Badge key={sport} variant="secondary" className="text-xs">
                              {sport}
                            </Badge>
                          ))}
                          {profile.sports.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.sports.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Goals */}
                      {formattedGoals.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Looking for: {formattedGoals.join(", ")}
                        </div>
                      )}

                      <Button 
                        className="w-full mt-4 gap-2"
                        onClick={() => handleConnect(profile.user_id)}
                        disabled={alreadySent || sendingMatch === profile.user_id}
                      >
                        <UserPlus className="h-4 w-4" />
                        {alreadySent ? "Request Sent" : sendingMatch === profile.user_id ? "Sending..." : "Connect"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Discover;