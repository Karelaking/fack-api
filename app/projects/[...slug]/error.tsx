"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RiAlertLine, RiRefreshLine, RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

/**
 * Error boundary for the project workspace.
 * Catches runtime errors (DB failures, action errors, etc.) and provides
 * a retry mechanism without navigating away.
 */
export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ProjectError]", error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
      <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
        <RiAlertLine className="text-destructive h-8 w-8" />
      </div>
      <div className="text-center">
        <h2 className="text-foreground text-xl font-semibold">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          An unexpected error occurred while loading this workspace. This is
          usually temporary — try again or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 mt-1 font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="default" size="sm">
          <RiRefreshLine className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Back to Workspaces
        </Link>
      </div>
    </div>
  );
}
