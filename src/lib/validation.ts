/**
 * Shared validation utilities to enforce DRY principle
 * Use these instead of repeating validation logic in services
 */

/**
 * Validates that a value is a non-empty string (typically for IDs)
 */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates user ID and logs error if invalid
 */
export function validateUserId(userId: unknown, context?: string): string | null {
  if (!isValidId(userId)) {
    console.error(`[${context || 'validation'}] Invalid userId:`, userId);
    return null;
  }
  return userId;
}

/**
 * Validates required string field
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string,
  context?: string
): string | null {
  if (!isValidId(value)) {
    console.error(`[${context || 'validation'}] Invalid ${fieldName}:`, value);
    return null;
  }
  return value;
}

/**
 * Validates email format
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates UUID format
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard for checking if object has required properties
 */
export function hasRequiredProps<T extends object>(
  obj: unknown,
  props: (keyof T)[]
): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  return props.every(prop => prop in obj);
}

/**
 * Safe JSON parse with type validation
 */
export function safeJsonParse<T>(
  json: string,
  validator?: (data: unknown) => data is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    if (validator && !validator(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}
