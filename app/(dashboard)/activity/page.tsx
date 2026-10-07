import React from "react";
import { RiFileList3Line } from "@remixicon/react";

export const metadata = {
  title: "Activity Logs | Fack API",
  description: "Monitor incoming requests to your mock APIs.",
};

export default function ActivityLogsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor all incoming requests and outgoing responses across your mock
          APIs in real-time.
        </p>
      </div>

      <div className="border-border/50 bg-card flex min-h-100 flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm">
        <RiFileList3Line className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">No activity recorded yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Once your mock APIs start receiving traffic, detailed request and
          response logs will appear here.
        </p>
      </div>
    </div>
  );
}
