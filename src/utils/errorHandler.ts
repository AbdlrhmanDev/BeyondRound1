/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Logs errors with context (only in development)
 */
export const logError = (error: unknown, context?: string): void => {
  if (import.meta.env.DEV) {
    const contextMsg = context ? `[${context}]` : '';
    console.error(`${contextMsg}`, error);
  }
  // In production, you can send to error tracking service (Sentry, etc.)
  // if (import.meta.env.PROD) {
  //   errorTrackingService.captureException(error, { context });
  // }
};

/**
 * Converts unknown error to AppError
 */
export const normalizeError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: 'code' in error ? String(error.code) : undefined,
      statusCode: 'statusCode' in error ? Number(error.statusCode) : undefined,
      details: error,
    };
  }

  return {
    message: 'An unexpected error occurred',
    details: error,
  };
};

/**
 * Gets user-friendly error message
 */
export const getUserFriendlyMessage = (error: unknown): string => {
  const normalized = normalizeError(error);

  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'PGRST116': 'The requested resource was not found',
    '23505': 'This record already exists',
    '23503': 'Invalid reference to another record',
    '42501': 'You do not have permission to perform this action',
    'network_error': 'Network error. Please check your connection and try again',
    'auth_error': 'Authentication failed. Please sign in again',
  };

  if (normalized.code && errorMessages[normalized.code]) {
    return errorMessages[normalized.code];
  }

  // Check for common error patterns
  const message = normalized.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again';
  }
  
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You do not have permission to perform this action';
  }
  
  if (message.includes('not found')) {
    return 'The requested resource was not found';
  }

  // Return original message if it's user-friendly, otherwise generic message
  return normalized.message || 'An unexpected error occurred. Please try again';
};

/**
 * Handles error and returns user-friendly message
 */
export const handleError = (error: unknown, context?: string): string => {
  logError(error, context);
  return getUserFriendlyMessage(error);
};
