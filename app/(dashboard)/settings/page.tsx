import React from "react";

import { readWorkspaceConfig } from "@/lib/storage/config-store";
import { getStorageStatus } from "@/lib/storage/status";
import { StorageSection } from "@/components/settings/StorageSection";
import { WorkspaceNameForm } from "@/components/settings/WorkspaceNameForm";

export const metadata = {
  title: "Settings | Fack API",
  description: "Manage your workspace settings.",
};

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const status = await getStorageStatus();
  const config = readWorkspaceConfig();

  return (
    <div className="flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage where your data lives and how your workspace is identified.
        </p>
      </div>

      <StorageSection initialStatus={status} />

      <div className="border-border/50 bg-card rounded-xl border shadow-sm">
        <div className="border-border/50 border-b p-6">
          <h2 className="text-lg font-medium">Workspace Name</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            This is your workspace&apos;s visible name within Fack API.
          </p>
          <WorkspaceNameForm
            initialName={config.workspaceName ?? "My Workspace"}
          />
        </div>

        <div className="border-border/50 border-b p-6">
          <h2 className="text-lg font-medium">Danger Zone</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Irreversible and destructive actions.
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center rounded-md border bg-transparent px-4 py-2 text-sm font-medium shadow transition-colors"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
