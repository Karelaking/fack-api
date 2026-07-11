"use client";

import * as React from "react";
import { HeaderNamespaceBadge } from "./HeaderNamespaceBadge";
import { HeaderCanvasControls } from "./HeaderCanvasControls";
import { HeaderAddRouteButton } from "./HeaderAddRouteButton";
import { HeaderNewProjectButton } from "./HeaderNewProjectButton";

export function HeaderActions(): React.JSX.Element {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <HeaderNamespaceBadge />
      <HeaderCanvasControls />
      <HeaderAddRouteButton />
      <HeaderNewProjectButton />
    </div>
  );
}
