/**
 * Application-wide error types and handling utilities
 * Implements consistent error handling across the codebase
 */

// Error codes for the application
export const ErrorCodes = {
  // Auth errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED: 'MISSING_REQUIRED',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Database errors
  DB_ERROR: 'DB_ERROR',
  RLS_VIOLATION: 'RLS_VIOLATION',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Generic
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Custom application error with code and context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCodes.UNKNOWN,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Create an AppError from various error types
 */
export function normalizeError(error: unknown, context?: string): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCodes.UNKNOWN,
      500,
      { originalError: error.name, context }
    );
  }

  // Supabase error object
  if (isSupabaseError(error)) {
    return mapSupabaseError(error);
  }

  // String error
  if (typeof error === 'string') {
    return new AppError(error, ErrorCodes.UNKNOWN, 500, { context });
  }

  // Unknown error
  return new AppError(
    'An unexpected error occurred',
    ErrorCodes.UNKNOWN,
    500,
    { originalError: error, context }
  );
}

/**
 * Type guard for Supabase error
 */
interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Map Supabase error codes to AppError
 */
function mapSupabaseError(error: SupabaseError): AppError {
  const errorMap: Record<string, { code: ErrorCode; status: number }> = {
    'PGRST116': { code: ErrorCodes.NOT_FOUND, status: 404 },
    '42501': { code: ErrorCodes.RLS_VIOLATION, status: 403 },
    '23505': { code: ErrorCodes.ALREADY_EXISTS, status: 409 },
    'PGRST301': { code: ErrorCodes.DB_ERROR, status: 500 },
  };

  const mapped = errorMap[error.code] || { code: ErrorCodes.DB_ERROR, status: 500 };

  return new AppError(
    error.message,
    mapped.code,
    mapped.status,
    { supabaseCode: error.code, hint: error.hint, details: error.details }
  );
}

/**
 * Execute async function with consistent error handling
 * Returns [data, null] on success or [null, error] on failure
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, normalizeError(error, context)];
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: AppError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (e) => e.code === ErrorCodes.NETWORK_ERROR || e.code === ErrorCodes.TIMEOUT,
  } = options;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const [result, error] = await tryCatch(fn);

    if (error === null) {
      return result;
    }

    lastError = error;

    if (!shouldRetry(error) || attempt === maxRetries - 1) {
      throw error;
    }

    const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw lastError || new AppError('Retry failed', ErrorCodes.UNKNOWN);
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCodes.AUTH_REQUIRED]: 'Please sign in to continue',
    [ErrorCodes.AUTH_EXPIRED]: 'Your session has expired. Please sign in again',
    [ErrorCodes.UNAUTHORIZED]: 'You do not have permission to perform this action',
    [ErrorCodes.INVALID_INPUT]: 'Please check your input and try again',
    [ErrorCodes.MISSING_REQUIRED]: 'Please fill in all required fields',
    [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
    [ErrorCodes.ALREADY_EXISTS]: 'This resource already exists',
    [ErrorCodes.DB_ERROR]: 'A database error occurred. Please try again',
    [ErrorCodes.RLS_VIOLATION]: 'You do not have access to this resource',
    [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection',
    [ErrorCodes.TIMEOUT]: 'The request timed out. Please try again',
    [ErrorCodes.UNKNOWN]: 'An unexpected error occurred. Please try again',
  };

  return messages[error.code] || messages[ErrorCodes.UNKNOWN];
}
