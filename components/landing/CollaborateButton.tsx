"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CollaborateButtonProps = {
  href: string;
  label: string;
  /** Renders an external anchor with `target="_blank"` when true. */
  external?: boolean;
  className?: string;
};

/**
 * Pill call-to-action button with an animated arrow, shared across the landing page.
 */
export const CollaborateButton = ({
  href,
  label,
  external = false,
  className = "",
}: CollaborateButtonProps): React.JSX.Element => {
  const classes = cn(
    "group bg-foreground text-background hover:bg-foreground/90 relative inline-flex h-10 w-fit cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent p-1 ps-4 pe-12 text-xs font-semibold shadow-xs transition-all duration-500 select-none hover:ps-12 hover:pe-4",
    className,
  );

  const content = (
    <>
      <span className="relative z-10 whitespace-nowrap transition-all duration-500">
        {label}
      </span>
      <div className="bg-background text-foreground absolute right-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </div>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
};
