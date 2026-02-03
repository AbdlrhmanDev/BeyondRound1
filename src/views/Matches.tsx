'use client';

import { useState, useCallback, lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { useMatchDetails } from "@/hooks/useMatchDetails";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  RefreshCw,
  Info,
  Calendar,
  Stethoscope,
  Heart,
  Clock,
  CheckCircle2,
  Hourglass,
  ChevronRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MatchGroup, MatchDetails } from "@/types/match";
import { formatSlot, getGroupTypeLabel, getWeekLabel, formatGroupName } from "@/utils/groupUtils";
import { getOrCreateGroupConversation } from "@/services/conversationService";

// Lazy load heavy component that's conditionally rendered
const GroupEvaluationSurvey = lazy(() => import("@/components/GroupEvaluationSurvey"));


const Matches = () => {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const {
    groups,
    loading,
    isProfileComplete,
    showSurvey,
    surveyGroupId,
    surveyMatchWeek,
    setShowSurvey,
  } = useMatches();
  const { fetchDetails, loading: loadingDetails, error: detailsError } = useMatchDetails();
  const [selectedGroup, setSelectedGroup] = useState<MatchGroup | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);

  // Filter to show only the highest scoring group
  const highestScoreGroup = groups.length > 0 && groups[0].average_score !== null && groups[0].average_score !== undefined
    ? [groups[0]] // Show only the first group (highest score)
    : groups.length > 0 
      ? [groups[0]] // If no score, still show the first group
      : [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const startGroupChat = useCallback(async (group: MatchGroup) => {
    try {
      const conversationId = group.conversation_id || await getOrCreateGroupConversation(group.id);
      navigate(`/group-chat/${conversationId}`);
    } catch (error) {
      console.error("Error starting group chat:", error);
      toast({
        title: t("matches.toastErrorStartChat"),
        description: t("matches.toastErrorStartChatDesc"),
        variant: "destructive",
      });
    }
  }, [navigate, toast, t]);

  const handleFetchMatchDetails = useCallback(async (group: MatchGroup) => {
    setSelectedGroup(group);
    setMatchDetails(null);
    
    const details = await fetchDetails(group);
    if (details) {
      setMatchDetails(details);
      // Update group in list with details
      // Note: This would require updating the groups state, but since we're using a hook,
      // we might need to refetch or handle this differently
    } else if (detailsError) {
      toast({
        title: t("matches.toastErrorStartChat"),
        description: detailsError,
        variant: "destructive",
      });
    }
  }, [fetchDetails, detailsError, toast, t]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Skeleton className="h-9 sm:h-10 w-36 sm:w-48 mb-4 sm:mb-6 rounded-xl" />
          <Skeleton className="h-24 sm:h-32 rounded-xl sm:rounded-2xl mb-4 sm:mb-6" />
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-32 sm:h-40 rounded-xl sm:rounded-2xl" />
            <Skeleton className="h-32 sm:h-40 rounded-xl sm:rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold truncate">{t("dashboard.yourMatches")}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t("dashboard.physiciansShareInterests")}
              </p>
            </div>
            {highestScoreGroup.length > 0 && highestScoreGroup[0].average_score !== null && highestScoreGroup[0].average_score !== undefined && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-md">
                <Crown className="h-5 w-5 text-yellow-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">{t("matches.bestScore")}</span>
                  <span className="font-display font-bold text-xl text-foreground">
                    {Math.round(highestScoreGroup[0].average_score)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Countdown Section */}
        <div className="mb-6">
          <MatchCountdown />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="your-groups" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-1 mb-5">
            <TabsTrigger value="your-groups">
              <Users className="h-4 w-4 mr-2" />
              {t("matches.yourGroups")}
            </TabsTrigger>
          </TabsList>

          {/* Your Groups Tab */}
          <TabsContent value="your-groups" className="space-y-5">
          {/* Best Score Banner */}
          {highestScoreGroup.length > 0 && highestScoreGroup[0].average_score !== null && highestScoreGroup[0].average_score !== undefined && (
            <Card className="border-2 border-yellow-500/60 bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-2 sm:ring-4 ring-yellow-500/20 shadow-[0_12px_32px_rgba(251,146,60,0.25)]">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5 flex-wrap">
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-2xl ring-2 sm:ring-4 ring-yellow-500/30 shrink-0">
                      <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-display font-black text-lg sm:text-2xl text-foreground tracking-tight">{t("matches.bestMatchScore")}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium">{t("matches.yourHighestCompatibilityGroup")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-white border-0 text-2xl sm:text-4xl font-black px-4 py-2 sm:px-8 sm:py-4 shadow-2xl ring-2 sm:ring-4 ring-yellow-500/30">
                      {Math.round(highestScoreGroup[0].average_score)}%
                    </Badge>
                    <Sparkles className="h-7 w-7 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {highestScoreGroup.length === 0 ? (
            <Card className="border-2 border-border/60 shadow-lg rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{t("matches.noGroupsYet")}</h3>
                {isProfileComplete ? (
                  <>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      {t("matches.groupsFormedThursdayComplete")}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{t("matches.profileCompleteAllSet")}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      {t("matches.groupsFormedThursdayIncomplete")}
                    </p>
                    <Button onClick={() => navigate("/onboarding")}>
                      {t("dashboard.completeProfile")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            highestScoreGroup.map((group, index) => {
              // Get unique city and neighborhood from members
              const cities = Array.from(new Set(group.members.map(m => m.profile.city).filter(Boolean)));
              const neighborhoods = Array.from(new Set(group.members.map(m => m.profile.neighborhood).filter(Boolean)));
              const city = cities[0] || null;
              const area = neighborhoods[0] || null;
              const isThisWeek = getWeekLabel(group.match_week) === "This Week";
              const hasScore = group.average_score !== null && group.average_score !== undefined;
              const scoreValue = hasScore ? Math.round(group.average_score) : null;
              const memberCount = group.member_count ?? group.members.length + 1;
              const MIN_GROUP_SIZE = 3;
              const isGroupComplete = memberCount >= MIN_GROUP_SIZE;

              return (
                <div key={group.id} className="relative max-w-3xl mx-auto group">
                  {/* Premium glow effect for primary focus */}
                  <div className={`absolute -inset-[2px] rounded-2xl opacity-60 blur-2xl -z-10 transition-opacity duration-500 group-hover:opacity-80 ${
                    hasScore
                      ? 'bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-yellow-500/20'
                      : 'bg-gradient-to-br from-primary/20 via-primary/12 to-primary/20'
                  }`}></div>
                  
                  <Card 
                    className={`relative border-0 rounded-2xl overflow-hidden transition-all duration-500 ${
                      hasScore
                        ? 'bg-gradient-to-br from-yellow-50/80 via-card to-orange-50/60 dark:from-yellow-500/8 dark:via-card dark:to-orange-500/8 ring-1 ring-yellow-500/20 shadow-[0_0_0_0.5px_rgba(251,146,60,0.15),0_2px_4px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08),0_16px_48px_rgba(251,146,60,0.12)] dark:shadow-[0_0_0_0.5px_rgba(251,146,60,0.2),0_2px_4px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.16),0_8px_24px_rgba(0,0,0,0.2),0_16px_48px_rgba(251,146,60,0.15)] hover:shadow-[0_0_0_0.5px_rgba(251,146,60,0.2),0_4px_8px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.08),0_16px_32px_rgba(0,0,0,0.12),0_24px_64px_rgba(251,146,60,0.18)] dark:hover:shadow-[0_0_0_0.5px_rgba(251,146,60,0.25),0_4px_8px_rgba(0,0,0,0.16),0_8px_16px_rgba(0,0,0,0.2),0_16px_32px_rgba(0,0,0,0.24),0_24px_64px_rgba(251,146,60,0.22)]'
                        : 'bg-card ring-1 ring-primary/10 shadow-[0_0_0_0.5px_rgba(255,152,0,0.1),0_2px_4px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08),0_16px_48px_rgba(255,152,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,152,0,0.15),0_2px_4px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.16),0_8px_24px_rgba(0,0,0,0.2),0_16px_48px_rgba(255,152,0,0.12)] hover:shadow-[0_0_0_0.5px_rgba(255,152,0,0.15),0_4px_8px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.08),0_16px_32px_rgba(0,0,0,0.12),0_24px_64px_rgba(255,152,0,0.15)] dark:hover:shadow-[0_0_0_0.5px_rgba(255,152,0,0.2),0_4px_8px_rgba(0,0,0,0.16),0_8px_16px_rgba(0,0,0,0.2),0_16px_32px_rgba(0,0,0,0.24),0_24px_64px_rgba(255,152,0,0.18)]'
                    } hover:-translate-y-1`}
                  >
                  {/* Best Score Ribbon */}
                  {hasScore && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-[0_2px_4px_rgba(251,146,60,0.3)] z-10">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Crown className="h-3 w-3 drop-shadow-lg" />
                        <span className="text-xs tracking-wider uppercase">{t("matches.bestScore")}</span>
                        <span className="text-base font-black drop-shadow-lg">{scoreValue}%</span>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-0">
                    {/* Group Header */}
                    <div className={`px-3 py-3 border-b border-border/30 bg-gradient-to-br from-background via-secondary/20 to-background ${hasScore ? 'pt-8' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105 flex-shrink-0 ${
                            hasScore
                              ? 'bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-500 shadow-yellow-500/40 ring-2 ring-yellow-500/30' 
                              : 'bg-gradient-to-br from-primary to-orange-500 shadow-primary/30 ring-2 ring-primary/20'
                          }`}>
                            <Users className="h-5 w-5 text-white drop-shadow-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-display font-bold text-base text-foreground tracking-tight">
                                {formatGroupName(group)}
                              </h3>
                              {hasScore && (
                                <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold ring-2 ring-yellow-500/30">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {t("matches.percentMatch", { percent: scoreValue })}
                                </Badge>
                              )}
                              {!hasScore && (
                                <Badge variant="secondary" className="text-xs font-semibold px-2 py-1">
                                  {t("matches.yourGroup")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {city && (
                                <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {city}
                                  {area && ` • ${area}`}
                                </Badge>
                              )}
                              {isThisWeek && (
                                <Badge variant="secondary" className="text-xs bg-primary/15 text-primary border-primary/30 px-2 py-0.5 font-semibold">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {t("matches.thisWeek")}
                                </Badge>
                              )}
                              {group.gender_composition && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border">
                                  {getGroupTypeLabel(group) === "All Male" ? t("matches.allMale") : getGroupTypeLabel(group) === "All Female" ? t("matches.allFemale") : getGroupTypeLabel(group)}
                                </Badge>
                              )}
                              {group.is_partial_group && (
                                <Badge variant="secondary" className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 px-2 py-0.5">
                                  <Info className="h-3 w-3 mr-1" />
                                  {t("matches.smallerGroup")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Partial Group Notice */}
                    {group.is_partial_group && (
                      <div className="px-3 py-1.5 bg-yellow-500/10 dark:bg-yellow-500/15 border-b border-yellow-500/20 dark:border-yellow-500/30">
                        <div className="flex items-center gap-1.5 text-xs text-yellow-700 dark:text-yellow-400">
                          <Info className="h-3 w-3" />
                          <span>
                            {t("matches.smallerGroupThisWeek", { count: memberCount })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Members Row */}
                    <div className="px-3 py-3 border-b border-border/30 bg-gradient-to-b from-background to-secondary/10">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-semibold text-foreground">
                            {t("matches.groupProgress")}
                          </h4>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {t("matches.membersJoined", { current: memberCount, total: MIN_GROUP_SIZE })}
                          </span>
                        </div>
                        <Progress 
                          value={(memberCount / MIN_GROUP_SIZE) * 100} 
                          className="h-2 mb-2"
                        />
                        {!isGroupComplete && (
                          <p className="text-xs font-medium text-primary mt-1">
                            {t("matches.morePhysiciansNeeded", { count: MIN_GROUP_SIZE - memberCount, physician: MIN_GROUP_SIZE - memberCount === 1 ? t("matches.physician") : t("matches.physicians") })}
                          </p>
                        )}
                        {isGroupComplete && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {hasScore ? t("matches.matchedWithCompatibility", { percent: scoreValue }) : t("matches.yourMatchedGroupMembers")}
                          </p>
                        )}
                      </div>
                      
                      {group.members.length === 0 ? (
                        // Waiting List State
                        <div className="text-center py-4 px-3">
                          <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br from-primary/10 via-orange-500/10 to-primary/10 dark:from-primary/20 dark:via-orange-500/20 dark:to-primary/20 flex items-center justify-center border border-primary/20 dark:border-primary/30 shadow-md">
                            <Hourglass className="h-6 w-6 text-primary animate-pulse" />
                          </div>
                          <h4 className="font-display text-sm font-semibold text-foreground mb-1">
                            {t("dashboard.onWaitingList")}
                          </h4>
                          <p className="text-muted-foreground text-xs max-w-md mx-auto mb-2 leading-relaxed">
                            {t("dashboard.groupBeingFormed")}
                          </p>
                          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                            <Clock className="h-3 w-3 mr-1" />
                            {t("matches.morePhysiciansNeeded", { count: MIN_GROUP_SIZE - memberCount, physician: MIN_GROUP_SIZE - memberCount === 1 ? t("matches.physician") : t("matches.physicians") })}
                          </Badge>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.members.map((member) => {
                            const fullName = member.profile.full_name || "Anonymous";
                            const initials = fullName !== "Anonymous"
                              ? fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "?";

                            return (
                              <div 
                                key={member.user_id}
                                className="flex flex-col items-center p-2 rounded-lg bg-card hover:bg-gradient-to-br hover:from-primary/5 hover:to-orange-500/5 border border-border/60 hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:shadow-md hover:scale-105 shadow-sm"
                                onClick={() => navigate(`/u/${member.user_id}`)}
                              >
                                <Avatar className="h-12 w-12 mb-1 ring-1 ring-background shadow-md group-hover:ring-primary/40 transition-all duration-300">
                                  <AvatarImage src={member.profile.avatar_url || undefined} alt={fullName} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary via-orange-500 to-primary text-white font-display font-bold text-xs shadow-sm">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-xs text-center truncate w-full text-foreground mb-0.5">
                                  {fullName}
                                </span>
                                {member.preferences?.specialty ? (
                                  <span className="text-xs text-muted-foreground truncate w-full text-center font-medium px-1.5 py-0.5 rounded bg-secondary/60">
                                    {member.preferences.specialty}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground/60 italic">
                                    {t("matches.noSpecialtyListed")}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Why this match - Now visible by default */}
                    {group.matchDetails && (
                      <div className={`px-3 py-3 border-b border-border/30 ${hasScore ? 'bg-gradient-to-br from-yellow-50/50 via-card to-orange-50/30 dark:from-yellow-500/5 dark:via-card dark:to-orange-500/5' : 'bg-background'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-semibold text-foreground">{t("matches.matchedBasedOn")}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-6">
                          {group.matchDetails.sharedInterests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="px-2 py-0.5 text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {group.matchDetails.specialtyMatch && (
                            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                              <Stethoscope className="h-3 w-3 mr-1 inline" />
                              {group.matchDetails.specialtyMatch.value}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFetchMatchDetails(group)}
                          className="mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t("matches.viewFullDetails")}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Why this match button - Show if no details loaded yet */}
                    {!group.matchDetails && (
                      <div className={`px-3 py-2 ${hasScore ? 'bg-gradient-to-br from-yellow-50/50 via-card to-orange-50/30 dark:from-yellow-500/5 dark:via-card dark:to-orange-500/5' : 'bg-background'}`}>
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => handleFetchMatchDetails(group)}
                          className={`w-full h-9 font-semibold text-xs border transition-all duration-300 ${
                            hasScore 
                              ? 'border-yellow-500/40 hover:bg-yellow-500/15 hover:border-yellow-500/60' 
                              : 'hover:bg-secondary hover:border-primary/40'
                          }`}
                        >
                          <Info className="h-3 w-3 mr-1.5" />
                          {t("dashboard.whyThisMatch")}
                        </Button>
                      </div>
                    )}

                    {/* Suggested meetup times */}
                    {group.matchDetails && group.matchDetails.sharedAvailability.length > 0 && (
                      <div className={`px-3 py-2 space-y-2 border-b border-border/30 ${hasScore ? 'bg-gradient-to-br from-yellow-50/50 via-card to-orange-50/30 dark:from-yellow-500/5 dark:via-card dark:to-orange-500/5' : 'bg-background'}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{t("matches.suggestedMeetupTimes")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {group.matchDetails.sharedAvailability.slice(0, 3).map((slot) => (
                            <Badge key={slot} variant="secondary" className="px-2 py-0.5 text-xs">
                              {formatSlot(slot)}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                          <Calendar className="h-3 w-3 mr-1.5" />
                          {t("matches.createPoll")}
                        </Button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={`px-3 py-2 border-t border-border/30 flex flex-col gap-2 bg-gradient-to-r from-background via-secondary/10 to-background ${
                      hasScore ? 'from-yellow-50/30 via-background to-orange-50/20' : ''
                    }`}>
                      {!isGroupComplete && (
                        <div className="flex items-start gap-2 text-xs bg-yellow-500/10 dark:bg-yellow-500/15 border border-yellow-500/20 dark:border-yellow-500/30 rounded-lg px-3 py-2 mb-2">
                          <Info className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground mb-0.5">
                              {t("matches.groupChatUnlocksWhen", { count: MIN_GROUP_SIZE })}
                            </p>
                            <p className="text-muted-foreground">
                              {t("matches.currentlyMembersNeeded", { current: memberCount, total: MIN_GROUP_SIZE, more: MIN_GROUP_SIZE - memberCount, physician: MIN_GROUP_SIZE - memberCount === 1 ? t("matches.physician") : t("matches.physicians") })}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => startGroupChat(group)}
                          disabled={!isGroupComplete}
                          className={`flex-1 h-11 font-semibold text-sm transition-all duration-300 shadow-lg ${
                            !isGroupComplete
                              ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                              : hasScore
                              ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-600 text-white shadow-yellow-500/30 hover:shadow-yellow-500/40'
                              : 'bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 text-white shadow-primary/30 hover:shadow-primary/40'
                          }`}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {t("matches.groupChat")}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => navigate("/places")}
                          disabled={!isGroupComplete}
                          className={`h-11 px-4 font-medium text-xs border transition-all duration-300 ${
                            !isGroupComplete
                              ? 'opacity-50 cursor-not-allowed'
                              : hasScore
                              ? 'border-yellow-500/30 hover:bg-yellow-500/10 dark:hover:bg-yellow-500/15 hover:border-yellow-500/50 bg-card/50'
                              : 'border-border/50 hover:bg-secondary/50 hover:border-primary/30 bg-card/50'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {t("matches.planMeetup")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
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
                {t("dashboard.whyThisMatch")}
              </DialogTitle>
              <DialogDescription>
                {t("matches.whyMatchModalDescription")}
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
                    <p className="text-muted-foreground">{t("matches.unableToLoadMatchDetails")}</p>
                  </div>
                );
              }
              return (
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("matches.interestsAlignment")}</h4>
                      <p className="text-xs text-muted-foreground">{t("matches.highestWeightInMatching")}</p>
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
                    <p className="text-sm text-muted-foreground pl-14">{t("matches.noSharedInterestsFound")}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("dashboard.specialty")}</h4>
                      <p className="text-xs text-muted-foreground">{t("matches.medicalSpecialtySimilarity")}</p>
                    </div>
                  </div>
                  <div className="pl-14">
                    <Badge 
                      variant={details.specialtyMatch.type === 'same' ? 'default' : 'secondary'}
                      className="px-3 py-1.5"
                    >
                      {details.specialtyMatch.type === 'same' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {details.specialtyMatch.value}
                      {details.specialtyMatch.type === 'same' && ` ${t("matches.same")}`}
                      {details.specialtyMatch.type === 'related' && ` ${t("matches.related")}`}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("matches.location")}</h4>
                      <p className="text-xs text-muted-foreground">{t("matches.locationDescription")}</p>
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("matches.availabilityOverlap")}</h4>
                      <p className="text-xs text-muted-foreground">{t("matches.friSunTimeSlots")}</p>
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
                    <p className="text-sm text-muted-foreground pl-14">{t("matches.noOverlappingAvailabilityFound")}</p>
                  )}
                </div>
              </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Evaluation Survey - Lazy loaded */}
        {surveyGroupId && surveyMatchWeek && (
          <Suspense fallback={null}>
            <GroupEvaluationSurvey
              groupId={surveyGroupId}
              matchWeek={surveyMatchWeek}
              open={showSurvey}
              onOpenChange={setShowSurvey}
            />
          </Suspense>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Matches;
