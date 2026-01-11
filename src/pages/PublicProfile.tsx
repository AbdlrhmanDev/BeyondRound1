import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Stethoscope, 
  MapPin, 
  Sparkles, 
  MessageCircle,
  UserPlus,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublicProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
}

interface PublicPreferences {
  specialty: string | null;
  career_stage: string | null;
  interests: string[] | null;
  friendship_type: string[] | null;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [preferences, setPreferences] = useState<PublicPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [sendingMatch, setSendingMatch] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profileData) setProfile({ ...profileData, city: null } as PublicProfile);

        const { data: prefsData } = await supabase
          .from("onboarding_preferences")
          .select("specialty, career_stage, interests, friendship_type")
          .eq("user_id", userId)
          .maybeSingle();

        if (prefsData) setPreferences(prefsData);

        // Check if there's an existing match
        if (user && user.id !== userId) {
          const { data: matchData } = await (supabase as any)
            .from("matches")
            .select("status")
            .or(`and(user_id.eq.${user.id},matched_user_id.eq.${userId}),and(user_id.eq.${userId},matched_user_id.eq.${user.id})`)
            .maybeSingle();

          if (matchData) setMatchStatus(matchData.status);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Could not load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user, toast]);

  const handleSendMatch = async () => {
    if (!user || !userId) return;

    setSendingMatch(true);
    try {
      const { error } = await (supabase as any).from("matches").insert({
        user_id: user.id,
        matched_user_id: userId,
        status: "pending",
        match_score: 0,
      });

      if (error) throw error;

      setMatchStatus("pending");
      toast({
        title: "Match Request Sent!",
        description: "They'll be notified of your interest.",
      });
    } catch (error) {
      console.error("Error sending match:", error);
      toast({
        title: "Error",
        description: "Could not send match request",
        variant: "destructive",
      });
    } finally {
      setSendingMatch(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !userId) return;

    // Find or create conversation
    const { data: existingMatch } = await (supabase as any)
      .from("matches")
      .select("id")
      .or(`and(user_id.eq.${user.id},matched_user_id.eq.${userId}),and(user_id.eq.${userId},matched_user_id.eq.${user.id})`)
      .eq("status", "accepted")
      .maybeSingle();

    if (existingMatch) {
      const { data: existingConvo } = await (supabase as any)
        .from("conversations")
        .select("id")
        .eq("match_id", existingMatch.id)
        .maybeSingle();

      if (existingConvo) {
        navigate(`/chat/${existingConvo.id}`);
      } else {
        const { data: newConvo } = await (supabase as any)
          .from("conversations")
          .insert({ match_id: existingMatch.id })
          .select()
          .single();

        if (newConvo) navigate(`/chat/${newConvo.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-10 w-24 mb-8" />
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">This user doesn't exist or their profile is private.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl shadow-foreground/10 rounded-3xl overflow-hidden">
            <div className="h-32 bg-gradient-gold relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
            </div>
            <CardContent className="-mt-16 relative pb-8 px-8">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-gold text-primary-foreground text-4xl font-display font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="mt-6">
                <h1 className="font-display text-3xl font-bold text-foreground">
                  {profile.full_name || "Anonymous Physician"}
                </h1>

                <div className="flex flex-wrap gap-3 mt-4">
                  {preferences?.specialty && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Stethoscope className="h-4 w-4" />
                      <span className="text-sm">{preferences.specialty}</span>
                    </div>
                  )}
                  {profile.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{profile.city}</span>
                    </div>
                  )}
                  {preferences?.career_stage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm">{preferences.career_stage}</span>
                    </div>
                  )}
                </div>

                {preferences?.interests && preferences.interests.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-foreground mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {preferences.interests.map((interest) => (
                        <Badge 
                          key={interest} 
                          variant="secondary"
                          className="px-3 py-1.5 rounded-full text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preferences?.friendship_type && preferences.friendship_type.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-accent" />
                      Looking for
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {preferences.friendship_type.map((type) => (
                        <Badge 
                          key={type} 
                          variant="outline"
                          className="px-3 py-1.5 rounded-full text-xs border-primary/30 text-primary"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!isOwnProfile && user && (
                  <div className="mt-8 space-y-4">
                    <div className="flex gap-3">
                      {matchStatus === "accepted" ? (
                        <Button 
                          onClick={handleStartChat}
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send Message
                        </Button>
                      ) : matchStatus === "pending" ? (
                        <Button disabled variant="secondary" className="gap-2">
                          <UserPlus className="h-4 w-4" />
                          Match Pending
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleSendMatch}
                          disabled={sendingMatch}
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          {sendingMatch ? "Sending..." : "Connect"}
                        </Button>
                      )}
                    </div>
                    
                    {/* Info about finding matches */}
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Find More Matches</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/matches")}
                          className="justify-start h-auto py-2 text-xs"
                        >
                          <Users className="h-3 w-3 mr-2" />
                          View Your Groups
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/discover")}
                          className="justify-start h-auto py-2 text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-2" />
                          Discover Physicians
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isOwnProfile && (
                  <div className="mt-8">
                    <Button onClick={() => navigate("/profile")} variant="outline">
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
