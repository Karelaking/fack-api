"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  RiAlertLine,
  RiTimeLine,
  RiPulseLine,
  RiCheckboxCircleLine,
  RiShieldCrossLine,
  RiFlashlightLine,
  RiCodeLine,
  RiEqualizerLine,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface RouteNodeData {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  isEnabled: boolean;
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  responseSchema?: string;
  customHeaders?: string;
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  onSelectRoute: (id: string) => void;
}

interface RouteNodeProps {
  data: RouteNodeData;
  selected: boolean;
}

/**
 * Highly Compact Custom Node representing a Mock API route.
 * Space-optimized HTTP color schemes, glassmorphism, status badges, and micro-controls.
 */
export function RouteNode({
  data,
  selected,
}: RouteNodeProps): React.ReactElement {
  const method = data.method.toUpperCase();

  // Method-specific color configurations: [leftBorder, text/badge, bg, shadow/glow, dot]
  const themeMap: Record<
    string,
    {
      border: string;
      text: string;
      bg: string;
      glow: string;
      dot: string;
      badge: string;
    }
  > = {
    GET: {
      border: "border-l-emerald-500",
      text: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/5",
      glow: "hover:shadow-emerald-500/10 hover:border-emerald-500/40",
      dot: "bg-emerald-500",
      badge:
        "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
    },
    POST: {
      border: "border-l-blue-500",
      text: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/5",
      glow: "hover:shadow-blue-500/10 hover:border-blue-500/40",
      dot: "bg-blue-500",
      badge:
        "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
    },
    PUT: {
      border: "border-l-amber-500",
      text: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/5",
      glow: "hover:shadow-amber-500/10 hover:border-amber-500/40",
      dot: "bg-amber-500",
      badge:
        "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    },
    DELETE: {
      border: "border-l-rose-500",
      text: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-500/5",
      glow: "hover:shadow-rose-500/10 hover:border-rose-500/40",
      dot: "bg-rose-500",
      badge:
        "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
    },
    PATCH: {
      border: "border-l-purple-500",
      text: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/5",
      glow: "hover:shadow-purple-500/10 hover:border-purple-500/40",
      dot: "bg-purple-500",
      badge:
        "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
    },
  };

  const theme = themeMap[method] || {
    border: "border-l-slate-500",
    text: "text-slate-500",
    bg: "bg-slate-500/5",
    glow: "hover:border-slate-500/40",
    dot: "bg-slate-500",
    badge: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  // Status code colors and icons
  let statusBadgeClass =
    "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
  let StatusIcon = RiPulseLine;

  if (data.statusCode >= 200 && data.statusCode < 300) {
    statusBadgeClass =
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10";
    StatusIcon = RiCheckboxCircleLine;
  } else if (data.statusCode >= 300 && data.statusCode < 400) {
    statusBadgeClass =
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10";
    StatusIcon = RiFlashlightLine;
  } else if (data.statusCode >= 400 && data.statusCode < 500) {
    statusBadgeClass =
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10";
    StatusIcon = RiAlertLine;
  } else if (data.statusCode >= 500) {
    statusBadgeClass =
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10 animate-pulse";
    StatusIcon = RiShieldCrossLine;
  }

  // Calculate configuration counts for Schema and Custom Headers
  const schemaKeysCount = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.responseSchema || "{}");
      return Object.keys(parsed).length;
    } catch {
      return 0;
    }
  }, [data.responseSchema]);

  const headersKeysCount = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.customHeaders || "{}");
      return Object.keys(parsed).length;
    } catch {
      return 0;
    }
  }, [data.customHeaders]);

  const handleToggle = (checked: boolean) => {
    data.onToggleEnabled(data.id, checked);
  };

  const hasLatency = (data.latencyMin ?? 0) > 0 || (data.latencyMax ?? 0) > 0;
  const hasErrors = (data.errorRate ?? 0) > 0;

  return (
    <div
      onClick={() => data.onSelectRoute(data.id)}
      className={cn(
        "bg-background/80 border-border/80 flex w-60 cursor-pointer flex-col rounded-lg border border-l-4 shadow-sm backdrop-blur-md transition-all duration-200 select-none",
        theme.border,
        theme.glow,
        selected
          ? "border-primary ring-primary/20 shadow-primary/5 -translate-y-0.5 scale-[1.01] shadow-md ring-2"
          : "hover:-translate-y-0.5 hover:shadow-md",
        !data.isEnabled && "opacity-50 grayscale-20",
      )}
    >
      {/* Node handles for connections with animated ring */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "bg-background! duration-200!-left-[6px]! h-2.5 w-2.5 border-2 transition-colors",
          selected
            ? "border-primary scale-110"
            : "border-muted-foreground/50 hover:border-primary",
        )}
      />

      {/* Main header block */}
      <div className="border-border/60 flex items-center justify-between border-b px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          {/* Method Badge with glowing indicator dot */}
          <Badge
            variant="outline"
            className={cn(
              "flex shrink-0 items-center gap-1 px-1.5 py-0 text-[9px] font-extrabold tracking-wider",
              theme.badge,
            )}
          >
            <span
              className={cn(
                "absolute h-1 w-1 shrink-0 animate-ping rounded-full",
                theme.dot,
              )}
            />
            <span
              className={cn(
                "relative h-1 w-1 shrink-0 rounded-full",
                theme.dot,
              )}
            />
            {method}
          </Badge>

          {/* Status code selector view */}
          <span
            className={cn(
              "flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-px font-mono text-[9px] font-bold",
              statusBadgeClass,
            )}
          >
            <StatusIcon className="h-2.5 w-2.5 shrink-0" />
            {data.statusCode}
          </span>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={data.isEnabled}
            onCheckedChange={handleToggle}
            aria-label="Toggle Route Enabled"
            className="-mr-1.5 scale-[0.7]"
          />
        </div>
      </div>

      {/* Path & Config Display */}
      <div className="bg-muted/15 flex min-h-12 flex-1 flex-col justify-between gap-1.5 px-2.5 py-2">
        <span className="text-foreground line-clamp-1 font-mono text-[10px] leading-normal font-semibold break-all">
          {data.path}
        </span>

        {/* Info indicators */}
        {(schemaKeysCount > 0 || headersKeysCount > 0) && (
          <div className="flex flex-wrap gap-1">
            {schemaKeysCount > 0 && (
              <span className="bg-primary/10 text-primary border-primary/10 py-0.2 inline-flex items-center gap-0.5 rounded border px-1 text-[8px] font-semibold">
                <RiCodeLine className="h-2.5 w-2.5 shrink-0" />
                <span>JSON ({schemaKeysCount})</span>
              </span>
            )}
            {headersKeysCount > 0 && (
              <span className="py-0.2 inline-flex items-center gap-0.5 rounded border border-violet-500/10 bg-violet-500/10 px-1 text-[8px] font-semibold text-violet-600 dark:text-violet-400">
                <RiEqualizerLine className="h-2.5 w-2.5 shrink-0" />
                <span>Headers ({headersKeysCount})</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Node Footer indicators */}
      {(hasLatency || hasErrors) && (
        <div className="bg-muted/40 border-border/50 text-muted-foreground flex items-center gap-2.5 rounded-b-lg border-t px-2.5 py-1 text-[9px] font-semibold">
          {hasLatency && (
            <div className="flex items-center gap-0.5">
              <RiTimeLine className="h-3 w-3 shrink-0 text-amber-500" />
              <span>
                {data.latencyMin === data.latencyMax
                  ? `${data.latencyMin}ms`
                  : `${data.latencyMin}-${data.latencyMax}ms`}
              </span>
            </div>
          )}
          {hasErrors && (
            <div className="flex items-center gap-0.5">
              <RiAlertLine className="h-3 w-3 shrink-0 animate-bounce text-rose-500" />
              <span>{data.errorRate}% Err</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "bg-background! -right-1.5! h-2.5 w-2.5 border-2 transition-colors duration-200",
          selected
            ? "border-primary scale-110"
            : "border-muted-foreground/50 hover:border-primary",
        )}
      />
    </div>
  );
}

export default React.memo(RouteNode);
