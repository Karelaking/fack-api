"use client";

import * as React from "react";
import {
  RiDeleteBin6Line,
  RiRefreshLine,
  RiSearchLine,
  RiTimeLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiTerminalBoxLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { clearRequestLogs, getRequestLogs } from "@/lib/actions/logs";
import type { RequestLog } from "@/db/schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectLogsProps {
  projectId: string;
  initialLogs: RequestLog[];
}

export function ProjectLogs({
  projectId,
  initialLogs,
}: ProjectLogsProps): React.JSX.Element {
  const [logs, setLogs] = React.useState<RequestLog[]>(initialLogs);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "2xx" | "3xx" | "4xx" | "5xx"
  >("all");
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const refreshed = await getRequestLogs(projectId);
      setLogs(refreshed);
      toast.success("Logs refreshed");
    } catch {
      toast.error("Failed to refresh logs");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all request logs for this project?",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await clearRequestLogs(projectId);
      setLogs([]);
      setExpandedLogId(null);
      toast.success("Logs cleared successfully");
    } catch {
      toast.error("Failed to clear logs");
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search and status code filters
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.path.toLowerCase().includes(search.toLowerCase()) ||
        log.method.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "2xx")
        return log.statusCode >= 200 && log.statusCode < 300;
      if (statusFilter === "3xx")
        return log.statusCode >= 300 && log.statusCode < 400;
      if (statusFilter === "4xx")
        return log.statusCode >= 400 && log.statusCode < 500;
      if (statusFilter === "5xx") return log.statusCode >= 500;

      return true;
    });
  }, [logs, search, statusFilter]);

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10";
      case "POST":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10";
      case "PUT":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10";
      case "PATCH":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/10";
    }
  };

  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10";
    }
    if (status >= 300 && status < 400) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10";
    }
    if (status >= 400 && status < 500) {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10";
    }
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10";
  };

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* Top action header: search and filters */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-md min-w-[240px] flex-1 items-center gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by method or path..."
              className="h-9 pl-9 text-xs"
            />
          </div>
          <div className="bg-muted/30 flex rounded-md border p-0.5">
            {(["all", "2xx", "3xx", "4xx", "5xx"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase transition-all",
                  statusFilter === filter
                    ? "bg-background text-foreground border-border/20 border shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RiRefreshLine
              className={cn("h-4 w-4", loading && "animate-spin")}
            />
            <span>Refresh</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={loading || logs.length === 0}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RiDeleteBin6Line className="h-4 w-4" />
            <span>Clear Logs</span>
          </Button>
        </div>
      </div>

      {/* Main logs display grid */}
      <div className="bg-card flex-1 overflow-y-auto rounded-lg border">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <RiTerminalBoxLine className="text-muted-foreground/30 h-10 w-10" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">
                No Request Logs Found
              </span>
              <span className="text-muted-foreground max-w-sm text-xs leading-normal">
                {search || statusFilter !== "all"
                  ? "No logs match your current search queries or status filters."
                  : "Send HTTP requests to your mock endpoint paths to populate this live console feed."}
              </span>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;

              let parsedHeaders: Record<string, string> = {};
              try {
                parsedHeaders = JSON.parse(log.headers ?? "{}");
              } catch {}

              let parsedQueryParams: Record<string, string> = {};
              try {
                parsedQueryParams = JSON.parse(log.queryParams ?? "{}");
              } catch {}

              let formattedBody = log.responsePayload || "";
              try {
                const parsed = JSON.parse(formattedBody);
                formattedBody = JSON.stringify(parsed, null, 2);
              } catch {}

              return (
                <div key={log.id} className="hover:bg-muted/10 transition-all">
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex cursor-pointer items-center gap-4 px-4 py-3 text-xs font-medium select-none"
                  >
                    <span className="text-muted-foreground/60 flex w-16 items-center gap-1 font-mono">
                      <RiTimeLine className="h-3 w-3" />
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase",
                        getMethodBadgeClass(log.method),
                      )}
                    >
                      {log.method}
                    </Badge>
                    <span className="text-foreground flex-1 truncate font-mono">
                      {log.path}
                    </span>
                    <span className="text-muted-foreground/80 hidden items-center gap-0.5 sm:inline-flex">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-border/10 py-0.2 rounded px-1 font-mono text-[10px]",
                          log.latency > 1000
                            ? "bg-rose-500/5 text-rose-500"
                            : log.latency > 200
                              ? "bg-amber-500/5 text-amber-500"
                              : "bg-emerald-500/5 text-emerald-500",
                        )}
                      >
                        {log.latency}ms
                      </Badge>
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                        getStatusBadgeClass(log.statusCode),
                      )}
                    >
                      {log.statusCode}
                    </Badge>
                    {isExpanded ? (
                      <RiArrowDownSLine className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <RiArrowRightSLine className="text-muted-foreground h-4 w-4" />
                    )}
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="bg-muted/10 text-foreground space-y-3 border-t px-4 py-3 font-mono text-[10px]">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Headers */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                            Request Headers
                          </span>
                          {Object.keys(parsedHeaders).length === 0 ? (
                            <div className="text-muted-foreground/50 py-1 text-[9px] italic">
                              No request headers found
                            </div>
                          ) : (
                            <div className="bg-card max-h-32 space-y-0.5 overflow-x-auto rounded border p-2">
                              {Object.entries(parsedHeaders).map(([k, v]) => (
                                <div key={k} className="flex gap-1.5">
                                  <span className="text-primary shrink-0 font-semibold">
                                    {k}:
                                  </span>
                                  <span className="text-muted-foreground break-all">
                                    {v}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Query Params */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                            Query Parameters
                          </span>
                          {Object.keys(parsedQueryParams).length === 0 ? (
                            <div className="text-muted-foreground/50 py-1 text-[9px] italic">
                              No query parameters sent
                            </div>
                          ) : (
                            <div className="bg-card max-h-32 space-y-0.5 overflow-x-auto rounded border p-2">
                              {Object.entries(parsedQueryParams).map(
                                ([k, v]) => (
                                  <div key={k} className="flex gap-1.5">
                                    <span className="shrink-0 font-semibold text-violet-600 dark:text-violet-400">
                                      {k}:
                                    </span>
                                    <span className="text-muted-foreground break-all">
                                      {v}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Response Payload */}
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                          Response Payload
                        </span>
                        <div className="bg-muted max-h-60 overflow-y-auto rounded-md border p-2">
                          <pre className="text-xs leading-normal whitespace-pre-wrap select-all">
                            {formattedBody || "Empty Response"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
