/**
 * Fack API's — Centralized Logging Registry
 *
 * Provides a decoupled Service Locator / Registry pattern for loggers across the application.
 * Follows SOLID principles:
 * - Interface Segregation Principle: `Logger` interface requires only standard log levels.
 * - Single Responsibility Principle: `LoggingTrace` focuses solely on execution tracing.
 * - Dependency Inversion: Callers depend on `Logger`, not concrete logging libraries.
 */

/**
 * Interface Segregation Principle (ISP)
 * Defines the contract for all application loggers without external library coupling.
 */
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/** Legacy alias to prevent breaking any existing callers */
export type ILogger = Logger;

/**
 * Single Responsibility Principle (SRP)
 * Helper trace manager focusing strictly on method invocation tracing.
 */
export class LoggingTrace {
  constructor(private logger: Logger) {}

  public traceCall(fnName: string, ...args: unknown[]): void {
    this.logger.debug(`[${fnName}] called with args:`, ...args);
  }

  public traceSuccess(fnName: string, result: unknown): void {
    this.logger.debug(`[${fnName}] returned:`, result);
  }

  public traceError(fnName: string, error: unknown): void {
    this.logger.error(`[${fnName}] failed:`, error);
  }
}

/**
 * Fallback no-op logger to prevent undefined errors when provider is not yet attached.
 */
class NoOpLogger implements Logger {
  public info(): void {}
  public success(): void {}
  public warn(): void {}
  public error(): void {}
  public debug(): void {}
}

export type LoggerProvider = (tag: string) => Logger;

/**
 * Service Locator / Registry Pattern
 * Decouples call sites from concrete loggers and caches logger and trace instances.
 */
export class LoggerRegistry {
  private static loggers = new Map<string, Logger>();
  private static traces = new Map<string, LoggingTrace>();
  private static provider: LoggerProvider = () => new NoOpLogger();
  private static isInitialized = false;

  /**
   * Sets the factory provider for creating tagged loggers.
   */
  public static setProvider(provider: LoggerProvider): void {
    this.provider = provider;
    this.isInitialized = true;
  }

  /**
   * Registers a pre-configured logger instance under a given key.
   */
  public static register(key: string, logger: Logger): void {
    this.loggers.set(key, logger);
  }

  /**
   * Lazily ensures a logging provider is registered without static circular import cycles.
   */
  private static ensureInitialized(): void {
    if (!this.isInitialized) {
      this.isInitialized = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { registerConsolaProvider } = require("./logger");
        registerConsolaProvider();
      } catch {
        // Fallback to NoOpLogger if logger is unavailable
      }
    }
  }

  /**
   * Retrieves or creates a logger instance for a given tag.
   */
  public static get(key: string): Logger {
    this.ensureInitialized();
    let loggerInstance = this.loggers.get(key);
    if (!loggerInstance) {
      loggerInstance = this.provider(key);
      this.loggers.set(key, loggerInstance);
    }
    return loggerInstance;
  }

  /**
   * Retrieves or creates a cached LoggingTrace instance for a given tag.
   */
  public static getTrace(key: string): LoggingTrace {
    let traceInstance = this.traces.get(key);
    if (!traceInstance) {
      traceInstance = new LoggingTrace(this.get(key));
      this.traces.set(key, traceInstance);
    }
    return traceInstance;
  }
}
