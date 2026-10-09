/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { mockStates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface MockStateItem {
  id: string; // The primary key (from the payload, or generated)
  [key: string]: any;
}

/**
 * Persist a new item into the stateful mock storage.
 */
export async function saveMockItem(
  projectId: string,
  collection: string,
  payload: Record<string, any>,
  itemKey?: string,
): Promise<MockStateItem> {
  const finalKey = itemKey ?? payload.id ?? nanoid();
  const finalPayload = { ...payload, id: finalKey };

  // Delete existing if any (upsert behavior)
  await db
    .delete(mockStates)
    .where(
      and(
        eq(mockStates.projectId, projectId),
        eq(mockStates.collection, collection),
        eq(mockStates.itemKey, finalKey),
      ),
    );

  await db.insert(mockStates).values({
    id: nanoid(),
    projectId,
    collection,
    itemKey: finalKey,
    data: JSON.stringify(finalPayload),
  });

  return finalPayload;
}

/**
 * Retrieve a specific item from state.
 */
export async function getMockItem(
  projectId: string,
  collection: string,
  itemKey: string,
): Promise<MockStateItem | null> {
  const row = await db.query.mockStates.findFirst({
    where: and(
      eq(mockStates.projectId, projectId),
      eq(mockStates.collection, collection),
      eq(mockStates.itemKey, itemKey),
    ),
  });

  if (!row) return null;

  try {
    return JSON.parse(row.data) as MockStateItem;
  } catch {
    return null;
  }
}

/**
 * Retrieve all items for a collection.
 */
export async function getMockCollection(
  projectId: string,
  collection: string,
): Promise<MockStateItem[]> {
  const rows = await db.query.mockStates.findMany({
    where: and(
      eq(mockStates.projectId, projectId),
      eq(mockStates.collection, collection),
    ),
    orderBy: (states, { desc }) => [desc(states.createdAt)],
  });

  return rows
    .map((r) => {
      try {
        return JSON.parse(r.data) as MockStateItem;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as MockStateItem[];
}

/**
 * Delete an item from state.
 */
export async function deleteMockItem(
  projectId: string,
  collection: string,
  itemKey: string,
): Promise<boolean> {
  await db
    .delete(mockStates)
    .where(
      and(
        eq(mockStates.projectId, projectId),
        eq(mockStates.collection, collection),
        eq(mockStates.itemKey, itemKey),
      ),
    );
  // Simple check for rows affected isn't always easy in SQLite drivers but we just return true.
  return true;
}
