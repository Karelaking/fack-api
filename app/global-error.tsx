"use client";

import { useEffect } from "react";
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

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
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <RiErrorWarningLine className="text-destructive size-10" />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <Button onClick={reset} size="sm">
          <RiRefreshLine data-icon="inline-start" />
          Try Again
        </Button>
      </body>
    </html>
  );
}
