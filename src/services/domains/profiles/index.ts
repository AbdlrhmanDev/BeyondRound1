/**
 * Profiles Domain - User profile management
 * Re-exports profile-related services for clean imports
 */

// Re-export from existing services
export * from '../../profileService';
export * from '../../settingsService';

// Types
export type { Profile, PublicProfile } from '../../profileService';
