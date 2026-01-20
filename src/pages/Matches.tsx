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
import MatchCountdown from "@/components/MatchCountdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  MessageCircle, 
  MapPin,
  Sparkles,
  Crown,
  UserPlus,
  RefreshCw,
  Info,
  Calendar,
  Stethoscope,
  Heart,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import GroupEvaluationSurvey from "@/components/GroupEvaluationSurvey";

interface GroupMember {
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    neighborhood: string | null;
    gender: string | null;
  };
  preferences?: {
    specialty: string | null;
    sports?: string[] | null;
    social_style?: string[] | null;
    culture_interests?: string[] | null;
    lifestyle?: string[] | null;
    availability_slots?: string[] | null;
  };
}

interface MatchDetails {
  sharedInterests: string[];
  specialtyMatch: {
    type: 'same' | 'related' | 'different';
    value: string;
  };
  locationMatch: {
    city: string;
    sameNeighborhood: boolean;
    neighborhood?: string;
  };
  sharedAvailability: string[];
}

interface MatchGroup {
  id: string;
  name: string | null;
  group_type: string;
  gender_composition: string | null;
  status: string;
  match_week: string;
  created_at: string;
  members: GroupMember[];
  conversation_id?: string;
  average_score?: number;
  matchDetails?: MatchDetails;
  is_partial_group?: boolean;
}


