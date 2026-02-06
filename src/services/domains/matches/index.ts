/**
 * Matches Domain - Matching and group management
 * Re-exports match-related services for clean imports
 */

// Re-export from existing services
export * from '../../matchService';
export * from '../../matchDetailsService';
export * from '../../evaluationService';

// Future: When refactoring, consolidate:
// - Group creation
// - Match algorithms
// - Compatibility scoring
