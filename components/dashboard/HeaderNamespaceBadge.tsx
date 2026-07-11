"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNamespaceBadge(): React.JSX.Element | null {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectPage = segments[0] === "projects" && segments[1];

  if (!isProjectPage) return null;

  const slug = segments[1];

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
