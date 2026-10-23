"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiDownload2Line,
  RiLoader2Line,
  RiUpload2Line,
  RiHardDrive2Line,
  RiCloudLine,
} from "@remixicon/react";

import type { StorageStatus } from "@/lib/storage/status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StorageSectionProps {
  initialStatus: StorageStatus;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

/**
 * Storage & Data settings: shows where project data lives (local disk vs
 * remote database), how big it is, and offers backup download / import —
 * which is also how data is moved between a local install and the cloud.
 */
export function StorageSection({
  initialStatus,
}: StorageSectionProps): React.JSX.Element {
  const router = useRouter();
  const [status, setStatus] = React.useState<StorageStatus>(initialStatus);
  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isLocal = status.mode === "local";

  async function onImportFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file later.
    event.target.value = "";
    if (!file || importing) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);
      const response = await fetch("/api/settings/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", data }),
      });
      const payload = (await response.json()) as {
        error?: string;
        tables?: Record<string, number>;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Import failed");
      }

      const total = Object.values(payload.tables ?? {}).reduce(
        (sum, value) => sum + value,
        0,
      );
      toast.success(`Backup imported`, {
        description: `${total} rows merged into this database.`,
      });
      router.refresh();
    } catch (error) {
      toast.error("Couldn't import backup", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setImporting(false);
    }
  }

  const rows: Array<{ label: string; value: string }> = [
    {
      label: isLocal ? "Database file" : "Remote database",
      value: status.target,
    },
    { label: "Local data directory", value: status.dataDir },
    { label: "Database size", value: formatBytes(status.dbSizeBytes) },
    { label: "Projects", value: String(status.counts.projects) },
    { label: "Notes", value: String(status.counts.notes) },
    { label: "Last backup", value: formatDate(status.lastBackupAt) },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isLocal ? (
              <RiHardDrive2Line
                className="text-primary h-5 w-5"
                aria-hidden="true"
              />
            ) : (
              <RiCloudLine
                className="text-primary h-5 w-5"
                aria-hidden="true"
              />
            )}
            <CardTitle>Storage &amp; Data</CardTitle>
            <Badge variant={isLocal ? "secondary" : "default"}>
              {isLocal ? "Local · Private" : "Cloud · Synced"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {isLocal
            ? "No database API keys are configured, so everything — projects, notes, and settings — is stored on this device only. Nothing leaves your machine unless you download a backup or add database API keys."
            : "Database API keys are configured, so project data is stored in the remote database and is reachable from any device you sign in on."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="border-border/50 flex items-center justify-between gap-3 border-b pb-1.5 last:border-b-0 sm:last:border-b"
            >
              <dt className="text-muted-foreground text-sm">{row.label}</dt>
              <dd className="max-w-[60%] truncate text-sm font-medium">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/api/settings/storage?download=1";
                setStatus((prev) => ({
                  ...prev,
                  lastBackupAt: new Date().toISOString(),
                }));
              }}
            >
              <RiDownload2Line aria-hidden="true" />
              Download backup
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? (
                <RiLoader2Line className="animate-spin" aria-hidden="true" />
              ) : (
                <RiUpload2Line aria-hidden="true" />
              )}
              Import backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Backup file"
              onChange={(event) => void onImportFile(event)}
            />
          </div>

          <p className="text-muted-foreground text-xs">
            {isLocal
              ? "Switching to the cloud: add DATABASE_URL and DATABASE_AUTH_TOKEN to your .env, restart the app, then use Import backup here to copy your data over. Keep downloading backups for a private on-disk copy."
              : "Switching back to local: remove the database API keys from your .env and restart — your data stays in the remote database until you import a backup on the local install."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
