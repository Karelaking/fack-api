"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import { Play, Pause, AlertOctagon, Clock, Code } from "lucide-react";
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
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  onSelectRoute: (id: string) => void;
}

interface RouteNodeProps {
  data: RouteNodeData;
  selected: boolean;
}

/**
 * Custom React Flow Node representing an API route.
 * Shows status codes, method badges, quick toggles, and click callbacks to edit.
 */
export function RouteNode({ data, selected }: RouteNodeProps) {
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
    PATCH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const handleToggle = (checked: boolean) => {
    data.onToggleEnabled(data.id, checked);
  };

  const hasLatency = (data.latencyMin ?? 0) > 0 || (data.latencyMax ?? 0) > 0;
  const hasErrors = (data.errorRate ?? 0) > 0;

  return (
    <div
      className={cn(
        "flex flex-col bg-card border rounded-lg shadow-sm w-72 transition-all cursor-pointer hover:border-muted-foreground/30",
        selected ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.01]" : "border-border",
        !data.isEnabled && "opacity-60"
      )}
    >
      {/* Node handles for connections */}
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" />

      {/* Main header block */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("font-bold tracking-wider text-[10px]", methodColors[data.method] ?? "bg-slate-500/10")}>
            {data.method}
          </Badge>
          <span className="text-xs font-mono font-bold bg-muted border border-border px-1.5 py-0.5 rounded text-foreground">
            {data.statusCode}
          </span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch checked={data.isEnabled} onCheckedChange={handleToggle} className="scale-75" />
        </div>
      </div>

      {/* Path Display */}
      <div className="p-3 bg-muted/30 flex-1">
        <span className="font-mono text-xs font-semibold text-foreground break-all line-clamp-2">
          {data.path}
        </span>
      </div>

      {/* Node Footer indicators */}
      {(hasLatency || hasErrors) && (
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-muted/50 border-t border-border rounded-b-lg text-[10px] text-muted-foreground font-semibold">
          {hasLatency && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              <span>
                {data.latencyMin === data.latencyMax
                  ? `${data.latencyMin}ms`
                  : `${data.latencyMin}-${data.latencyMax}ms`}
              </span>
            </div>
          )}
          {hasErrors && (
            <div className="flex items-center gap-1">
              <AlertOctagon className="h-3 w-3 text-destructive" />
              <span>Err {data.errorRate}%</span>
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-muted-foreground" />
    </div>
  );
}
export default React.memo(RouteNode);
