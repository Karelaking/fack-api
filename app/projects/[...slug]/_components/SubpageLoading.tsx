import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectSubpage } from "@/lib/utils/project-slug";

/**
 * Subpage-specific loading skeletons.
 * Each subpage gets a tailored skeleton that matches its layout.
 */
export function SubpageLoading({ subpage }: { subpage: ProjectSubpage }) {
  switch (subpage) {
    case "canvas":
      return <CanvasLoading />;
    case "endpoints":
      return <EndpointsLoading />;
    case "logs":
      return <LogsLoading />;
    case "settings":
      return <SettingsLoading />;
    default:
      return <GenericLoading />;
  }
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function EndpointsLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-3 rounded-lg border p-4"
          >
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-5 w-48" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-3 border-b p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="flex-1 animate-pulse space-y-1 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded px-3 py-2">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-48" />
            <div className="ml-auto">
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-40" />
      <div className="border-border space-y-4 rounded-lg border p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

function GenericLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="h-6 w-32" />
    </div>
  );
}
