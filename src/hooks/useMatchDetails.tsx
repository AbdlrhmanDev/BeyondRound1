/**
 * Custom hook for fetching match details
 * Following Single Responsibility Principle
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fetchMatchDetails } from '@/services/matchDetailsService';
import { MatchGroup, MatchDetails } from '@/types/match';

export const useMatchDetails = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async (
    group: MatchGroup
  ): Promise<MatchDetails | null> => {
    if (!user) {
      setError("User not authenticated");
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const details = await fetchMatchDetails(user.id, group);
      return details;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load match details";
      setError(errorMessage);
      console.error("Error fetching match details:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchDetails,
    loading,
    error,
  };
};
