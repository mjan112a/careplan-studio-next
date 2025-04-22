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

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  context: string;
  timestamp: string;
  data?: Record<string, any>;
}

// Log storage
const logStorage: LogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

/**
 * Adds a log entry to the log storage and console
 * @param entry The log entry to add
 */
function addLogEntry(entry: LogEntry): void {
  logStorage.push(entry);
  
  // Limit the number of log entries
  if (logStorage.length > MAX_LOG_ENTRIES) {
    logStorage.shift();
  }
  
  // Format for browser console
  const logMessage = entry.data ? 
    [`[${entry.context}] ${entry.message}`, entry.data] :
    [`[${entry.context}] ${entry.message}`];
  
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

/**
 * Logs a debug message to browser console
 * @param message The message to log
 * @param context The context where the log occurred
 * @param data Additional data to log
 */
export function logDebug(message: string, context: string, data?: Record<string, any>): void {
  addLogEntry({
    level: LogLevel.DEBUG,
    message,
    context,
    timestamp: new Date().toISOString(),
    data
  });
}

/**
 * Logs an info message to browser console
 * @param message The message to log
 * @param context The context where the log occurred
 * @param data Additional data to log
 */
export function logInfo(message: string, context: string, data?: Record<string, any>): void {
  addLogEntry({
    level: LogLevel.INFO,
    message,
    context,
    timestamp: new Date().toISOString(),
    data
  });
}

/**
 * Logs a warning message to browser console
 * @param message The message to log
 * @param context The context where the log occurred
 * @param data Additional data to log
 */
export function logWarn(message: string, context: string, data?: Record<string, any>): void {
  addLogEntry({
    level: LogLevel.WARN,
    message,
    context,
    timestamp: new Date().toISOString(),
    data
  });
}

/**
 * Logs an error message to browser console
 * @param message The message to log
 * @param context The context where the log occurred
 * @param data Additional data to log
 */
export function logError(message: string, context: string, data?: Record<string, any>): void {
  addLogEntry({
    level: LogLevel.ERROR,
    message,
    context,
    timestamp: new Date().toISOString(),
    data
  });
}

/**
 * Gets all client-side log entries
 * @returns All log entries from browser session
 */
export function getLogEntries(): LogEntry[] {
  return [...logStorage];
}

/**
 * Gets client-side log entries by level
 * @param level The log level to filter by
 * @returns Log entries with the specified level
 */
export function getLogEntriesByLevel(level: LogLevel): LogEntry[] {
  return logStorage.filter(entry => entry.level === level);
}

/**
 * Gets client-side log entries by context
 * @param context The context to filter by
 * @returns Log entries with the specified context
 */
export function getLogEntriesByContext(context: string): LogEntry[] {
  return logStorage.filter(entry => entry.context === context);
}

/**
 * Clears all client-side log entries
 */
export function clearLogEntries(): void {
  logStorage.length = 0;
} 