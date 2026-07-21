import { registerConsolaProvider } from "./logger";

/**
 * ─── Interface Segregation Principle (ISP) ───
 * Clients should only depend on logging methods they actually use.
 */
export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * ─── Single Responsibility Principle (SRP) ───
 * Helper trace manager focusing strictly on call tracing outputs.
 */
export class LoggingTrace {
  constructor(private logger: ILogger) {}

  traceCall(fnName: string, ...args: unknown[]) {
    this.logger.debug(`[${fnName}] called with args:`, ...args);
  }

  traceSuccess(fnName: string, result: unknown) {
    this.logger.debug(`[${fnName}] returned:`, result);
  }

  traceError(fnName: string, error: unknown) {
    this.logger.error(`[${fnName}] failed:`, error);
  }
}

// Fallback no-op logger to prevent null-pointer errors if provider is missing
class NoOpLogger implements ILogger {
  info() {}
  success() {}
  warn() {}
  error() {}
  debug() {}
}

export type LoggerProvider = (tag: string) => ILogger;

/**
 * ─── Service Locator Pattern / Registry ───
 * Decouples call sites from the concrete logger library implementation.
 */
export class LoggerRegistry {
  private static loggers = new Map<string, ILogger>();
  private static provider: LoggerProvider = () => new NoOpLogger();
  private static isInitialized = false;

  static setProvider(provider: LoggerProvider) {
    this.provider = provider;
  }

  static register(key: string, logger: ILogger) {
    this.loggers.set(key, logger);
  }

  private static ensureInitialized() {
    if (!this.isInitialized) {
      this.isInitialized = true;
      registerConsolaProvider();
    }
  }

  static get(key: string): ILogger {
    this.ensureInitialized();
    if (!this.loggers.has(key)) {
      const loggerInstance = this.provider(key);
      this.loggers.set(key, loggerInstance);
    }
    return this.loggers.get(key)!;
  }

  static getTrace(key: string): LoggingTrace {
    return new LoggingTrace(this.get(key));
  }
}
