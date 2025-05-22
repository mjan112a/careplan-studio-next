/**
 * Client-side logger implementation for browser environment.
 * 
 * Design Decisions:
 * - Uses browser console methods for client-side logging
 * - Maintains in-memory log storage for client-side debugging
 * - Provides filtering and retrieval of client logs
 * - Uses structured logging pattern with context separation
 * 
 * Note: This is separate from the server-side logger (lib/logging/server.ts)
 * and is specifically designed for browser environments.
 */

import { 
  LogLevel, 
  BaseLogEntry, 
  ILogger, 
  LoggerConfig, 
  isLogLevel,
  getLogLevelName,
  LogContext
} from './types';

// Client-specific log entry interface
interface ClientLogEntry extends BaseLogEntry {
  componentName?: string;
}

const DEFAULT_CONFIG: LoggerConfig = {
  defaultLevel: LogLevel.INFO,
  maxEntries: 100,
  format: {
    showLevel: true,
    showContext: true
  }
};

export class ClientLogger implements ILogger {
  private currentLevel: LogLevel;
  private logStorage: ClientLogEntry[];
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentLevel = this.config.defaultLevel || LogLevel.INFO;
    this.logStorage = [];
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatContextForConsole(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';
    
    return Object.entries(context)
      .map(([key, value]) => {
        if (value === undefined) return `${key}=undefined`;
        if (value === null) return `${key}=null`;
        if (typeof value === 'object' && value !== null) {
          try {
            return `${key}=${JSON.stringify(value)}`;
          } catch (e) {
            return `${key}=[Complex Object]`;
          }
        }
        return `${key}=${value}`;
      })
      .join(' ');
  }

  private addLogEntry(entry: ClientLogEntry): void {
    this.logStorage.push(entry);
    
    // Limit the number of log entries
    if (this.logStorage.length > (this.config.maxEntries || DEFAULT_CONFIG.maxEntries!)) {
      this.logStorage.shift();
    }
    
    // Get level name for display
    const levelLabel = `[${getLogLevelName(entry.level)}]`;
    
    // Format context for structured logging
    const contextStr = this.formatContextForConsole(entry.context);
    
    // Base message with level prefix
    const message = `${levelLabel} ${entry.message}`;
    
    // Log to browser console based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (contextStr) {
          console.debug(message, contextStr, entry.context);
        } else {
          console.debug(message);
        }
        break;
      case LogLevel.INFO:
        if (contextStr) {
          console.info(message, contextStr, entry.context);
        } else {
          console.info(message);
        }
        break;
      case LogLevel.WARN:
        if (contextStr) {
          console.warn(message, contextStr, entry.context);
        } else {
          console.warn(message);
        }
        break;
      case LogLevel.ERROR:
        if (contextStr) {
          console.error(message, contextStr, entry.context);
        } else {
          console.error(message);
        }
        break;
    }
  }

  setLogLevel(level: LogLevel): void {
    if (!isLogLevel(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.currentLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.currentLevel;
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLogEntry({
        level: LogLevel.ERROR,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLogEntry({
        level: LogLevel.WARN,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLogEntry({
        level: LogLevel.INFO,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLogEntry({
        level: LogLevel.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  // Client-specific methods for log retrieval and filtering
  getLogEntries(): ClientLogEntry[] {
    return [...this.logStorage];
  }

  getLogEntriesByLevel(level: LogLevel): ClientLogEntry[] {
    return this.logStorage.filter(entry => entry.level === level);
  }

  clearLogEntries(): void {
    this.logStorage = [];
  }
}

// Flag to track if we've already shown the warning
let hasShownLogLevelWarning = false;

// Create and export default logger instance
const determineClientLogLevel = (): LogLevel => {
  if (typeof window !== 'undefined') {
    // Check localStorage first
    const storedLevel = window.localStorage?.getItem('logLevel');
    if (storedLevel) {
      // Check if it's a string that matches a level name
      const levelName = storedLevel.toUpperCase();
      if (levelName === 'ERROR') return LogLevel.ERROR;
      if (levelName === 'WARN') return LogLevel.WARN;
      if (levelName === 'INFO') return LogLevel.INFO;
      if (levelName === 'DEBUG') return LogLevel.DEBUG;
      
      // Check if it's a numeric value
      if (!isNaN(parseInt(storedLevel, 10))) {
        const level = parseInt(storedLevel, 10);
        if (isLogLevel(level)) return level;
      }
      
      // If invalid, show warning once
      if (!hasShownLogLevelWarning) {
        console.warn(`Invalid logLevel value in localStorage: "${storedLevel}". Defaulting to INFO.`);
        hasShownLogLevelWarning = true;
      }
    }
    
    // Use development level in development, otherwise INFO
    return window.location.hostname === 'localhost' ? LogLevel.DEBUG : LogLevel.INFO;
  }
  
  return LogLevel.INFO;
};

export const logger = new ClientLogger({
  defaultLevel: determineClientLogLevel()
}); 