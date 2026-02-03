/**
 * All interest options for the Add Interests flow.
 * Maps to onboarding_preferences fields: sports, music_preferences, movie_preferences, other_interests, goals (social_style)
 */
export interface InterestOption {
  id: string;
  label: string;
  icon: string;
  category: 'sports' | 'music' | 'movies' | 'other' | 'goals';
}

export const INTEREST_OPTIONS: InterestOption[] = [
  // Sports
  { id: 'running', label: 'Running', icon: '🏃', category: 'sports' },
  { id: 'cycling', label: 'Cycling', icon: '🚴', category: 'sports' },
  { id: 'swimming', label: 'Swimming', icon: '🏊', category: 'sports' },
  { id: 'gym', label: 'Gym/Weights', icon: '🏋️', category: 'sports' },
  { id: 'tennis', label: 'Tennis/Padel', icon: '🎾', category: 'sports' },
  { id: 'football', label: 'Football', icon: '⚽', category: 'sports' },
  { id: 'basketball', label: 'Basketball', icon: '🏀', category: 'sports' },
  { id: 'climbing', label: 'Climbing', icon: '🧗', category: 'sports' },
  { id: 'hiking', label: 'Hiking', icon: '🥾', category: 'sports' },
  { id: 'yoga', label: 'Yoga/Pilates', icon: '🧘', category: 'sports' },
  { id: 'martial_arts', label: 'Martial Arts', icon: '🥋', category: 'sports' },
  { id: 'golf', label: 'Golf', icon: '⛳', category: 'sports' },
  { id: 'skiing', label: 'Skiing/Snowboard', icon: '⛷️', category: 'sports' },
  { id: 'dancing', label: 'Dancing', icon: '💃', category: 'sports' },
  { id: 'water_sports', label: 'Water Sports', icon: '🏄', category: 'sports' },
  // Music
  { id: 'pop', label: 'Pop', icon: '🎤', category: 'music' },
  { id: 'rock', label: 'Rock', icon: '🎸', category: 'music' },
  { id: 'hiphop', label: 'Hip-Hop/Rap', icon: '🎧', category: 'music' },
  { id: 'electronic', label: 'Electronic/EDM', icon: '🎹', category: 'music' },
  { id: 'classical', label: 'Classical', icon: '🎻', category: 'music' },
  { id: 'jazz', label: 'Jazz', icon: '🎷', category: 'music' },
  { id: 'rnb', label: 'R&B/Soul', icon: '🎵', category: 'music' },
  { id: 'indie', label: 'Indie/Alt', icon: '🎶', category: 'music' },
  { id: 'latin', label: 'Latin', icon: '💃', category: 'music' },
  { id: 'world', label: 'World Music', icon: '🌍', category: 'music' },
  // Movies
  { id: 'action', label: 'Action', icon: '💥', category: 'movies' },
  { id: 'comedy', label: 'Comedy', icon: '😂', category: 'movies' },
  { id: 'drama', label: 'Drama', icon: '🎭', category: 'movies' },
  { id: 'thriller', label: 'Thriller/Horror', icon: '😱', category: 'movies' },
  { id: 'scifi', label: 'Sci-Fi/Fantasy', icon: '🚀', category: 'movies' },
  { id: 'documentary', label: 'Documentaries', icon: '📹', category: 'movies' },
  { id: 'romance', label: 'Romance', icon: '💕', category: 'movies' },
  { id: 'crime', label: 'Crime/Mystery', icon: '🔍', category: 'movies' },
  { id: 'animated', label: 'Animated', icon: '🎨', category: 'movies' },
  // Other
  { id: 'reading', label: 'Reading', icon: '📚', category: 'other' },
  { id: 'cooking', label: 'Cooking', icon: '👨‍🍳', category: 'other' },
  { id: 'photography', label: 'Photography', icon: '📸', category: 'other' },
  { id: 'travel', label: 'Travel', icon: '✈️', category: 'other' },
  { id: 'art', label: 'Art/Museums', icon: '🎨', category: 'other' },
  { id: 'board_games', label: 'Board Games', icon: '🎲', category: 'other' },
  { id: 'video_games', label: 'Video Games', icon: '🎮', category: 'other' },
  { id: 'podcasts', label: 'Podcasts', icon: '🎙️', category: 'other' },
  { id: 'wine', label: 'Wine/Beer', icon: '🍷', category: 'other' },
  { id: 'coffee', label: 'Coffee Culture', icon: '☕', category: 'other' },
  { id: 'gardening', label: 'Gardening', icon: '🌱', category: 'other' },
  { id: 'tech', label: 'Technology', icon: '💻', category: 'other' },
  { id: 'volunteering', label: 'Volunteering', icon: '🤝', category: 'other' },
  // Goals (social_style)
  { id: 'casual_friends', label: 'Casual Friends', icon: '👋', category: 'goals' },
  { id: 'close_friends', label: 'Close Friends', icon: '🤝', category: 'goals' },
  { id: 'activity_partners', label: 'Activity Partners', icon: '🎯', category: 'goals' },
  { id: 'social_group', label: 'A Social Circle', icon: '👥', category: 'goals' },
  { id: 'mentorship', label: 'Mentorship', icon: '🎓', category: 'goals' },
  { id: 'business', label: 'Business Connections', icon: '💼', category: 'goals' },
  { id: 'study_partners', label: 'Study Partners', icon: '📖', category: 'goals' },
  { id: 'travel_buddies', label: 'Travel Buddies', icon: '✈️', category: 'goals' },
];
