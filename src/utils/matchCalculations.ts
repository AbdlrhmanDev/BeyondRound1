/**
 * Business logic utilities for match calculations and analysis
 * Following Single Responsibility Principle - each function has one clear purpose
 */

export interface SpecialtyMatch {
  type: 'same' | 'related' | 'different';
  value: string;
}

export interface LocationMatch {
  city: string;
  sameNeighborhood: boolean;
  neighborhood?: string;
}

export interface MatchDetails {
  sharedInterests: string[];
  specialtyMatch: SpecialtyMatch;
  locationMatch: LocationMatch;
  sharedAvailability: string[];
}

/**
 * Determines specialty match type based on user and group member specialties
 */
export const calculateSpecialtyMatch = (
  userSpecialty: string | null,
  memberSpecialties: string[]
): SpecialtyMatch => {
  const uniqueSpecialties = Array.from(new Set(memberSpecialties.filter(s => s)));
  
  if (!userSpecialty) {
    if (uniqueSpecialties.length === 1) {
      return { type: 'related', value: uniqueSpecialties[0] };
    } else if (uniqueSpecialties.length > 0) {
      return { type: 'related', value: `${uniqueSpecialties.length} specialties` };
    }
    return { type: 'different', value: 'Various' };
  }

  if (uniqueSpecialties.includes(userSpecialty)) {
    return { type: 'same', value: userSpecialty };
  } else if (uniqueSpecialties.length === 1) {
    return { type: 'related', value: uniqueSpecialties[0] };
  } else if (uniqueSpecialties.length > 0) {
    return { type: 'related', value: `${uniqueSpecialties.length} specialties` };
  }

  return { type: 'different', value: 'Various' };
};

/**
 * Calculates location match information
 */
export const calculateLocationMatch = (
  userCity: string | null,
  userNeighborhood: string | null,
  memberCities: string[],
  memberNeighborhoods: string[]
): LocationMatch => {
  const uniqueCities = Array.from(new Set(memberCities.filter(c => c)));
  const uniqueNeighborhoods = Array.from(new Set(memberNeighborhoods.filter(n => n)));
  
  return {
    city: uniqueCities[0] || userCity || "Unknown",
    sameNeighborhood: userNeighborhood ? uniqueNeighborhoods.includes(userNeighborhood) : false,
    neighborhood: userNeighborhood || uniqueNeighborhoods[0] || undefined,
  };
};

/**
 * Finds shared interests between user and group members
 */
export const findSharedInterests = (
  userInterests: string[],
  memberInterests: string[]
): string[] => {
  const shared = userInterests.filter((interest) => memberInterests.includes(interest));
  return Array.from(new Set(shared)).slice(0, 5);
};

/**
 * Finds shared availability slots
 */
export const findSharedAvailability = (
  userAvailability: string[],
  memberAvailability: string[]
): string[] => {
  const shared = userAvailability.filter((slot) => memberAvailability.includes(slot));
  return Array.from(new Set(shared));
};

/**
 * Calculates complete match details for a group
 */
export const calculateMatchDetails = (
  userPreferences: {
    specialty: string | null;
    sports?: string[] | null;
    social_style?: string[] | null;
    culture_interests?: string[] | null;
    lifestyle?: string[] | null;
    availability_slots?: string[] | null;
  },
  userProfile: {
    city: string | null;
    neighborhood: string | null;
  },
  groupMembers: Array<{
    preferences?: {
      specialty: string | null;
      sports?: string[] | null;
      social_style?: string[] | null;
      culture_interests?: string[] | null;
      lifestyle?: string[] | null;
      availability_slots?: string[] | null;
    };
    profile?: {
      city: string | null;
      neighborhood: string | null;
    };
  }>
): MatchDetails => {
  // Collect all interests from group members
  const allInterests: string[] = [];
  const specialties: string[] = [];
  const cities: string[] = [];
  const neighborhoods: string[] = [];
  const allAvailability: string[] = [];

  groupMembers.forEach((member) => {
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

  // User interests
  const userInterests = [
    ...(userPreferences.sports || []),
    ...(userPreferences.social_style || []),
    ...(userPreferences.culture_interests || []),
    ...(userPreferences.lifestyle || []),
  ];

  return {
    sharedInterests: findSharedInterests(userInterests, allInterests),
    specialtyMatch: calculateSpecialtyMatch(userPreferences.specialty, specialties),
    locationMatch: calculateLocationMatch(userProfile.city, userProfile.neighborhood, cities, neighborhoods),
    sharedAvailability: findSharedAvailability(userPreferences.availability_slots || [], allAvailability),
  };
};

/**
 * Calculates average match score for a group
 */
export const calculateAverageMatchScore = (
  matchScores: Map<string, number>,
  memberIds: string[]
): number | null => {
  const scores: number[] = [];
  
  memberIds.forEach((memberId) => {
    const score = matchScores.get(memberId);
    if (score !== undefined && score !== null && score >= 0) {
      scores.push(score);
    }
  });
  
  if (scores.length === 0) {
    return null;
  }
  
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
};
