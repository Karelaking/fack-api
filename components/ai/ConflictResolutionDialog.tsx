"use client";

import * as React from "react";
import { RiAlertFill } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import type { RouteConflict } from "@/lib/ai/types";

interface ConflictResolutionDialogProps {
  conflicts: RouteConflict[];
  resolutions: Record<string, "replace" | "skip" | "modify">;
  onResolutionChange: (
    conflictKey: string,
    resolution: "replace" | "skip" | "modify",
  ) => void;
}

export const ConflictResolutionDialog = ({
  conflicts,
  resolutions,
  onResolutionChange,
}: ConflictResolutionDialogProps): React.JSX.Element => {
  if (conflicts.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <RiAlertFill className="size-4 shrink-0" />
        <span className="text-xs font-semibold tracking-wider uppercase">
          {conflicts.length} Route Collision{conflicts.length > 1 ? "s" : ""}{" "}
          Detected
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        The following routes already exist in this project. Choose how Fack AI
        should resolve each collision before applying changes:
      </p>

      <div className="flex flex-col gap-2">
        {conflicts.map((conflict) => {
          const key = `${conflict.method}:${conflict.path}`;
          const currentResolution =
            resolutions[key] || conflict.suggestedResolution;

          return (
            <div
              key={key}
              className="bg-card border-border/80 flex flex-col items-start justify-between gap-2.5 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <span className="font-mono text-[11px] font-bold">
                    {conflict.method}
                  </span>
                </Badge>
                <span className="text-foreground font-mono text-xs">
                  {conflict.path}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onResolutionChange(key, "replace")}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    currentResolution === "replace"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "border-border hover:bg-muted text-muted-foreground border"
                  }`}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => onResolutionChange(key, "skip")}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    currentResolution === "skip"
                      ? "bg-slate-700 text-white shadow-xs"
                      : "border-border hover:bg-muted text-muted-foreground border"
                  }`}
                >
                  Keep Existing
                </button>
                <button
                  type="button"
                  onClick={() => onResolutionChange(key, "modify")}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    currentResolution === "modify"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "border-border hover:bg-muted text-muted-foreground border"
                  }`}
                >
                  Create as /v2
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
