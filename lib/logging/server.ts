/**
 * Server-side logger implementation for Node.js runtime environment.
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

export const runtime = 'nodejs';

import chalk from 'chalk';
import { format as formatDate } from 'date-fns';
import { 
  LogLevel, 
  BaseLogEntry, 
  ILogger, 
  LoggerConfig,
  LogFormat,
  isLogLevel,
  getLogLevelName 
} from './types';

// Server-specific log entry interface
interface ServerLogEntry extends BaseLogEntry {
  stack?: string;
  pid?: number;
}

const DEFAULT_CONFIG: LoggerConfig = {
  defaultLevel: LogLevel.INFO,
  format: {
    timestamp: 'yyyy-MM-dd HH:mm:ss.SSS',
    showLevel: true,
    showColors: true,
    showContext: true
  }
};

export class ServerLogger implements ILogger {
  private currentLevel: LogLevel;
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentLevel = this.config.defaultLevel || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(entry: ServerLogEntry): string {
    const timestamp = chalk.gray(formatDate(
      new Date(entry.timestamp),
      this.config.format?.timestamp || DEFAULT_CONFIG.format!.timestamp!
    ));

    const levelColor = {
      [LogLevel.ERROR]: chalk.red,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.INFO]: chalk.blue,
      [LogLevel.DEBUG]: chalk.gray
    }[entry.level];
    
    const levelName = `[${getLogLevelName(entry.level)}]`;
    const contextStr = entry.context ? chalk.cyan(` ${JSON.stringify(entry.context)}`) : '';
    const stackStr = entry.stack ? `\n${chalk.gray(entry.stack)}` : '';
    
    return `${timestamp} ${levelColor(levelName)} ${entry.message}${contextStr}${stackStr}`;
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
      const error = context?.error instanceof Error ? context.error as Error : undefined;
      const entry: ServerLogEntry = {
        level: LogLevel.ERROR,
        message,
        timestamp: new Date().toISOString(),
        context,
        stack: error?.stack,
        pid: process.pid
      };
      console.error(this.formatMessage(entry));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry: ServerLogEntry = {
        level: LogLevel.WARN,
        message,
        timestamp: new Date().toISOString(),
        context,
        pid: process.pid
      };
      console.warn(this.formatMessage(entry));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry: ServerLogEntry = {
        level: LogLevel.INFO,
        message,
        timestamp: new Date().toISOString(),
        context,
        pid: process.pid
      };
      console.info(this.formatMessage(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry: ServerLogEntry = {
        level: LogLevel.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        context,
        pid: process.pid
      };
      console.debug(this.formatMessage(entry));
    }
  }
}

// Create and export default logger instance
export const logger = new ServerLogger(
  process.env.LOG_LEVEL ? 
    { defaultLevel: parseInt(process.env.LOG_LEVEL, 10) } : 
    undefined
); 