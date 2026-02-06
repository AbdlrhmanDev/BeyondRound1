/**
 * Centralized logging utility
 * Replaces scattered console.log/error calls
 * Can be extended to send logs to external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

// Configuration
const config = {
  // Only show debug logs in development
  minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  // Enable console output
  enableConsole: true,
  // Future: enable external logging service
  enableExternal: false,
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[config.minLevel as LogLevel];
}

function formatMessage(entry: LogEntry): string {
  const prefix = `[${entry.level.toUpperCase()}]`;
  return `${prefix} ${entry.message}`;
}

function logToConsole(entry: LogEntry): void {
  if (!config.enableConsole) return;

  const message = formatMessage(entry);
  const args: unknown[] = [message];

  if (entry.context) {
    args.push(entry.context);
  }

  if (entry.error) {
    args.push(entry.error);
  }

  switch (entry.level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  };
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context, error);
  logToConsole(entry);

  // Future: Send to external service
  // if (config.enableExternal) {
  //   sendToExternalService(entry);
  // }
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
  /**
   * Debug level - only shown in development
   */
  debug: (message: string, context?: LogContext) => {
    log('debug', message, context);
  },

  /**
   * Info level - general information
   */
  info: (message: string, context?: LogContext) => {
    log('info', message, context);
  },

  /**
   * Warn level - potential issues
   */
  warn: (message: string, context?: LogContext) => {
    log('warn', message, context);
  },

  /**
   * Error level - errors that need attention
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    const errorObj = error instanceof Error ? error : undefined;
    const errorContext = error && !(error instanceof Error) ? { error } : undefined;

    log('error', message, { ...context, ...errorContext }, errorObj);
  },

  /**
   * Create a scoped logger with a prefix
   * Useful for services: const log = logger.scope('ProfileService');
   */
  scope: (scope: string) => ({
    debug: (message: string, context?: LogContext) => {
      log('debug', `[${scope}] ${message}`, context);
    },
    info: (message: string, context?: LogContext) => {
      log('info', `[${scope}] ${message}`, context);
    },
    warn: (message: string, context?: LogContext) => {
      log('warn', `[${scope}] ${message}`, context);
    },
    error: (message: string, error?: unknown, context?: LogContext) => {
      const errorObj = error instanceof Error ? error : undefined;
      const errorContext = error && !(error instanceof Error) ? { error } : undefined;
      log('error', `[${scope}] ${message}`, { ...context, ...errorContext }, errorObj);
    },
  }),
};

export default logger;
