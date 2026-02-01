/**
 * Type definitions for match-related entities
 * Centralized type definitions following Interface Segregation Principle
 */

export interface GroupMember {
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

export interface MatchDetails {
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

export interface MatchGroup {
  id: string;
  name: string | null;
  group_type: string;
  gender_composition: string | null;
  status: string;
  match_week: string;
  created_at: string;
  members: GroupMember[];
  member_count?: number; // Total members including current user
  conversation_id?: string;
  average_score?: number | null;
  matchDetails?: MatchDetails;
  is_partial_group?: boolean;
}
