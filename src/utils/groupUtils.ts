/**
 * Utility functions for group-related operations
 * Following Single Responsibility Principle
 */

import { MatchGroup } from '@/types/match';

/**
 * Formats a slot string to a human-readable format
 */
export const formatSlot = (slot: string): string => {
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

/**
 * Gets a human-readable label for group type
 */
export const getGroupTypeLabel = (group: MatchGroup): string => {
  if (group.group_type === "mixed") {
    return group.gender_composition === "2F3M" ? "2♀ 3♂" : "3♀ 2♂";
  }
  return group.gender_composition === "all_female" ? "All Female" : "All Male";
};

/**
 * Gets a human-readable label for match week
 */
export const getWeekLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) return "This Week";
  if (diffDays < 14) return "Last Week";
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Determines specialty cluster from an array of specialties
 */
export const getSpecialtyCluster = (specialties: string[]): string => {
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

/**
 * Determines group theme based on member interests
 */
export const getGroupTheme = (group: MatchGroup): string => {
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

/**
 * Formats group name from match week and city
 */
export const formatGroupName = (group: MatchGroup): string => {
  const cities = Array.from(new Set(group.members.map(m => m.profile.city).filter(Boolean)));
  const city = cities[0] || null;
  
  // Format match_week date as "Nov 2"
  let dateStr = "";
  if (group.match_week) {
    try {
      const matchDate = new Date(group.match_week);
      if (!isNaN(matchDate.getTime())) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[matchDate.getMonth()];
        const day = matchDate.getDate();
        dateStr = `${month} ${day}`;
      } else {
        dateStr = "Recent";
      }
    } catch (e) {
      dateStr = "Recent";
    }
  } else {
    dateStr = "Recent";
  }
  
  // Return formatted name based on available data
  if (city) {
    return `${dateStr} - ${city}`;
  } else if (dateStr) {
    return `${dateStr} Group`;
  } else {
    return "Your Group";
  }
};
