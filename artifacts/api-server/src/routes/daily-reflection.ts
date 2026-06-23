import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, dailyReflectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function computeCurrentWeek(programStartDate: string): number {
  const start = new Date(programStartDate);
  const diffMs = Date.now() - start.getTime();
  return Math.min(Math.max(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1, 1), 12);
}

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

/* GET /daily-reflection?weekNumber=N — list for this athlete+week */
router.get("/daily-reflection", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.query.weekNumber as string || '1', 10);

  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const logs = await db.select().from(dailyReflectionsTable)
    .where(and(eq(dailyReflectionsTable.athleteId, athlete.id), eq(dailyReflectionsTable.weekNumber, weekNumber)));

  res.json(logs);
});

/* POST /daily-reflection — upsert by (athleteId, weekNumber, dayOfWeek) */
router.post("/daily-reflection", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const { weekNumber, dayOfWeek, sessionType, sessionFocus, wentWell, challenging, developmentNote, physicalStatus, sessionRating, energyRating } = req.body;

  if (!weekNumber || !dayOfWeek) { res.status(400).json({ error: "weekNumber and dayOfWeek are required" }); return; }
  if (!sessionFocus) { res.status(400).json({ error: "sessionFocus is required" }); return; }

  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const [existing] = await db.select().from(dailyReflectionsTable)
    .where(and(
      eq(dailyReflectionsTable.athleteId, athlete.id),
      eq(dailyReflectionsTable.weekNumber, weekNumber),
      eq(dailyReflectionsTable.dayOfWeek, dayOfWeek),
    )).limit(1);

  const payload = {
    sessionType: sessionType ?? null,
    sessionFocus: sessionFocus,
    wentWell: wentWell ?? null,
    challenging: challenging ?? null,
    developmentNote: developmentNote ?? null,
    physicalStatus: physicalStatus ?? null,
    sessionRating: sessionRating ?? null,
    energyRating: energyRating ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db.update(dailyReflectionsTable).set(payload)
      .where(eq(dailyReflectionsTable.id, existing.id)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(dailyReflectionsTable)
      .values({ athleteId: athlete.id, weekNumber, dayOfWeek, ...payload })
      .returning();
    res.json(created);
  }
});

/* GET /daily-reflection/stats — progress screen stats */
router.get("/daily-reflection/stats", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;

  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const currentWeek = computeCurrentWeek(athlete.programStartDate);
  const allLogs = await db.select().from(dailyReflectionsTable).where(eq(dailyReflectionsTable.athleteId, athlete.id));
  const currentWeekLogs = allLogs.filter(l => l.weekNumber === currentWeek);

  const ratedLogs = allLogs.filter(l => l.sessionRating !== null && l.sessionRating !== undefined);
  const avgSessionRating = ratedLogs.length
    ? Math.round((ratedLogs.reduce((s, l) => s + (l.sessionRating ?? 0), 0) / ratedLogs.length) * 10) / 10
    : null;

  const physicalFlagCount = allLogs.filter(l => l.physicalStatus && l.physicalStatus.trim()).length;

  // Streak: consecutive days from today backwards (using absolute day index = (week-1)*7 + dayIndex)
  const loggedSet = new Set(allLogs.map(l => (l.weekNumber - 1) * 7 + DAY_ORDER.indexOf(l.dayOfWeek)));
  const programStart = new Date(athlete.programStartDate);
  const daysSinceStart = Math.floor((Date.now() - programStart.getTime()) / (24 * 60 * 60 * 1000));
  let sessionStreak = 0;
  for (let d = daysSinceStart; d >= 0; d--) {
    if (loggedSet.has(d)) sessionStreak++;
    else break;
  }

  res.json({
    currentWeek,
    sessionStreak,
    sessionsThisWeek: currentWeekLogs.length,
    currentWeekDays: DAY_ORDER.map(day => ({
      day,
      logged: currentWeekLogs.some(l => l.dayOfWeek === day),
    })),
    avgSessionRating,
    physicalFlagCount,
  });
});

export default router;
