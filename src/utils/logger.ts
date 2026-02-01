/**
 * Logger Utility
 * Centralized logging that respects environment (dev vs production)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const context = options?.context ? `[${options.context}]` : '';
    return `${context} ${message}`;
  }

  private log(level: LogLevel, message: string, options?: LogOptions): void {
    // Only log in development or if explicitly enabled
    if (!this.isDevelopment) {
      // In production, only log errors and warnings
      if (level !== 'error' && level !== 'warn') {
        return;
      }
    }

    const formattedMessage = this.formatMessage(level, message, options);
    
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage, options?.data);
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(formattedMessage, options?.data);
        }
        break;
      case 'warn':
        console.warn(formattedMessage, options?.data);
        break;
      case 'error':
        console.error(formattedMessage, options?.data);
        // In production, send to error tracking service
        if (this.isProduction) {
          // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
          // errorTrackingService.captureException(new Error(message), {
          //   level,
          //   context: options?.context,
          //   extra: options?.data,
          // });
        }
        break;
    }
  }

  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options);
  }

  info(message: string, options?: LogOptions): void {
    this.log('info', message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options);
  }

  error(message: string, options?: LogOptions): void {
    this.log('error', message, options);
  }
}

export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: string, data?: unknown) => {
  logger.debug(message, { context, data });
};

export const logInfo = (message: string, context?: string, data?: unknown) => {
  logger.info(message, { context, data });
};

export const logWarn = (message: string, context?: string, data?: unknown) => {
  logger.warn(message, { context, data });
};

export const logError = (message: string, context?: string, data?: unknown) => {
  logger.error(message, { context, data });
};
