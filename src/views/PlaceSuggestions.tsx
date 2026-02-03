'use client';

import { useEffect, useState } from "react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  Coffee, 
  Utensils, 
  TreeDeciduous,
  Music,
  BookOpen,
  Dumbbell,
  RefreshCw,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserCity, generatePlaceSuggestions } from "@/services/placeService";
import { supabase } from "@/integrations/supabase/client";

interface PlaceSuggestion {
  name: string;
  type: string;
  description: string;
  vibe: string;
  priceRange: string;
  goodFor: string[];
}

const PlaceSuggestions = () => {
  const navigate = useLocalizedNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [city, setCity] = useState("");
  const [userCity, setUserCity] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserCity = async () => {
      if (!user) return;

      const cityData = await getUserCity(user.id);
      if (cityData) {
        setUserCity(cityData);
        setCity(cityData);
      }
      setInitialLoading(false);
    };

    fetchUserCity();
  }, [user]);

  const handleGenerateSuggestions = async () => {
    if (!city.trim()) {
      toast({
        title: "Please enter a city",
        description: "We need to know where to find places for you.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSuggestions([]);

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      const placeSuggestions = await generatePlaceSuggestions(city.trim(), accessToken);
      
      if (placeSuggestions.length > 0) {
        setSuggestions(placeSuggestions);
      } else {
        toast({
          title: "No suggestions found",
          description: "Could not generate place suggestions for this city.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Could not generate place suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      cafe: <Coffee className="h-5 w-5" />,
      restaurant: <Utensils className="h-5 w-5" />,
      park: <TreeDeciduous className="h-5 w-5" />,
      bar: <Music className="h-5 w-5" />,
      library: <BookOpen className="h-5 w-5" />,
      gym: <Dumbbell className="h-5 w-5" />,
    };
    return iconMap[type.toLowerCase()] || <MapPin className="h-5 w-5" />;
  };

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-12 w-full max-w-md mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 min-h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold">AI Place Suggestions</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search Section */}
        <Card className="border-0 shadow-xl rounded-3xl mb-8 max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="font-display flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Find Great Places to Meet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get AI-powered suggestions for cafes, restaurants, and hangout spots perfect for meeting fellow physicians.
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter your city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleGenerateSuggestions()}
                />
              </div>
              <Button 
                onClick={handleGenerateSuggestions}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? "Generating..." : "Get Suggestions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {suggestions.map((place, index) => (
              <Card 
                key={index}
                className="border-0 shadow-xl shadow-foreground/5 rounded-2xl hover:shadow-2xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-gold flex items-center justify-center text-primary-foreground">
                      {getIcon(place.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-lg text-foreground">
                          {place.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {place.priceRange}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {place.type} • {place.vibe}
                      </p>
                      <p className="text-sm text-foreground mt-3">
                        {place.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {place.goodFor.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && suggestions.length === 0 && !city && (
          <Card className="border-0 shadow-xl rounded-3xl max-w-md mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center">
                <MapPin className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">Discover Great Places</h3>
              <p className="text-muted-foreground">
                Enter your city above to get personalized recommendations for meeting spots.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PlaceSuggestions;
