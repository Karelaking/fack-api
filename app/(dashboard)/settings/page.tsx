import React from "react";

export const metadata = {
  title: "Settings | Fack API",
  description: "Manage your workspace settings.",
};

export default function SettingsPage(): React.JSX.Element {
  return (
    <div className="flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your workspace preferences, members, and billing details.
        </p>
      </div>

      <div className="border-border/50 bg-card rounded-xl border shadow-sm">
        <div className="border-border/50 border-b p-6">
          <h2 className="text-lg font-medium">Workspace Name</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            This is your workspace&apos;s visible name within Fack API.
          </p>
          <div className="mt-4 flex max-w-sm items-center gap-2">
            <input
              type="text"
              defaultValue="Mradul Kumar's Workspace"
              className="border-border/50 bg-background text-foreground focus:ring-primary h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none"
            />
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-4 text-sm font-medium shadow transition-colors">
              Save
            </button>
          </div>
        </div>

        <div className="border-border/50 border-b p-6">
          <h2 className="text-lg font-medium">Danger Zone</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Irreversible and destructive actions.
          </p>
          <div className="mt-4">
            <button className="border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center rounded-md border bg-transparent px-4 py-2 text-sm font-medium transition-colors">
              Delete Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
