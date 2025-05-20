/**
 * Server-side logger implementation for Node.js runtime environment.
 * 
 * Design Decisions:
 * - Uses Node.js runtime for full API access and better debugging
 * - Uses ANSI color codes directly for reliable terminal coloring
 * - Includes stack trace parsing for detailed context
 * - Supports multiple log levels with environment-based configuration
 * - Uses structured logging pattern with context separation
 * 
 * @see ../docs/adr/001-runtime-and-logging.md for detailed rationale
 * @see README.md for usage examples
 */

export const runtime = 'nodejs';

import { format as formatDate } from 'date-fns';
import { 
  LogLevel, 
  BaseLogEntry, 
  ILogger, 
  LoggerConfig,
  LogFormat,
  isLogLevel,
  getLogLevelName,
  LogContext
} from './types';

// Server-specific log entry interface
interface ServerLogEntry extends BaseLogEntry {
  stack?: string;
  pid?: number;
}

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

const DEFAULT_CONFIG: LoggerConfig = {
  defaultLevel: LogLevel.INFO,
  format: {
    timestamp: 'yyyy-MM-dd HH:mm:ss.SSS',
    showLevel: true,
    showColors: true,
    showContext: true
  }
};

// Sensitive keys that should be truncated in logs
const SENSITIVE_KEYS = ['token', 'password', 'secret', 'auth', 'key', 'cookie', 'value'];
const MAX_SENSITIVE_LENGTH = 20;

/**
 * Sanitizes potentially sensitive values for logging
 * @param key The key of the value being sanitized
 * @param value The value to sanitize
 * @returns Sanitized value
 */
function sanitizeValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  
  // Check if this is a key that might contain sensitive data
  const lowerKey = key.toLowerCase();
  const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k));
  
  if (isSensitive && value.length > MAX_SENSITIVE_LENGTH) {
    return value.substring(0, MAX_SENSITIVE_LENGTH) + '...';
  }
  
  return value;
}

export class ServerLogger implements ILogger {
  private currentLevel: LogLevel;
  private config: LoggerConfig;
  private enableColors: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentLevel = this.config.defaultLevel || LogLevel.INFO;
    
    // Check if colors should be enabled (can be forced with env var)
    this.enableColors = 
      !!this.config.format?.showColors && 
      (process.env.FORCE_LOGGER_COLORS === 'true' || 
       process.env.FORCE_COLOR !== undefined);
  }

  private colorize(text: string, color: keyof typeof COLORS): string {
    return this.enableColors 
      ? COLORS[color] + text + COLORS.reset
      : text;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(entry: ServerLogEntry): string {
    const timestamp = this.colorize(
      formatDate(
        new Date(entry.timestamp),
        this.config.format?.timestamp || DEFAULT_CONFIG.format!.timestamp!
      ),
      'gray'
    );

    const levelColors: Record<LogLevel, keyof typeof COLORS> = {
      [LogLevel.ERROR]: 'red',
      [LogLevel.WARN]: 'yellow',
      [LogLevel.INFO]: 'blue',
      [LogLevel.DEBUG]: 'gray'
    };
    
    const levelName = this.colorize(
      `[${getLogLevelName(entry.level)}]`, 
      levelColors[entry.level]
    );
    
    // Format context as key=value pairs for better readability
    let contextStr = '';
    if (entry.context && Object.keys(entry.context).length > 0) {
      contextStr = ' ' + Object.entries(entry.context)
        .map(([key, value]) => {
          // Format special cases
          if (value === undefined) return `${key}=undefined`;
          if (value === null) return `${key}=null`;
          
          // Sanitize potentially sensitive values
          const sanitizedValue = sanitizeValue(key, value);
          
          if (typeof sanitizedValue === 'object' && sanitizedValue !== null) {
            try {
              // Also sanitize nested objects
              const jsonStr = JSON.stringify(sanitizedValue, (k, v) => sanitizeValue(k, v));
              return `${key}=${jsonStr}`;
            } catch (e) {
              return `${key}=[Complex Object]`;
            }
          }
          return `${key}=${sanitizedValue}`;
        })
        .join(' ');
      
      contextStr = this.colorize(contextStr, 'cyan');
    }
    
    const stackStr = entry.stack 
      ? `\n${this.colorize(entry.stack, 'gray')}`
      : '';
    
    return `${timestamp} ${levelName} ${entry.message}${contextStr}${stackStr}`;
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

  warn(message: string, context?: LogContext): void {
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

  info(message: string, context?: LogContext): void {
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

  debug(message: string, context?: LogContext): void {
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
const determineLogLevel = (): LogLevel => {
  // Check environment variable first
  if (process.env.LOG_LEVEL && !isNaN(parseInt(process.env.LOG_LEVEL, 10))) {
    const level = parseInt(process.env.LOG_LEVEL, 10);
    if (isLogLevel(level)) return level;
  }
  
  // Use development level in development, otherwise INFO
  return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
};

// Create a properly configured logger instance
export const logger = new ServerLogger({
  defaultLevel: determineLogLevel()
}); 