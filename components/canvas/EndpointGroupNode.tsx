"use client";

import * as React from "react";
import { NodeResizer } from "@xyflow/react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EndpointGroupNodeProps {
  data: {
    label: string;
    basePath: string;
  };
  selected: boolean;
}

/**
 * Premium Custom Bounding Container Node for Endpoints.
 * Uses a grid background style, glass header, and dashed glowing border to group routes cleanly.
 */
export function EndpointGroupNode({ data, selected }: EndpointGroupNodeProps) {
  return (
    <div
      className={cn(
        "h-full w-full rounded-2xl border-2 border-dashed p-4 transition-all duration-300 relative bg-muted/5",
        selected
          ? "border-primary/50 bg-muted/10 shadow-lg shadow-primary/2"
          : "border-border/80 hover:border-muted-foreground/30"
      )}
    >
      {/* Dynamic Grid Background Pattern */}
      <div className="absolute inset-0 -z-10 rounded-2xl opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] dark:opacity-[0.05]" />

      {/* NodeResizer for scaling bounding containers */}
      <NodeResizer
        minWidth={280}
        minHeight={160}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-sm hover:scale-110 transition-transform"
      />

      <div
        className="flex items-center gap-2 text-muted-foreground border-b border-border/40 pb-2 mb-4 shrink-0"
        style={{ contentVisibility: "auto" }}
      >
        <FolderOpen className="h-4 w-4 text-primary shrink-0 animate-pulse" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-foreground truncate">
            {data.label}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground truncate">
            {data.basePath || "/"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EndpointGroupNode);
