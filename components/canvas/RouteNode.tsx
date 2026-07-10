"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import { AlertOctagon, Clock, Activity, CheckCircle, ShieldAlert, Zap, Code, SlidersHorizontal } from "lucide-react";
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
export function RouteNode({ data, selected }: RouteNodeProps) {
  const method = data.method.toUpperCase();

  // Method-specific color configurations: [leftBorder, text/badge, bg, shadow/glow, dot]
  const themeMap: Record<string, {
    border: string;
    text: string;
    bg: string;
    glow: string;
    dot: string;
    badge: string;
  }> = {
    GET: {
      border: "border-l-emerald-500",
      text: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/5",
      glow: "hover:shadow-emerald-500/10 hover:border-emerald-500/40",
      dot: "bg-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
    },
    POST: {
      border: "border-l-blue-500",
      text: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/5",
      glow: "hover:shadow-blue-500/10 hover:border-blue-500/40",
      dot: "bg-blue-500",
      badge: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
    },
    PUT: {
      border: "border-l-amber-500",
      text: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/5",
      glow: "hover:shadow-amber-500/10 hover:border-amber-500/40",
      dot: "bg-amber-500",
      badge: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    },
    DELETE: {
      border: "border-l-rose-500",
      text: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-500/5",
      glow: "hover:shadow-rose-500/10 hover:border-rose-500/40",
      dot: "bg-rose-500",
      badge: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
    },
    PATCH: {
      border: "border-l-purple-500",
      text: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/5",
      glow: "hover:shadow-purple-500/10 hover:border-purple-500/40",
      dot: "bg-purple-500",
      badge: "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
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
  let statusBadgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
  let StatusIcon = Activity;

  if (data.statusCode >= 200 && data.statusCode < 300) {
    statusBadgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10";
    StatusIcon = CheckCircle;
  } else if (data.statusCode >= 300 && data.statusCode < 400) {
    statusBadgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10";
    StatusIcon = Zap;
  } else if (data.statusCode >= 400 && data.statusCode < 500) {
    statusBadgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10";
    StatusIcon = AlertOctagon;
  } else if (data.statusCode >= 500) {
    statusBadgeClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10 animate-pulse";
    StatusIcon = ShieldAlert;
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
        "flex flex-col bg-background/80 backdrop-blur-md border border-border/80 border-l-4 rounded-lg shadow-sm w-60 transition-all duration-200 cursor-pointer select-none",
        theme.border,
        theme.glow,
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-md shadow-primary/5 -translate-y-0.5 scale-[1.01]"
          : "hover:-translate-y-0.5 hover:shadow-md",
        !data.isEnabled && "opacity-50 grayscale-[20%]"
      )}
    >
      {/* Node handles for connections with animated ring */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "w-2.5 h-2.5 !bg-background border-2 transition-colors duration-200 !-left-[6px]",
          selected ? "border-primary scale-110" : "border-muted-foreground/50 hover:border-primary"
        )}
      />

      {/* Main header block */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          {/* Method Badge with glowing indicator dot */}
          <Badge variant="outline" className={cn("font-extrabold tracking-wider text-[9px] py-0 px-1.5 flex items-center gap-1 shrink-0", theme.badge)}>
            <span className={cn("h-1 w-1 rounded-full shrink-0 animate-ping absolute", theme.dot)} />
            <span className={cn("h-1 w-1 rounded-full shrink-0 relative", theme.dot)} />
            {method}
          </Badge>

          {/* Status code selector view */}
          <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.25 rounded border flex items-center gap-0.5 shrink-0", statusBadgeClass)}>
            <StatusIcon className="h-2.5 w-2.5 shrink-0" />
            {data.statusCode}
          </span>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <Switch checked={data.isEnabled} onCheckedChange={handleToggle} className="scale-[0.7] -mr-1.5" />
        </div>
      </div>

      {/* Path & Config Display */}
      <div className="px-2.5 py-2 flex-1 flex flex-col justify-between bg-muted/15 min-h-[48px] gap-1.5">
        <span className="font-mono text-[10px] font-semibold text-foreground break-all line-clamp-1 leading-normal">
          {data.path}
        </span>
        
        {/* Info indicators */}
        {(schemaKeysCount > 0 || headersKeysCount > 0) && (
          <div className="flex flex-wrap gap-1">
            {schemaKeysCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold bg-primary/10 text-primary border border-primary/10 px-1 py-0.2 rounded">
                <Code className="h-2.5 w-2.5 shrink-0" />
                <span>JSON ({schemaKeysCount})</span>
              </span>
            )}
            {headersKeysCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10 px-1 py-0.2 rounded">
                <SlidersHorizontal className="h-2.5 w-2.5 shrink-0" />
                <span>Headers ({headersKeysCount})</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Node Footer indicators */}
      {(hasLatency || hasErrors) && (
        <div className="flex items-center gap-2.5 px-2.5 py-1 bg-muted/40 border-t border-border/50 rounded-b-lg text-[9px] text-muted-foreground font-semibold">
          {hasLatency && (
            <div className="flex items-center gap-0.5">
              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
              <span>
                {data.latencyMin === data.latencyMax
                  ? `${data.latencyMin}ms`
                  : `${data.latencyMin}-${data.latencyMax}ms`}
              </span>
            </div>
          )}
          {hasErrors && (
            <div className="flex items-center gap-0.5">
              <AlertOctagon className="h-3 w-3 text-rose-500 shrink-0 animate-bounce" />
              <span>{data.errorRate}% Err</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "w-2.5 h-2.5 !bg-background border-2 transition-colors duration-200 !-right-[6px]",
          selected ? "border-primary scale-110" : "border-muted-foreground/50 hover:border-primary"
        )}
      />
    </div>
  );
}

export default React.memo(RouteNode);
