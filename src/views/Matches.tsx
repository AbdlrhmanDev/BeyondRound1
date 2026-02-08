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
  RefreshCw,
  Info,
  Calendar,
  Stethoscope,
  Heart,
  CheckCircle2,
  Lock,
  Bell,
  ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MatchGroup, MatchDetails } from "@/types/match";
import { formatSlot, formatGroupName } from "@/utils/groupUtils";
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
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
          <Skeleton className="h-8 w-40 mb-2 rounded" />
          <Skeleton className="h-5 w-64 mb-6 rounded" />
          <Skeleton className="h-24 rounded-xl mb-5" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 pt-6 mt-10 sm:pt-8 pb-6 sm:py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">{t("dashboard.groups")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("dashboard.groupsSubtitle")}
          </p>
        </div>

        {/* Countdown Section */}
        <div className="mb-5">
          <MatchCountdown />
        </div>

        {/* Groups */}
        <div className="space-y-5">
          {highestScoreGroup.length === 0 ? (
            <Card className="rounded-xl bg-card border border-border">
              <CardContent className="py-10 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary flex items-center justify-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{t("matches.noGroupsYet")}</h3>
                {isProfileComplete ? (
                  <>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      {t("matches.groupsFormedThursdayComplete")}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{t("matches.profileCompleteAllSet")}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      {t("matches.groupsFormedThursdayIncomplete")}
                    </p>
                    <Button onClick={() => navigate("/onboarding")} className="rounded-xl shadow-sm">
                      {t("dashboard.completeProfile")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            highestScoreGroup.map((group) => {
              // Get unique city and neighborhood from members
              const cities = Array.from(new Set(group.members.map(m => m.profile.city).filter(Boolean)));
              const neighborhoods = Array.from(new Set(group.members.map(m => m.profile.neighborhood).filter(Boolean)));
              const city = cities[0] || null;
              const area = neighborhoods[0] || null;
              const memberCount = group.member_count ?? group.members.length + 1;
              const MAX_GROUP_SIZE = 4;
              const MIN_GROUP_SIZE = 3;
              const isGroupComplete = memberCount >= MIN_GROUP_SIZE;
              const progressPercent = (memberCount / MAX_GROUP_SIZE) * 100;

              return (
                <Card key={group.id} className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                  <CardContent className="p-0">
                    {/* Group Header */}
                    <div className="p-5 border-b border-border">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg text-foreground truncate tracking-tight">
                              {formatGroupName(group)}
                            </h3>
                            {city && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{city}{area && ` • ${area}`}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Status Badge */}
                        {isGroupComplete ? (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex-shrink-0 px-2.5 py-0.5">
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            {t("matches.groupReady")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground flex-shrink-0 border-none px-2.5 py-0.5">
                            <Lock className="h-3 w-3 mr-1.5" />
                            {t("matches.forming")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Progress Section - Only show when group is forming */}
                    {!isGroupComplete && (
                      <div className="px-5 py-4 bg-muted/30 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">
                            {t("matches.groupProgress")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {memberCount} {t("matches.ofFourJoined")}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2 bg-muted-foreground/20" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {t("matches.waitingForMembers", { count: MIN_GROUP_SIZE - memberCount > 0 ? MIN_GROUP_SIZE - memberCount : 1 })}
                        </p>
                      </div>
                    )}

                    {/* Members */}
                    <div className="p-5 border-b border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-foreground">
                          {t("matches.groupMembers")}
                        </h4>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {memberCount} {t("matches.members")}
                        </span>
                      </div>

                      {group.members.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("matches.membersWillAppear")}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {group.members.map((member) => {
                            const fullName = member.profile.full_name || "Anonymous";
                            const initials = fullName !== "Anonymous"
                              ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                              : "?";

                            return (
                              <div
                                key={member.user_id}
                                className="flex flex-col items-center p-3 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                                onClick={() => navigate(`/u/${member.user_id}`)}
                              >
                                <Avatar className="h-12 w-12 mb-2 ring-2 ring-background">
                                  <AvatarImage src={member.profile.avatar_url || undefined} alt={fullName} />
                                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-xs text-center truncate w-full text-foreground">
                                  {fullName}
                                </span>
                                {member.preferences?.specialty && (
                                  <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-0.5">
                                    {member.preferences.specialty}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Shared interests that shaped this group */}
                    {group.matchDetails && (
                      <div className="px-5 py-3 bg-muted/10 border-b border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("dashboard.interestsShapedGroup")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.matchDetails.sharedInterests.slice(0, 3).map((interest) => (
                            <span key={interest} className="text-xs font-medium text-foreground bg-background border border-border px-2 py-0.5 rounded-md">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shared interests context link */}
                    <div className="px-5 py-3.5 border-t border-border/40 group/context cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleFetchMatchDetails(group)}>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover/context:text-foreground transition-colors">
                        <Info className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">
                          {t("dashboard.viewGroupContext", "View what shaped this group")}
                        </span>
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-5 bg-muted/10">
                      {isGroupComplete ? (
                        /* Group is ready - show Enter Group button */
                        <Button
                          onClick={() => startGroupChat(group)}
                          className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-all active:scale-[0.98]"
                        >
                          <MessageCircle className="h-5 w-5 mr-2" />
                          {t("dashboard.enterGroup")}
                        </Button>
                      ) : (
                        /* Group is forming - show locked state */
                        <div className="space-y-3">
                          <Button
                            disabled
                            className="w-full h-12 bg-muted text-muted-foreground cursor-not-allowed rounded-xl"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            {t("matches.groupLockedUntilComplete")}
                          </Button>
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Bell className="h-3.5 w-3.5" />
                            <span>{t("matches.notifiedWhenReady")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Group context Modal */}
        <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-0 overflow-hidden border-none gap-0">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {t("dashboard.whatShapedThisGroup")}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  {t("matches.groupContextModalDescription")}
                </DialogDescription>
              </DialogHeader>
            </div>

            {loadingDetails ? (
              <div className="py-12 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/30" />
              </div>
            ) : (() => {
              const details = matchDetails || selectedGroup?.matchDetails;
              if (!details) {
                return (
                  <div className="py-12 text-center px-6">
                    <p className="text-muted-foreground">{t("matches.unableToLoadMatchDetails")}</p>
                  </div>
                );
              }
              return (
                <div className="p-6 space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{t("matches.interestsAlignment")}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("matches.highestWeightInMatching")}</p>

                        {details.sharedInterests.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {details.sharedInterests.map((interest) => (
                              <Badge key={interest} variant="secondary" className="px-2.5 py-1 text-xs font-normal bg-muted text-foreground hover:bg-muted/80">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">{t("matches.noSharedInterestsFound")}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope className="h-5 w-5 text-primary/70" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{t("dashboard.specialty")}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("matches.medicalSpecialtySimilarity")}</p>

                        <div className="mt-3">
                          <Badge
                            variant={details.specialtyMatch.type === 'same' ? 'default' : 'secondary'}
                            className={`px-2.5 py-1 text-xs font-normal ${details.specialtyMatch.type === 'same' ? 'bg-primary/10 text-primary hover:bg-primary/20 shadow-none' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                          >
                            {details.specialtyMatch.type === 'same' && <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                            {details.specialtyMatch.value}
                            {details.specialtyMatch.type === 'same' && ` ${t("matches.same")}`}
                            {details.specialtyMatch.type === 'related' && ` ${t("matches.related")}`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-5 w-5 text-primary/70" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{t("matches.location")}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("matches.locationDescription")}</p>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="secondary" className="px-2.5 py-1 text-xs font-normal bg-muted text-foreground hover:bg-muted/80">
                            {details.locationMatch.city}
                          </Badge>
                          {details.locationMatch.neighborhood && (
                            <>
                              <span className="text-muted-foreground text-[10px]">•</span>
                              <Badge
                                variant={details.locationMatch.sameNeighborhood ? 'default' : 'outline'}
                                className={`px-2.5 py-1 text-xs font-normal ${details.locationMatch.sameNeighborhood ? 'bg-primary/10 text-primary border-transparent' : 'border-border text-muted-foreground'}`}
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
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="h-5 w-5 text-primary/70" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{t("matches.availabilityOverlap")}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("matches.friSunTimeSlots")}</p>

                        {details.sharedAvailability.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {details.sharedAvailability.map((slot) => (
                              <Badge key={slot} variant="secondary" className="px-2.5 py-1 text-xs font-normal bg-muted text-foreground hover:bg-muted/80">
                                {formatSlot(slot)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">{t("matches.noOverlappingAvailabilityFound")}</p>
                        )}
                      </div>
                    </div>
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
