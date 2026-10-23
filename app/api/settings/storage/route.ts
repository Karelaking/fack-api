import { NextRequest, NextResponse } from "next/server";

import { requireUserId, authErrorResponse } from "@/lib/auth";
import { getStorageStatus } from "@/lib/storage/status";
import { createBackup, restoreBackup } from "@/lib/storage/backup";
import { writeWorkspaceConfig } from "@/lib/storage/config-store";

/**
 * /api/settings/storage — storage status, backup download, and backup import.
 *
 * GET  → storage status (mode, location, sizes, counts).
 * GET  ?download=1 → full JSON backup as a file download.
 * POST { action: "import", data } → merge a previously exported backup.
 *
 * The auth token of a remote database is never included in any response.
 */

export async function GET(request: NextRequest) {
  try {
    await requireUserId();

    if (request.nextUrl.searchParams.get("download") === "1") {
      const backup = await createBackup();
      writeWorkspaceConfig({ lastBackupAt: backup.exportedAt });

      return new NextResponse(JSON.stringify(backup, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="fack-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.json"`,
        },
      });
    }

    return NextResponse.json(await getStorageStatus());
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to read storage status" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    if (body?.action !== "import") {
      return NextResponse.json(
        { error: "Unsupported action" },
        { status: 400 },
      );
    }

    const result = await restoreBackup(body.data, userId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    const message =
      error instanceof Error ? error.message : "Failed to import backup";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
