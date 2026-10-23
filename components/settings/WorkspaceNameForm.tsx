"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RiLoader2Line, RiSaveLine } from "@remixicon/react";

import { saveWorkspaceName } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkspaceNameFormProps {
  initialName: string;
}

/** Persists the workspace name to the local config file. */
export function WorkspaceNameForm({
  initialName,
}: WorkspaceNameFormProps): React.JSX.Element {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      await saveWorkspaceName(name);
      toast.success("Workspace name saved");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't save workspace name", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 max-w-sm">
      <label htmlFor="workspace-name" className="sr-only">
        Workspace name
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="workspace-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your workspace name"
          maxLength={100}
          className="bg-background"
        />
        <Button
          type="submit"
          disabled={saving || name.trim().length === 0 || name === initialName}
        >
          {saving ? (
            <RiLoader2Line className="animate-spin" aria-hidden="true" />
          ) : (
            <RiSaveLine aria-hidden="true" />
          )}
          Save
        </Button>
      </div>
    </form>
  );
}
