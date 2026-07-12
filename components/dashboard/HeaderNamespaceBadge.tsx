"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNamespaceBadge(): React.JSX.Element | null {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "projects" || segments.length < 2) return null;

  const lastSegment = segments[segments.length - 1];
  const subpages = new Set(["canvas", "endpoints", "logs", "settings"]);
  let projectSlugSegments = segments.slice(1);

  if (subpages.has(lastSegment)) {
    projectSlugSegments = segments.slice(1, -1);
  }

  const slug = projectSlugSegments.join("/");

  return (
    <Link
      href={`/projects/${slug}/settings`}
      className="bg-muted hover:bg-accent border-border group mr-1 hidden shrink-0 cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[10px] transition-all sm:flex"
      title="Click to change namespace settings"
    >
      <span className="text-muted-foreground group-hover:text-foreground font-sans">
        Namespace:
      </span>
      <span className="text-foreground group-hover:text-primary font-semibold">
        /mock/{slug}
      </span>
    </Link>
  );
}
