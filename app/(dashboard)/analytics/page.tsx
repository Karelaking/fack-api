import React from "react";
import { RiBarChartBoxLine } from "@remixicon/react";

export const metadata = {
  title: "Analytics | Fack API",
  description: "View usage statistics and traffic trends.",
};

export default function AnalyticsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View aggregated usage metrics, bandwidth, and latency for your mock
          endpoints.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Requests", value: "0" },
          { label: "Bandwidth Used", value: "0 B" },
          { label: "Avg Latency", value: "0 ms" },
        ].map((stat, i) => (
          <div
            key={i}
            className="border-border/50 bg-card rounded-xl border p-6 shadow-sm"
          >
            <p className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="border-border/50 bg-card flex min-h-[300px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm">
        <RiBarChartBoxLine className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">Insufficient Data</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Analytics graphs will appear here once your APIs accumulate enough
          traffic over the past 24 hours.
        </p>
      </div>
    </div>
  );
}
