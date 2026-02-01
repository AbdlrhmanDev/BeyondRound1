import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPublicProfile } from "@/services/profileService";
import { getPublicPreferences } from "@/services/onboardingService";

interface PublicProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  languages: string[] | null;
}

interface PublicPreferences {
  specialty: string | null;
  career_stage: string | null;
  interests: string[] | null;
  friendship_type: string[] | null;
  sports: string[] | null;
  social_style: string[] | null;
  culture_interests: string[] | null;
  lifestyle: string[] | null;
  availability_slots: string[] | null;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [preferences, setPreferences] = useState<PublicPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const [profileData, prefsData] = await Promise.all([
          getPublicProfile(userId),
          getPublicPreferences(userId),
        ]);

        if (profileData) {
          setProfile({
            id: profileData.user_id,
            user_id: profileData.user_id,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            city: profileData.city,
            neighborhood: profileData.neighborhood,
            languages: null, // Not included in public profile
          });
        }

        if (prefsData) {
          setPreferences(prefsData as PublicPreferences);
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
            <div className="h-48 bg-gradient-gold relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)]" />
            </div>
            <CardContent className="-mt-24 relative pb-8 px-8">
              <div className="relative flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-gold rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300" />
                  <Avatar className="relative h-48 w-48 border-4 border-background shadow-2xl ring-4 ring-primary/10 hover:ring-primary/20 transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
                    <AvatarImage 
                      src={profile.avatar_url || undefined} 
                      className="object-cover brightness-105 contrast-105"
                      alt={profile.full_name || "Profile picture"}
                    />
                    <AvatarFallback className="bg-gradient-gold text-primary-foreground text-5xl font-display font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

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
                      <span className="text-sm">
                        {profile.city}
                        {profile.neighborhood && ` • ${profile.neighborhood}`}
                      </span>
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

                {/* Additional Profile Information */}
                <div className="mt-6 space-y-4">
                  {profile.languages && profile.languages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.languages.map((lang) => (
                          <Badge 
                            key={lang} 
                            variant="secondary"
                            className="px-3 py-1.5 rounded-full text-xs"
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferences?.sports && preferences.sports.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Sports & Activities</h3>
                      <div className="flex flex-wrap gap-2">
                        {preferences.sports.map((sport) => (
                          <Badge 
                            key={sport} 
                            variant="secondary"
                            className="px-3 py-1.5 rounded-full text-xs"
                          >
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferences?.culture_interests && preferences.culture_interests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Cultural Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {preferences.culture_interests.map((interest) => (
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

                  {preferences?.lifestyle && preferences.lifestyle.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Lifestyle</h3>
                      <div className="flex flex-wrap gap-2">
                        {preferences.lifestyle.map((item) => (
                          <Badge 
                            key={item} 
                            variant="secondary"
                            className="px-3 py-1.5 rounded-full text-xs"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferences?.social_style && preferences.social_style.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Social Style</h3>
                      <div className="flex flex-wrap gap-2">
                        {preferences.social_style.map((style) => (
                          <Badge 
                            key={style} 
                            variant="secondary"
                            className="px-3 py-1.5 rounded-full text-xs"
                          >
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferences?.availability_slots && preferences.availability_slots.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Available Times</h3>
                      <div className="flex flex-wrap gap-2">
                        {preferences.availability_slots.map((slot) => {
                          const slotLabels: Record<string, string> = {
                            fri_evening: "Friday Evening",
                            sat_morning: "Saturday Morning",
                            sat_afternoon: "Saturday Afternoon",
                            sat_evening: "Saturday Evening",
                            sun_morning: "Sunday Morning",
                            sun_afternoon: "Sunday Afternoon",
                            sun_evening: "Sunday Evening",
                            weekday_eve: "Weekday Evenings",
                          };
                          return (
                            <Badge 
                              key={slot} 
                              variant="outline"
                              className="px-3 py-1.5 rounded-full text-xs border-primary/30"
                            >
                              {slotLabels[slot] || slot.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>


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
