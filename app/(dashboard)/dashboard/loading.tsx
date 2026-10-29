import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the workspace browser. Mirrors the real page's header, toolbar,
 * overview rail, and card grid so the first paint does not shift when data
 * arrives.
 */
export default function DashboardLoading(): React.JSX.Element {
  return (
    <output
      aria-live="polite"
      className="mx-auto block w-full max-w-[1760px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-12 2xl:px-16 2xl:py-10 motion-reduce:[&_[data-slot=skeleton]]:animate-none"
    >
      <span className="sr-only">Loading workspaces…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <div className="flex items-center gap-2 sm:ml-auto">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-6 lg:gap-8">
        <div className="order-2 w-full space-y-5 md:order-1 md:w-[280px] lg:w-[320px] xl:w-[340px] 2xl:w-[360px]">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>

        <div className="min-w-0 flex-1 space-y-4 md:space-y-5">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-card/30 border-border/50 flex flex-col gap-4 rounded-xl border p-5"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-lg" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-32 max-w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="border-border/50 flex items-center gap-4 border-t pt-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </output>
  );
}
