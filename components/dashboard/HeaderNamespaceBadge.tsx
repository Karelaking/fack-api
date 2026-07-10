"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNamespaceBadge() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectPage = segments[0] === "projects" && segments[1];

  if (!isProjectPage) return null;

  const slug = segments[1];

  return (
    <Link
      href={`/projects/${slug}/settings`}
      className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] bg-muted hover:bg-accent px-2.5 py-1 rounded border border-border transition-all mr-1 group cursor-pointer shrink-0"
      title="Click to change namespace settings"
    >
      <span className="text-muted-foreground font-sans group-hover:text-foreground">Namespace:</span>
      <span className="font-semibold text-foreground group-hover:text-primary">/mock/{slug}</span>
    </Link>
  );
}
