import Link from "next/link";
import { RiCompassLine, RiArrowLeftLine } from "@remixicon/react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Root-level 404 page.
 * Catches any unmatched routes across the entire application.
 */
export default function NotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
        <RiCompassLine className="text-muted-foreground h-10 w-10" />
      </div>
      <div className="text-center">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          404
        </h1>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          The page you&apos;re looking for doesn&apos;t exist. It may have been
          moved or the URL might be incorrect.
        </p>
      </div>
      <Link
        href="/"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <RiArrowLeftLine className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
