"use server";

import { requireUserId } from "@/lib/auth";
import {
  readWorkspaceConfig,
  writeWorkspaceConfig,
  type WorkspaceConfig,
} from "@/lib/storage/config-store";

/**
 * Workspace-level preferences, persisted to the local config file in the
 * OS data directory (private to this machine in local mode).
 */

export async function getWorkspaceConfig(): Promise<WorkspaceConfig> {
  await requireUserId();
  return readWorkspaceConfig();
}

export async function saveWorkspaceName(
  name: string,
): Promise<WorkspaceConfig> {
  await requireUserId();

  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    throw new Error("Workspace name must be between 1 and 100 characters");
  }

  return writeWorkspaceConfig({ workspaceName: trimmed });
}
