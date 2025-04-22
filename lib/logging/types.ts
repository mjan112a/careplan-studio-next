/**
 * Shared types and interfaces for logging implementations.
 * Used by both client and server loggers to maintain consistency.
 */

// Log levels shared between client and server
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Base log entry structure shared by both implementations
export interface BaseLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// Configuration interface shared by both implementations
export interface LoggerConfig {
  defaultLevel?: LogLevel;
  maxEntries?: number;
  format?: LogFormat;
}

// Format options interface shared by both implementations
export interface LogFormat {
  timestamp?: string;
  showLevel?: boolean;
  showColors?: boolean;
  showContext?: boolean;
}

// Base logger interface implemented by both client and server
export interface ILogger {
  setLogLevel(level: LogLevel): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  getLogLevel(): LogLevel;
}

// Type guard for log levels
export function isLogLevel(level: unknown): level is LogLevel {
  return typeof level === 'number' && Object.values(LogLevel).includes(level as LogLevel);
}

// Get human readable log level name
export function getLogLevelName(level: LogLevel): string {
  return LogLevel[level];
} 