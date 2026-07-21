export interface FormatterContext {
  routeId: string;
  projectId: string;
  statusCode: number;
  success: boolean;
  isFromCache: boolean;
  latency: number;
  method: string;
  path: string;
  query: Record<string, string>;
  limitValue?: number;
  pageValue?: number;
  totalCount?: number;
}

export interface IMockResponseFormatter {
  format(data: unknown, context: FormatterContext): unknown;
}

export class SingleObjectFormatter implements IMockResponseFormatter {
  format(data: unknown, context: FormatterContext): unknown {
    return {
      data,
      meta: {
        routeId: context.routeId,
        projectId: context.projectId,
        statusCode: context.statusCode,
        success: context.success,
        isFromCache: context.isFromCache,
        timestamp: new Date().toISOString(),
        latency: context.latency,
        method: context.method,
        path: context.path,
        query: context.query,
      },
    };
  }
}

export class ListObjectsFormatter implements IMockResponseFormatter {
  format(data: unknown, context: FormatterContext): unknown {
    const dataArray = Array.isArray(data) ? data : [];
    return {
      data: dataArray,
      meta: {
        count: dataArray.length,
        routeId: context.routeId,
        projectId: context.projectId,
        statusCode: context.statusCode,
        success: context.success,
        isFromCache: context.isFromCache,
        timestamp: new Date().toISOString(),
        latency: context.latency,
        method: context.method,
        path: context.path,
        query: context.query,
      },
    };
  }
}

export class PagedListFormatter implements IMockResponseFormatter {
  format(data: unknown, context: FormatterContext): unknown {
    const dataArray = Array.isArray(data) ? data : [];
    const limit = context.limitValue ?? 10;
    const page = context.pageValue ?? 1;
    const total = context.totalCount ?? dataArray.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataArray,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        routeId: context.routeId,
        projectId: context.projectId,
        statusCode: context.statusCode,
        success: context.success,
        isFromCache: context.isFromCache,
        timestamp: new Date().toISOString(),
        latency: context.latency,
        method: context.method,
        path: context.path,
        query: context.query,
      },
    };
  }
}

export class MockResponseFormatterFactory {
  static getFormatter(
    type: "single" | "list" | "paged",
  ): IMockResponseFormatter {
    switch (type) {
      case "paged":
        return new PagedListFormatter();
      case "list":
        return new ListObjectsFormatter();
      case "single":
      default:
        return new SingleObjectFormatter();
    }
  }
}
