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
    this.logLevel = LogLevel.INFO;
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