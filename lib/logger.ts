import { createConsola, type ConsolaInstance } from "consola";
import { type Logger, LoggerRegistry } from "./logger-registry";

/**
 * Transport contract for emitting log events across different log levels.
 */
export interface LogTransport {
  log(
    level: "info" | "success" | "warn" | "error" | "debug",
    tag: string,
    message: string,
    ...args: unknown[]
  ): void;
}

/** Legacy alias to prevent breaking any callers */
export type ILogTransport = LogTransport;

/**
 * Consola transport adapter that writes structured logs to the console.
 * Caches tagged instances to avoid per-log allocation overhead.
 */
export class ConsolaTransport implements LogTransport {
  private instance: ConsolaInstance;
  private taggedInstances = new Map<string, ConsolaInstance>();

  constructor(level: number) {
    this.instance = createConsola({ level });
  }

  private getTaggedInstance(tag: string): ConsolaInstance {
    let tagged = this.taggedInstances.get(tag);
    if (!tagged) {
      tagged = this.instance.withTag(tag);
      this.taggedInstances.set(tag, tagged);
    }
    return tagged;
  }

  public log(
    level: "info" | "success" | "warn" | "error" | "debug",
    tag: string,
    message: string,
    ...args: unknown[]
  ): void {
    const loggerWithTag = this.getTaggedInstance(tag);
    switch (level) {
      case "error":
        loggerWithTag.error(message, ...args);
        break;
      case "warn":
        loggerWithTag.warn(message, ...args);
        break;
      case "success":
        loggerWithTag.success(message, ...args);
        break;
      case "debug":
        loggerWithTag.debug(message, ...args);
        break;
      case "info":
      default:
        loggerWithTag.info(message, ...args);
        break;
    }
  }
}

/**
 * ScopedLogger decorates a LogTransport with a fixed tag string.
 */
export class ScopedLogger implements Logger {
  constructor(
    private transport: LogTransport,
    private tag: string,
  ) {}

  public info(message: string, ...args: unknown[]): void {
    this.transport.log("info", this.tag, message, ...args);
  }

  public success(message: string, ...args: unknown[]): void {
    this.transport.log("success", this.tag, message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.transport.log("warn", this.tag, message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.transport.log("error", this.tag, message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.transport.log("debug", this.tag, message, ...args);
  }
}

/**
 * Registers the standard Consola provider with the LoggerRegistry.
 */
export function registerConsolaProvider(): void {
  const logLevel = process.env.LOG_LEVEL
    ? parseInt(process.env.LOG_LEVEL, 10)
    : 4;
  const transport = new ConsolaTransport(logLevel);
  LoggerRegistry.setProvider(
    (tag: string): Logger => new ScopedLogger(transport, tag),
  );
}

// Default transports and loggers
const defaultLogLevel = process.env.LOG_LEVEL
  ? parseInt(process.env.LOG_LEVEL, 10)
  : 4;
const defaultTransport = new ConsolaTransport(defaultLogLevel);

export const dbLogger = new ScopedLogger(defaultTransport, "db");
export const mockLogger = new ScopedLogger(defaultTransport, "mock");
