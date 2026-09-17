import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"textarea"> & {
  variant?: "default" | "mono";
}) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        variant === "mono" && "font-mono",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
