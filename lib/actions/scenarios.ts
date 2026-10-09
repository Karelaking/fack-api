"use server";

import { db } from "@/db";
import { scenarios, type Scenario } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function getScenarios(projectId: string): Promise<Scenario[]> {
  return db.query.scenarios.findMany({
    where: eq(scenarios.projectId, projectId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

export async function createScenario(
  projectId: string,
  name: string,
  latencyMultiplier: number,
  forcedErrorRate: number,
) {
  const [newScenario] = await db
    .insert(scenarios)
    .values({
      id: nanoid(),
      projectId,
      name,
      latencyMultiplier,
      forcedErrorRate,
    })
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return newScenario;
}

export async function deleteScenario(scenarioId: string, projectId: string) {
  await db.delete(scenarios).where(eq(scenarios.id, scenarioId));
  revalidatePath(`/projects/${projectId}`);
}

export async function seedDefaultScenarios(projectId: string) {
  const defaults = [
    { name: "Normal (1x, 0%)", latencyMultiplier: 1.0, forcedErrorRate: 0.0 },
    {
      name: "Black Friday Traffic (3x, 5%)",
      latencyMultiplier: 3.0,
      forcedErrorRate: 0.05,
    },
    {
      name: "Database Down (1x, 100%)",
      latencyMultiplier: 1.0,
      forcedErrorRate: 1.0,
    },
    {
      name: "Slow Network (5x, 0%)",
      latencyMultiplier: 5.0,
      forcedErrorRate: 0.0,
    },
  ];

  for (const s of defaults) {
    await db.insert(scenarios).values({
      id: nanoid(),
      projectId,
      name: s.name,
      latencyMultiplier: s.latencyMultiplier,
      forcedErrorRate: s.forcedErrorRate,
    });
  }
}
