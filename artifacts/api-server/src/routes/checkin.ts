import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, monthlyCheckinsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SaveMonthlyCheckinBody } from "@workspace/api-zod";

const router = Router();

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

function formatCheckin(c: typeof monthlyCheckinsTable.$inferSelect) {
  return {
    ...c,
    completedAt: c.completedAt?.toISOString() ?? null,
  };
}

router.get("/monthly-checkins/:monthNumber", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const monthNumber = parseInt(req.params.monthNumber);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Not found" }); return; }

  const [checkin] = await db.select().from(monthlyCheckinsTable)
    .where(and(eq(monthlyCheckinsTable.athleteId, athlete.id), eq(monthlyCheckinsTable.monthNumber, monthNumber)))
    .limit(1);
  if (!checkin) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCheckin(checkin));
});

router.put("/monthly-checkins/:monthNumber", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const monthNumber = parseInt(req.params.monthNumber);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const parsed = SaveMonthlyCheckinBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { completed, ...fields } = parsed.data;
  const completedAt = completed ? new Date() : null;

  const [existing] = await db.select().from(monthlyCheckinsTable)
    .where(and(eq(monthlyCheckinsTable.athleteId, athlete.id), eq(monthlyCheckinsTable.monthNumber, monthNumber)))
    .limit(1);

  let checkin;
  if (existing) {
    const [updated] = await db.update(monthlyCheckinsTable)
      .set({ ...fields, completedAt })
      .where(eq(monthlyCheckinsTable.id, existing.id))
      .returning();
    checkin = updated;
  } else {
    const [created] = await db.insert(monthlyCheckinsTable)
      .values({ athleteId: athlete.id, monthNumber, ...fields, completedAt })
      .returning();
    checkin = created;
  }
  res.json(formatCheckin(checkin));
});

export default router;
