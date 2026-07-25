import Link from "next/link";
import { RiFolder3Line, RiArrowLeftLine } from "@remixicon/react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Shown when a project slug doesn't match any workspace in the database.
 */
export default function ProjectNotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <RiFolder3Line className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="text-center">
        <h2 className="text-foreground text-xl font-semibold">
          Workspace not found
        </h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          The workspace you&apos;re looking for doesn&apos;t exist or may have
          been deleted.
        </p>
      </div>
      <Link
        href="/"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <RiArrowLeftLine className="mr-2 h-4 w-4" />
        Back to Workspaces
      </Link>
    </div>
  );
}
