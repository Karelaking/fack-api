import React from "react";
import { RiKey2Line } from "@remixicon/react";

export const metadata = {
  title: "API Keys | Fack API",
  description: "Manage programmatic access to your Fack API workspace.",
};

export default function ApiKeysPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate and manage API keys to programmatically manage your mock
            projects and endpoints.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors">
          Create Key
        </button>
      </div>

      <div className="border-border/50 bg-card flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm">
        <RiKey2Line className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">No API keys created</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Create an API key to securely authenticate and access the Fack API
          platform programmatically.
        </p>
      </div>
    </div>
  );
}
