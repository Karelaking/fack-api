"use client";

import * as React from "react";
import { HeaderNamespaceBadge } from "./HeaderNamespaceBadge";
import { HeaderCanvasControls } from "./HeaderCanvasControls";
import { HeaderAddRouteButton } from "./HeaderAddRouteButton";
import { HeaderNewProjectButton } from "./HeaderNewProjectButton";

export function HeaderActions(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <HeaderNamespaceBadge />
      <HeaderCanvasControls />
      <HeaderAddRouteButton />
      <HeaderNewProjectButton />
    </div>
  );
}
