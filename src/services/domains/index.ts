/**
 * Domain Services - Clean imports for domain-based architecture
 *
 * Usage:
 *   import { getProfile, updateProfile } from '@/services/domains/profiles';
 *   import { sendMessage, getConversations } from '@/services/domains/messaging';
 *   import { getMatches } from '@/services/domains/matches';
 *
 * This structure follows Domain-Driven Design principles:
 * - Services are grouped by business domain
 * - Each domain is self-contained
 * - Clear boundaries between domains
 */

export * as auth from './auth';
export * as profiles from './profiles';
export * as matches from './matches';
export * as messaging from './messaging';
