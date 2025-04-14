enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    // Get log level from environment variable
    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    
    // Set default log level based on environment
    if (envLogLevel === 'DEBUG') {
      this.logLevel = LogLevel.DEBUG;
    } else if (envLogLevel === 'INFO') {
      this.logLevel = LogLevel.INFO;
    } else if (envLogLevel === 'WARN') {
      this.logLevel = LogLevel.WARN;
    } else if (envLogLevel === 'ERROR') {
      this.logLevel = LogLevel.ERROR;
    } else {
      // Default to INFO if not specified or invalid
      this.logLevel = LogLevel.INFO;
      console.log(`Log level not specified or invalid (${envLogLevel}), defaulting to INFO`);
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(message, context);
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(message, context);
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(message, context);
    }
  }
}

export const logger = Logger.getInstance(); 