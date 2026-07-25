import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the project workspace.
 * Shows while the project layout is validating the project and rendering children.
 */
export default function ProjectLoading() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Simulate a canvas-like loading state (most common subpage) */}
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full" />
          </div>
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="mx-auto h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
