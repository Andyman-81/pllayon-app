import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, weeklyReflectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SaveWeeklyReflectionBody } from "@workspace/api-zod";

const router = Router();

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

function formatReflection(r: typeof weeklyReflectionsTable.$inferSelect) {
  return {
    ...r,
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

router.get("/weekly-reflections", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json([]); return; }
  const reflections = await db.select().from(weeklyReflectionsTable).where(eq(weeklyReflectionsTable.athleteId, athlete.id));
  res.json(reflections.map(formatReflection));
});

router.get("/weekly-reflections/:weekNumber", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const weekNumber = parseInt(req.params.weekNumber);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Not found" }); return; }

  const [reflection] = await db.select().from(weeklyReflectionsTable)
    .where(and(eq(weeklyReflectionsTable.athleteId, athlete.id), eq(weeklyReflectionsTable.weekNumber, weekNumber)))
    .limit(1);
  if (!reflection) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatReflection(reflection));
});

router.put("/weekly-reflections/:weekNumber", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const weekNumber = parseInt(req.params.weekNumber);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const parsed = SaveWeeklyReflectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { completed, ...fields } = parsed.data;

  const completedAt = completed ? new Date() : null;
  const updateData = { ...fields, completedAt };

  const [existing] = await db.select().from(weeklyReflectionsTable)
    .where(and(eq(weeklyReflectionsTable.athleteId, athlete.id), eq(weeklyReflectionsTable.weekNumber, weekNumber)))
    .limit(1);

  let reflection;
  if (existing) {
    const [updated] = await db.update(weeklyReflectionsTable)
      .set(updateData)
      .where(eq(weeklyReflectionsTable.id, existing.id))
      .returning();
    reflection = updated;
  } else {
    const [created] = await db.insert(weeklyReflectionsTable)
      .values({ athleteId: athlete.id, weekNumber, ...updateData })
      .returning();
    reflection = created;
  }
  res.json(formatReflection(reflection));
});

export default router;