const Matches = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<MatchGroup | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyGroupId, setSurveyGroupId] = useState<string>("");
  const [surveyMatchWeek, setSurveyMatchWeek] = useState<string>("");
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      // Check if profile is complete
      const { data: preferences } = await supabase
        .from("onboarding_preferences")
        .select("completed_at")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setIsProfileComplete(!!preferences?.completed_at);

      // Get all groups the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberData.map((m) => m.group_id);

      // Get group details (including is_partial_group if column exists)
      // Note: If migration hasn't been applied, is_partial_group won't exist yet
      type GroupData = {
        id: string;
        name: string | null;
        group_type: string;
        gender_composition: string | null;
        status: string;
        match_week: string;
        created_at: string;
        is_partial_group?: boolean;
      };
      let groupsData: GroupData[] | null = null;
      let groupsError: Error | null = null;
      
      // Try to select with is_partial_group first
      const { data, error } = await supabase
        .from("match_groups")
        .select("*")
        .in("id", groupIds)
        .eq("status", "active")
        .order("match_week", { ascending: false });

      if (error) {
        // If error mentions is_partial_group, try without it
        if (error.message?.includes("is_partial_group")) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("match_groups")
            .select("*")
            .in("id", groupIds)
            .eq("status", "active")
            .order("match_week", { ascending: false });
          
          groupsData = fallbackData;
          groupsError = fallbackError;
        } else {
          groupsError = error;
        }
      } else {
        groupsData = data;
      }

      if (groupsError) throw groupsError;

      // Get all member IDs for all groups at once
      const allGroupIds = (groupsData || []).map(g => g.id);
      const { data: allMembersData } = await supabase
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", allGroupIds);

      // Get all user IDs (excluding current user)
      const allMemberIds = Array.from(new Set(
        (allMembersData || [])
          .map(m => m.user_id)
          .filter(id => id !== user.id)
      ));

      // Fetch all profiles and preferences in bulk
      const [profilesRes, prefsRes] = await Promise.all([
        allMemberIds.length > 0 
          ? supabase.from("profiles")
              .select("user_id, full_name, avatar_url, city, neighborhood, gender")
              .in("user_id", allMemberIds)
          : { data: [], error: null },
        allMemberIds.length > 0
          ? supabase.from("onboarding_preferences")
              .select("user_id, specialty, sports, social_style, culture_interests, lifestyle, availability_slots")
              .in("user_id", allMemberIds)
          : { data: [], error: null }
      ]);

      // Create lookup maps for faster access
      const profilesMap = new Map(
        (profilesRes.data || []).map(p => [p.user_id, p])
      );
      const prefsMap = new Map(
        (prefsRes.data || []).map(p => [p.user_id, p])
      );

      // Get all conversations at once
      const { data: conversationsData } = await supabase
        .from("group_conversations")
        .select("id, group_id")
        .in("group_id", allGroupIds);

      const conversationsMap = new Map(
        (conversationsData || []).map(c => [c.group_id, c.id])
      );

      // Group members by group_id
      const membersByGroup = new Map<string, string[]>();
      (allMembersData || []).forEach(m => {
        if (!membersByGroup.has(m.group_id)) {
          membersByGroup.set(m.group_id, []);
        }
        membersByGroup.get(m.group_id)!.push(m.user_id);
      });

      // Build enriched groups (skip score calculation for now - can be added later if needed)
      const enrichedGroups: MatchGroup[] = (groupsData || []).map((group: GroupData) => {
        const memberUserIds = membersByGroup.get(group.id) || [];
        const otherMemberIds = memberUserIds.filter((id) => id !== user.id);
        
        const members: GroupMember[] = otherMemberIds.map((memberId) => ({
          user_id: memberId,
          profile: profilesMap.get(memberId) || { 
            user_id: memberId,
            full_name: null, 
            avatar_url: null, 
            city: null, 
            neighborhood: null, 
            gender: null 
          },
          preferences: prefsMap.get(memberId) || undefined,
        }));

        return {
          id: group.id,
          name: group.name,
          group_type: group.group_type,
          gender_composition: group.gender_composition,
          status: group.status,
          match_week: group.match_week,
          created_at: group.created_at,
          members,
          conversation_id: conversationsMap.get(group.id),
          average_score: undefined, // Skip score calculation for faster loading
          is_partial_group: group.is_partial_group ?? false,
        };
      });

      // Sort groups by match_week (newest first)
      enrichedGroups.sort((a, b) => 
        new Date(b.match_week).getTime() - new Date(a.match_week).getTime()
      );
      
      setGroups(enrichedGroups);

      // Check if survey should be shown for the first group
      if (enrichedGroups.length > 0) {
        const group = enrichedGroups[0];
        const now = new Date();
        const matchDate = new Date(group.match_week);
        matchDate.setHours(16, 0, 0, 0); // Thursday 4 PM
        const thursdayEvening = new Date(matchDate);
        thursdayEvening.setHours(20, 0, 0, 0); // Thursday 8 PM
        
        if (now >= thursdayEvening) {
          // Check if user already submitted evaluation
          const { data: existingEvaluation } = await supabase
            .from("group_evaluations" as never)
            .select("id")
            .eq("user_id", user.id)
            .eq("group_id", group.id)
            .maybeSingle();
          
          if (!existingEvaluation) {
            setSurveyGroupId(group.id);
            setSurveyMatchWeek(group.match_week);
            setShowSurvey(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refresh completion status when component mounts or user changes
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) return;
      
      const { data: preferences } = await supabase
        .from("onboarding_preferences")
        .select("completed_at")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setIsProfileComplete(!!preferences?.completed_at);
    };

    if (user) {
      checkProfileCompletion();
    }
  }, [user]);

  const startGroupChat = async (group: MatchGroup) => {
    if (group.conversation_id) {
      navigate(`/group-chat/${group.conversation_id}`);
    } else {
      // Create conversation
      const { data: newConvo, error } = await supabase
        .from("group_conversations")
        .insert({ group_id: group.id })
        .select()
        .single();

      if (newConvo && !error) {
        navigate(`/group-chat/${newConvo.id}`);
      }
    }
  };

  const getGroupTypeLabel = (group: MatchGroup) => {
    if (group.group_type === "mixed") {
      return group.gender_composition === "2F3M" ? "2♀ 3♂" : "3♀ 2♂";
    }
    return group.gender_composition === "all_female" ? "All Female" : "All Male";
  };


  const getWeekLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return "This Week";
    if (diffDays < 14) return "Last Week";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSlot = (slot: string) => {
    const slotMap: Record<string, string> = {
      fri_evening: "Fri Evening",
      sat_morning: "Sat Morning",
      sat_afternoon: "Sat Afternoon",
      sat_evening: "Sat Evening",
      sun_morning: "Sun Morning",
      sun_afternoon: "Sun Afternoon",
      sun_evening: "Sun Evening",
      weekday_eve: "Weekday Evenings",
    };
    return slotMap[slot] || slot.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getSpecialtyCluster = (specialties: string[]): string => {
    if (specialties.length === 0) return "General";
    
    // Count specialty occurrences
    const counts: Record<string, number> = {};
    specialties.forEach(s => {
      if (s) counts[s] = (counts[s] || 0) + 1;
    });
    
    // Find most common specialty
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const mostCommon = sorted[0]?.[0];
    
    if (!mostCommon) return "General";
    
    // If all have same specialty, return it
    if (sorted.length === 1) return mostCommon;
    
    // If majority share same specialty, return it
    if (sorted[0][1] >= specialties.length * 0.6) return mostCommon;
    
    // Otherwise, return a cluster name based on common categories
    const primaryCare = ["Family Medicine", "General Practice", "Internal Medicine"];
    const surgical = ["Surgery", "Orthopedics", "Plastic Surgery", "Neurosurgery"];
    const medical = ["Cardiology", "Pulmonology", "Gastroenterology", "Nephrology", "Endocrinology"];
    
    if (specialties.some(s => primaryCare.includes(s))) return "Primary Care";
    if (specialties.some(s => surgical.includes(s))) return "Surgical";
    if (specialties.some(s => medical.includes(s))) return "Medical";
    
    return mostCommon;
  };

  const getGroupTheme = (group: MatchGroup): string => {
    // Collect all interests from group members
    const allInterests: string[] = [];
    group.members.forEach(member => {
      if (member.preferences) {
        if (member.preferences.sports) allInterests.push(...member.preferences.sports);
        if (member.preferences.social_style) allInterests.push(...member.preferences.social_style);
        if (member.preferences.culture_interests) allInterests.push(...member.preferences.culture_interests);
        if (member.preferences.lifestyle) allInterests.push(...member.preferences.lifestyle);
      }
    });
    
    // Count interest occurrences
    const counts: Record<string, number> = {};
    allInterests.forEach(interest => {
      counts[interest] = (counts[interest] || 0) + 1;
    });
    
    // Find most common interest theme
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topInterest = sorted[0]?.[0];
    
    // Map interests to themes
    const themeMap: Record<string, string> = {
      "Fitness": "Active",
      "Running": "Active",
      "Gym": "Active",
      "Yoga": "Wellness",
      "Meditation": "Wellness",
      "Reading": "Intellectual",
      "Books": "Intellectual",
      "Travel": "Adventure",
      "Hiking": "Adventure",
      "Outdoor": "Adventure",
      "Music": "Creative",
      "Art": "Creative",
      "Photography": "Creative",
      "Cooking": "Culinary",
      "Food": "Culinary",
      "Coffee": "Social",
      "Networking": "Professional",
      "Business": "Professional",
    };
    
    if (topInterest && themeMap[topInterest]) {
      return themeMap[topInterest];
    }
    
    // Default themes based on group characteristics
    if (group.gender_composition === "all_female") return "Women's Circle";
    if (group.gender_composition === "all_male") return "Men's Circle";
    if (group.group_type === "mixed") return "Diverse";
    
    return "Community";
  };

  const formatGroupName = (group: MatchGroup): string => {
    const cities = Array.from(new Set(group.members.map(m => m.profile.city).filter(Boolean)));
    const city = cities[0] || "Unknown";
    
    const specialties = group.members
      .map(m => m.preferences?.specialty)
      .filter(Boolean) as string[];
    const specialtyCluster = getSpecialtyCluster(specialties);
    
    const theme = getGroupTheme(group);
    
    // Extract base name (remove any existing city/specialty/theme if present)
    const baseName = group.name || `Group ${group.id.slice(0, 6)}`;
    const cleanBaseName = baseName.split(' • ')[0].trim();
    
    return `${cleanBaseName} ${city} • ${specialtyCluster} • ${theme}`;
  };

  const fetchMatchDetails = async (group: MatchGroup) => {
    if (!user) return;
    setLoadingDetails(true);
    setSelectedGroup(group);
    setMatchDetails(null); // Reset previous details
    
    try {
      // Check if group has members
      if (!group.members || group.members.length === 0) {
        console.warn("Group has no members");
        setLoadingDetails(false);
        return;
      }

      // Get current user's preferences
      const { data: userPrefs, error: prefsError } = await supabase
        .from("onboarding_preferences")
        .select("specialty, sports, social_style, culture_interests, lifestyle, availability_slots")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefsError) {
        console.error("Error fetching user preferences:", prefsError);
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("city, neighborhood")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
      }

      // Use default values if preferences are missing
      const defaultPrefs = {
        specialty: null,
        sports: [],
        social_style: [],
        culture_interests: [],
        lifestyle: [],
        availability_slots: [],
      };
      const effectivePrefs = userPrefs || defaultPrefs;

      // Collect all interests from group members
      const allInterests: string[] = [];
      const specialties: string[] = [];
      const cities: string[] = [];
      const neighborhoods: string[] = [];
      const allAvailability: string[] = [];

      group.members.forEach((member) => {
        if (member.preferences) {
          if (member.preferences.sports) allInterests.push(...(member.preferences.sports || []));
          if (member.preferences.social_style) allInterests.push(...(member.preferences.social_style || []));
          if (member.preferences.culture_interests) allInterests.push(...(member.preferences.culture_interests || []));
          if (member.preferences.lifestyle) allInterests.push(...(member.preferences.lifestyle || []));
          if (member.preferences.specialty) specialties.push(member.preferences.specialty);
          if (member.preferences.availability_slots) allAvailability.push(...(member.preferences.availability_slots || []));
        }
        if (member.profile?.city) cities.push(member.profile.city);
        if (member.profile?.neighborhood) neighborhoods.push(member.profile.neighborhood);
      });

      // Find shared interests with current user
      const userInterests = [
        ...(effectivePrefs.sports || []),
        ...(effectivePrefs.social_style || []),
        ...(effectivePrefs.culture_interests || []),
        ...(effectivePrefs.lifestyle || []),
      ];
      const sharedInterests = userInterests.filter((interest) => allInterests.includes(interest));
      const uniqueSharedInterests = Array.from(new Set(sharedInterests)).slice(0, 5);

      // Determine specialty match
      let specialtyMatch: { type: 'same' | 'related' | 'different'; value: string } = {
        type: 'different',
        value: 'Various',
      };
      if (effectivePrefs.specialty) {
        const memberSpecialties = Array.from(new Set(specialties.filter(s => s)));
        if (memberSpecialties.includes(effectivePrefs.specialty)) {
          specialtyMatch = { type: 'same', value: effectivePrefs.specialty };
        } else if (memberSpecialties.length === 1) {
          specialtyMatch = { type: 'related', value: memberSpecialties[0] };
        } else if (memberSpecialties.length > 0) {
          specialtyMatch = { type: 'related', value: `${memberSpecialties.length} specialties` };
        }
      } else if (specialties.length > 0) {
        const memberSpecialties = Array.from(new Set(specialties.filter(s => s)));
        if (memberSpecialties.length === 1) {
          specialtyMatch = { type: 'related', value: memberSpecialties[0] };
        } else if (memberSpecialties.length > 0) {
          specialtyMatch = { type: 'related', value: `${memberSpecialties.length} specialties` };
        }
      }

      // Determine location match
      const uniqueCities = Array.from(new Set(cities.filter(c => c)));
      const uniqueNeighborhoods = Array.from(new Set(neighborhoods.filter(n => n)));
      const locationMatch = {
        city: uniqueCities[0] || userProfile?.city || "Unknown",
        sameNeighborhood: userProfile?.neighborhood ? uniqueNeighborhoods.includes(userProfile.neighborhood) : false,
        neighborhood: userProfile?.neighborhood || uniqueNeighborhoods[0] || undefined,
      };

      // Find shared availability
      const userAvailability = effectivePrefs.availability_slots || [];
      const sharedAvailability = userAvailability.filter((slot) => allAvailability.includes(slot));
      const uniqueSharedAvailability = Array.from(new Set(sharedAvailability));

      const details: MatchDetails = {
        sharedInterests: uniqueSharedInterests,
        specialtyMatch,
        locationMatch,
        sharedAvailability: uniqueSharedAvailability,
      };
      
      setMatchDetails(details);
      
      // Also update the group in the list with these details
      setGroups(prevGroups => 
        prevGroups.map(g => 
          g.id === group.id ? { ...g, matchDetails: details } : g
        )
      );
    } catch (error) {
      console.error("Error fetching match details:", error);
      setMatchDetails(null);
      toast({
        title: "Error",
        description: "Failed to load match details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-32 rounded-2xl mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Your Matches</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with physicians who share your interests
          </p>
        </div>

        {/* Countdown Section */}
        <div className="mb-8">
          <MatchCountdown />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="your-groups" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-1 mb-6">
            <TabsTrigger value="your-groups">
              <Users className="h-4 w-4 mr-2" />
              Your Groups
            </TabsTrigger>
          </TabsList>

          {/* Your Groups Tab */}
          <TabsContent value="your-groups" className="space-y-6">
          {/* Best Match Highlight */}
          {groups.length > 0 && groups[0].average_score && groups[0].average_score >= 70 && (
            <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl overflow-hidden shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-xl font-bold text-foreground">
                          Best Match Group
                        </h3>
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          {Math.round(groups[0].average_score)}% Match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatGroupName(groups[0])} • {getGroupTypeLabel(groups[0])}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => startGroupChat(groups[0])}
                    className="bg-gradient-gold hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {groups.length === 0 ? (
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">No groups yet</h3>
                {isProfileComplete ? (
                  <>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      Groups are formed every Thursday at 4 PM. Your profile is complete and you'll be included in the next matching round!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Profile complete - You're all set!</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      Groups are formed every Thursday. Complete your profile and preferences to be included in the next matching round!
                    </p>
                    <Button onClick={() => navigate("/onboarding")}>
                      Complete Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            groups.map((group, index) => {
              // Get unique city and neighborhood from members
              const cities = Array.from(new Set(group.members.map(m => m.profile.city).filter(Boolean)));
              const neighborhoods = Array.from(new Set(group.members.map(m => m.profile.neighborhood).filter(Boolean)));
              const city = cities[0] || "Unknown";
              const area = neighborhoods[0] || null;
              const isThisWeek = getWeekLabel(group.match_week) === "This Week";

              return (
                <Card 
                  key={group.id} 
                  className={`border-0 shadow-lg shadow-foreground/5 rounded-2xl overflow-hidden ${
                    index === 0 && group.average_score && group.average_score >= 70 
                      ? 'ring-2 ring-yellow-500/50' 
                      : ''
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Group Header */}
                    <div className="px-5 py-4 border-b border-border/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-display font-semibold text-foreground">
                                {formatGroupName(group)}
                              </h3>
                              {index === 0 && group.average_score && group.average_score >= 70 && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Best Match
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {city}
                                {area && ` • ${area}`}
                              </Badge>
                              {isThisWeek && (
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                  This Week
                                </Badge>
                              )}
                              {group.gender_composition && (
                                <Badge variant="outline" className="text-xs">
                                  {getGroupTypeLabel(group)}
                                </Badge>
                              )}
                              {group.is_partial_group && (
                                <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                                  <Info className="h-3 w-3 mr-1" />
                                  Smaller Group
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Partial Group Notice */}
                    {group.is_partial_group && (
                      <div className="px-5 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
                        <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                          <Info className="h-4 w-4" />
                          <span>
                            Smaller group this week ({group.members.length} members). We'll add more members in the next matching round!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Members Row */}
                    <div className="px-5 py-4 border-b border-border/50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {group.members.map((member) => {
                          const initials = member.profile.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "U";

                          return (
                            <div 
                              key={member.user_id}
                              className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                              onClick={() => navigate(`/u/${member.user_id}`)}
                            >
                              <Avatar className="h-14 w-14 mb-2 ring-2 ring-background shadow-lg">
                                <AvatarImage src={member.profile.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-gold text-primary-foreground font-display font-bold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs text-center truncate w-full">
                                {member.profile.full_name || "Anonymous"}
                              </span>
                              {member.preferences?.specialty && (
                                <span className="text-xs text-muted-foreground truncate w-full text-center mt-0.5">
                                  {member.preferences.specialty}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Why this match & Suggested meetup times */}
                    <div className="px-5 py-4 space-y-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchMatchDetails(group)}
                        className="w-full"
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Why this match?
                      </Button>

                      {/* Suggested meetup times */}
                      {group.matchDetails && group.matchDetails.sharedAvailability.length > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Suggested meetup times</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {group.matchDetails.sharedAvailability.slice(0, 3).map((slot) => (
                              <Badge key={slot} variant="secondary" className="px-3 py-1">
                                {formatSlot(slot)}
                              </Badge>
                            ))}
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            Create Poll
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-5 py-4 border-t border-border/50 flex gap-3">
                      <Button 
                        onClick={() => startGroupChat(group)}
                        className="flex-1 bg-gradient-gold hover:opacity-90"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Group Chat
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Plan Meetup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          </TabsContent>

        </Tabs>

        {/* Why this match Modal */}
        <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                Why this match?
              </DialogTitle>
              <DialogDescription>
                Understanding how this group was matched based on your preferences
              </DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="py-8 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (() => {
              const details = matchDetails || selectedGroup?.matchDetails;
              if (!details) {
                return (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">Unable to load match details</p>
                  </div>
                );
              }
              return (
              <div className="space-y-6 py-4">
                {/* Interests Overlap */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Interests Alignment</h4>
                      <p className="text-xs text-muted-foreground">Highest weight in matching</p>
                    </div>
                  </div>
                  {details.sharedInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pl-14">
                      {details.sharedInterests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="px-3 py-1.5">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-14">No shared interests found</p>
                  )}
                </div>

                {/* Specialty */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Specialty</h4>
                      <p className="text-xs text-muted-foreground">Medical specialty similarity</p>
                    </div>
                  </div>
                  <div className="pl-14">
                    <Badge 
                      variant={details.specialtyMatch.type === 'same' ? 'default' : 'secondary'}
                      className="px-3 py-1.5"
                    >
                      {details.specialtyMatch.type === 'same' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {details.specialtyMatch.value}
                      {details.specialtyMatch.type === 'same' && ' (Same)'}
                      {details.specialtyMatch.type === 'related' && ' (Related)'}
                    </Badge>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Location</h4>
                      <p className="text-xs text-muted-foreground">Same city required; neighborhood/area matters</p>
                    </div>
                  </div>
                  <div className="pl-14">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1.5">
                        {details.locationMatch.city}
                      </Badge>
                      {details.locationMatch.neighborhood && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Badge 
                            variant={details.locationMatch.sameNeighborhood ? 'default' : 'outline'}
                            className="px-3 py-1.5"
                          >
                            {details.locationMatch.neighborhood}
                            {details.locationMatch.sameNeighborhood && (
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Availability Overlap</h4>
                      <p className="text-xs text-muted-foreground">Fri–Sun time slots</p>
                    </div>
                  </div>
                  {details.sharedAvailability.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pl-14">
                      {details.sharedAvailability.map((slot) => (
                        <Badge key={slot} variant="secondary" className="px-3 py-1.5">
                          {formatSlot(slot)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-14">No overlapping availability found</p>
                  )}
                </div>
              </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Evaluation Survey */}
        {surveyGroupId && surveyMatchWeek && (
          <GroupEvaluationSurvey
            groupId={surveyGroupId}
            matchWeek={surveyMatchWeek}
            open={showSurvey}
            onOpenChange={setShowSurvey}
          />
        )}
      </main>
    </DashboardLayout>
  );
};

export default Matches;
