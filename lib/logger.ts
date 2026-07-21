import { createConsola, type ConsolaInstance } from "consola";
import { type ILogger, LoggerRegistry } from "./logger-registry";

export interface ILogTransport {
  log(
    level: "info" | "success" | "warn" | "error" | "debug",
    tag: string,
    message: string,
    ...args: unknown[]
  ): void;
}

export class ConsolaTransport implements ILogTransport {
  private instance: ConsolaInstance;

  constructor(level: number) {
    this.instance = createConsola({ level });
  }

  log(
    level: "info" | "success" | "warn" | "error" | "debug",
    tag: string,
    message: string,
    ...args: unknown[]
  ): void {
    const loggerWithTag = this.instance.withTag(tag);
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

export class ScopedLogger implements ILogger {
  constructor(
    private transport: ILogTransport,
    private tag: string,
  ) {}

  info(message: string, ...args: unknown[]): void {
    this.transport.log("info", this.tag, message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    this.transport.log("success", this.tag, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.transport.log("warn", this.tag, message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.transport.log("error", this.tag, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.transport.log("debug", this.tag, message, ...args);
  }
}

export function registerConsolaProvider() {
  const logLevel = process.env.LOG_LEVEL
    ? parseInt(process.env.LOG_LEVEL, 10)
    : 4;
  const transport = new ConsolaTransport(logLevel);
  LoggerRegistry.setProvider((tag) => new ScopedLogger(transport, tag));
}

// Legacy exports for database connection/migration files direct usage
const defaultLogLevel = process.env.LOG_LEVEL
  ? parseInt(process.env.LOG_LEVEL, 10)
  : 4;
const defaultTransport = new ConsolaTransport(defaultLogLevel);

export const dbLogger = new ScopedLogger(defaultTransport, "db");
export const mockLogger = new ScopedLogger(defaultTransport, "mock");
