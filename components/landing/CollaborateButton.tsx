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
  /**
   * Pill scale. `md` is the navigation-sized default; `lg` is the hero's
   * primary action, where the pill and its arrow badge grow together so the
   * badge still fits the pill's padding.
   */
  size?: "md" | "lg";
  className?: string;
};

const SIZE_CLASSES: Record<
  NonNullable<CollaborateButtonProps["size"]>,
  { button: string; badge: string; glyph: number }
> = {
  md: {
    button: "h-10 ps-4 pe-12 text-xs hover:ps-12 hover:pe-4",
    badge: "size-8 right-1 group-hover:right-[calc(100%-36px)]",
    glyph: 16,
  },
  lg: {
    button: "h-12 ps-5 pe-14 text-sm hover:ps-14 hover:pe-5",
    badge: "size-10 right-1 group-hover:right-[calc(100%-44px)]",
    glyph: 20,
  },
};

/**
 * Pill call-to-action button with an animated arrow, shared across the landing page.
 */
export const CollaborateButton = ({
  href,
  label,
  external = false,
  size = "md",
  className = "",
}: CollaborateButtonProps): React.JSX.Element => {
  const scale = SIZE_CLASSES[size];

  const classes = cn(
    "group bg-foreground text-background hover:bg-foreground/90 relative inline-flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent p-1 font-semibold shadow-xs transition-all duration-500 select-none",
    scale.button,
    className,
  );

  const content = (
    <>
      <span className="relative z-10 whitespace-nowrap transition-all duration-500">
        {label}
      </span>
      <div
        className={cn(
          "bg-background text-foreground absolute flex shrink-0 items-center justify-center rounded-full transition-all duration-500 group-hover:rotate-45",
          scale.badge,
        )}
      >
        <ArrowUpRight size={scale.glyph} />
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
