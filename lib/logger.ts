import chalk from 'chalk';
import { format as formatDate } from 'date-fns';

/**
 * Logger implementation for Node.js runtime environment.
 * 
 * Design Decisions:
 * - Uses Node.js runtime for full API access and better debugging
 * - Implements chalk for colorful, readable output
 * - Includes stack trace parsing for detailed context
 * - Supports multiple log levels with environment-based configuration
 * 
 * @see ../docs/adr/001-runtime-and-logging.md for detailed rationale
 * @see README.md for usage examples
 */

// Log level definitions
export enum LogLevels {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export type LogLevel = LogLevels;

// Type guard for log levels
export function isLogLevel(level: unknown): level is LogLevel {
  return typeof level === 'number' && Object.values(LogLevels).includes(level as LogLevels);
}

// Get human readable log level name
function getLogLevelName(level: LogLevel): string {
  return LogLevels[level];
}

// Format options interface
interface LogFormat {
  timestamp?: string; // date-fns format string
  showLevel?: boolean;
  showColors?: boolean;
  showContext?: boolean;
}

// Default format configuration
const DEFAULT_FORMAT: LogFormat = {
  timestamp: 'yyyy-MM-dd HH:mm:ss.SSS',
  showLevel: true,
  showColors: true,
  showContext: true
};

// Logger interface
export interface ILogger {
  setLogLevel(level: LogLevel): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

// Chalk-based logger implementation
export class ChalkLogger implements ILogger {
  private currentLevel: LogLevel;

  constructor(level: LogLevel = LogLevels.INFO) {
    if (!isLogLevel(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.currentLevel = level;
  }

  setLogLevel(level: LogLevel): void {
    if (!isLogLevel(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.currentLevel = level;
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = chalk.gray(new Date().toISOString());
    const levelColor = {
      [LogLevels.ERROR]: chalk.red,
      [LogLevels.WARN]: chalk.yellow,
      [LogLevels.INFO]: chalk.blue,
      [LogLevels.DEBUG]: chalk.gray
    }[level];
    
    const levelName = `[${LogLevels[level]}]`;
    const contextStr = context ? chalk.cyan(` ${JSON.stringify(context)}`) : '';
    
    return `${timestamp} ${levelColor(levelName)} ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.ERROR)) {
      console.error(this.formatMessage(LogLevels.ERROR, message, context));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.WARN)) {
      console.warn(this.formatMessage(LogLevels.WARN, message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.INFO)) {
      console.info(this.formatMessage(LogLevels.INFO, message, context));
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.DEBUG)) {
      console.debug(this.formatMessage(LogLevels.DEBUG, message, context));
    }
  }
}

// Create and export default logger instance
export const logger = new ChalkLogger(
  process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL, 10) : LogLevels.INFO
); 