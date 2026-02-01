/**
 * Custom hook for fetching and managing user matches
 * Following Single Responsibility Principle - handles match data fetching logic
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fetchUserGroups, checkProfileCompletion, shouldShowEvaluationSurvey } from '@/services/matchService';
import { MatchGroup } from '@/types/match';

export const useMatches = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyGroupId, setSurveyGroupId] = useState<string>("");
  const [surveyMatchWeek, setSurveyMatchWeek] = useState<string>("");

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch groups and profile completion status in parallel
      const [groupsData, profileComplete] = await Promise.all([
        fetchUserGroups(user.id),
        checkProfileCompletion(user.id),
      ]);

      setGroups(groupsData);
      setIsProfileComplete(profileComplete);

      // Check if survey should be shown for the best group
      if (groupsData.length > 0) {
        const bestGroup = groupsData[0];
        const shouldShow = await shouldShowEvaluationSurvey(user.id, bestGroup);
        
        if (shouldShow) {
          setSurveyGroupId(bestGroup.id);
          setSurveyMatchWeek(bestGroup.match_week);
          setShowSurvey(true);
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    isProfileComplete,
    showSurvey,
    surveyGroupId,
    surveyMatchWeek,
    setShowSurvey,
    refetch: fetchGroups,
  };
};
