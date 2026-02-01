/**
 * Place Service - Handles place suggestions operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface PlaceSuggestion {
  name: string;
  type: string;
  description: string;
  vibe: string;
  priceRange: string;
  goodFor: string[];
}

/**
 * Gets user's city from profile
 */
export const getUserCity = async (userId: string): Promise<string | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getUserCity:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("city")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user city:", error);
      return null;
    }

    return data?.city || null;
  } catch (error) {
    console.error("Error fetching user city:", error);
    return null;
  }
};

/**
 * Generates place suggestions for a city
 */
export const generatePlaceSuggestions = async (
  city: string,
  accessToken?: string
): Promise<PlaceSuggestion[]> => {
  try {
    // Input validation
    if (!city?.trim()) {
      console.error("Invalid city for generatePlaceSuggestions:", city);
      return [];
    }

    const headers: Record<string, string> = {};
    if (accessToken?.trim()) {
      headers.Authorization = `Bearer ${accessToken.trim()}`;
    }

    const response = await supabase.functions.invoke("generate-place-suggestions", {
      body: { city: city.trim() },
      headers,
    });

    if (response.error) {
      console.error("Error generating place suggestions:", response.error);
      return [];
    }

    // Handle structured response with suggestions array
    if (response.data?.suggestions && Array.isArray(response.data.suggestions)) {
      return response.data.suggestions.map((item: any) => ({
        name: item.name || '',
        type: item.type || 'venue',
        description: item.description || '',
        vibe: item.vibe || '',
        priceRange: item.priceRange || '$$',
        goodFor: item.goodFor || [],
      })).filter((item: PlaceSuggestion) => item.name && item.type);
    }

    console.warn("Invalid response format from generatePlaceSuggestions:", response.data);
    return [];
  } catch (error) {
    console.error("Error generating place suggestions:", error);
    return [];
  }
};
