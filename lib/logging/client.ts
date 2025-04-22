/**
 * Client-side logger implementation for browser environment.
 * 
 * Design Decisions:
 * - Uses browser console methods for client-side logging
 * - Maintains in-memory log storage for client-side debugging
 * - Provides filtering and retrieval of client logs
 * 
 * Note: This is separate from the server-side logger (lib/logging/server.ts)
 * and is specifically designed for browser environments.
 */

import { 
  LogLevel, 
  BaseLogEntry, 
  ILogger, 
  LoggerConfig, 
  isLogLevel 
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

  private addLogEntry(entry: ClientLogEntry): void {
    this.logStorage.push(entry);
    
    // Limit the number of log entries
    if (this.logStorage.length > (this.config.maxEntries || DEFAULT_CONFIG.maxEntries!)) {
      this.logStorage.shift();
    }
    
    // Format for browser console
    const logMessage = entry.context ? 
      [`[${entry.level}] ${entry.message}`, entry.context] :
      [`[${entry.level}] ${entry.message}`];
    
    // Log to browser console based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...logMessage);
        break;
      case LogLevel.INFO:
        console.info(...logMessage);
        break;
      case LogLevel.WARN:
        console.warn(...logMessage);
        break;
      case LogLevel.ERROR:
        console.error(...logMessage);
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

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLogEntry({
        level: LogLevel.ERROR,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLogEntry({
        level: LogLevel.WARN,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLogEntry({
        level: LogLevel.INFO,
        message,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
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

// Create and export default logger instance
export const logger = new ClientLogger(
  typeof window !== 'undefined' && window.localStorage?.getItem('logLevel') 
    ? { defaultLevel: parseInt(window.localStorage.getItem('logLevel')!, 10) }
    : undefined
); 