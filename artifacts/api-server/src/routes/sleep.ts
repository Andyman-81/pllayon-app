import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, sleepLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SaveSleepLogBody } from "@workspace/api-zod";

const router = Router();

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

router.get("/sleep-logs", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json([]); return; }
  const logs = await db.select().from(sleepLogsTable).where(eq(sleepLogsTable.athleteId, athlete.id));
  res.json(logs);
});

router.post("/sleep-logs", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const parsed = SaveSleepLogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { logDate, rating, hoursSlept, notes } = parsed.data;

  // Upsert by date
  const [existing] = await db.select().from(sleepLogsTable)
    .where(and(eq(sleepLogsTable.athleteId, athlete.id), eq(sleepLogsTable.logDate, logDate)))
    .limit(1);

  let log;
  if (existing) {
    const [updated] = await db.update(sleepLogsTable)
      .set({ rating, hoursSlept: hoursSlept ?? null, notes: notes ?? null })
      .where(eq(sleepLogsTable.id, existing.id))
      .returning();
    log = updated;
  } else {
    const [created] = await db.insert(sleepLogsTable)
      .values({ athleteId: athlete.id, logDate, rating, hoursSlept: hoursSlept ?? null, notes: notes ?? null })
      .returning();
    log = created;
  }
  res.json(log);
});

export default router;
