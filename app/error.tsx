"use client";

import { useEffect } from "react";
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

/**
 * Root-level error boundary.
 * Catches any unhandled runtime error across the entire application.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
      <div className="bg-destructive/10 flex h-20 w-20 items-center justify-center rounded-full">
        <RiErrorWarningLine className="text-destructive h-10 w-10" />
      </div>
      <div className="text-center">
        <h2 className="text-foreground text-2xl font-semibold">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          An unexpected error occurred. This is usually temporary — please try
          again.
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 mt-1 font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="default" size="sm">
        <RiRefreshLine className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
