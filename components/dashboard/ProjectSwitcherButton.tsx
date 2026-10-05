"use client";

import * as React from "react";
import { RiArrowDownSLine, RiSwapBoxLine } from "@remixicon/react";

export function ProjectSwitcherButton() {
  return (
    <button
      type="button"
      className="text-foreground hover:bg-muted flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
    >
      <RiSwapBoxLine className="text-muted-foreground h-4 w-4" />
      <span>Switch Project</span>
      <RiArrowDownSLine className="text-muted-foreground h-4 w-4" />
    </button>
  );
}
