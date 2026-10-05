import React from "react";
import { RiEarthLine } from "@remixicon/react";

export const metadata = {
  title: "Custom Domains | Fack API",
  description: "Manage custom domains for your mock API endpoints.",
};

export default function DomainsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Custom Domains
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Map your own custom domains to your Fack API mock endpoints for
            white-labeled testing.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors">
          Add Domain
        </button>
      </div>

      <div className="border-border/50 bg-card flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm">
        <RiEarthLine className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">No custom domains yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          You are currently using the default fack-api.dev subdomain. Add a
          custom domain to brand your mock endpoints.
        </p>
      </div>
    </div>
  );
}
