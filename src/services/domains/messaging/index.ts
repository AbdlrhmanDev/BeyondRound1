/**
 * Messaging Domain - Chat and conversation management
 * Re-exports messaging-related services for clean imports
 */

// Re-export from existing services
export * from '../../messageService';
export * from '../../conversationService';
export * from '../../notificationService';

// Future: When refactoring, add:
// - Real-time subscriptions
// - Message formatting
// - Media handling
