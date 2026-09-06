"use client";

import * as React from "react";
import { NodeResizer } from "@xyflow/react";
import { RiFolderOpenLine } from "@remixicon/react";
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
export function EndpointGroupNode({
  data,
  selected,
}: EndpointGroupNodeProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative h-full w-full border-2 border-dashed p-4 transition-all duration-300",
        "dark:bg-muted/5 bg-white/70",
        selected
          ? "border-primary/60 dark:bg-muted/10 shadow-primary/5 bg-white/95 shadow-lg"
          : "dark:border-border/80 dark:hover:border-muted-foreground/30 border-slate-300 hover:border-slate-400",
      )}
    >
      {/* Dynamic Grid Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[14px_24px] opacity-[0.04] dark:opacity-[0.05]" />

      {/* NodeResizer for scaling bounding containers */}
      <NodeResizer
        minWidth={280}
        minHeight={160}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-xs hover:scale-110 transition-transform"
      />

      <div
        className="text-muted-foreground dark:border-border/40 mb-4 flex shrink-0 items-center gap-2 border-b border-slate-200 pb-2"
        style={{ contentVisibility: "auto" }}
      >
        <RiFolderOpenLine className="text-primary h-4 w-4 shrink-0 animate-pulse" />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-[10px] font-extrabold tracking-wider uppercase">
            {data.label}
          </span>
          <span className="text-muted-foreground truncate font-mono text-[9px]">
            {data.basePath || "/"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EndpointGroupNode);
