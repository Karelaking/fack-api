import { RiLoader2Line } from "@remixicon/react";

/**
 * Root-level loading state.
 * Displays a neutral, lightweight spinner during top-level route transitions.
 */
export default function RootLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <RiLoader2Line className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}
