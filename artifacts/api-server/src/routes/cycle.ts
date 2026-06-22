import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, cyclePlanTable, cycleAthleteGoalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function getAthlete(userId: string) {
  const [a] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return a ?? null;
}

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

const LOCKED_REVIEWS = [
  { weekNumber: 4,  eventType: "review", eventName: "Month 1 Check-In",  locked: true },
  { weekNumber: 8,  eventType: "review", eventName: "Month 2 Check-In",  locked: true },
  { weekNumber: 12, eventType: "review", eventName: "Capstone Review",    locked: true },
];

/* ── GET all cycle plan events ────────────────────────── */
router.get("/cycle-planner", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json({ events: [], published: false }); return; }

  const events = await db.select().from(cyclePlanTable).where(eq(cyclePlanTable.athleteId, athlete.id));
  const published = events.some(e => e.published);
  res.json({ events, published });
});

/* ── POST seed locked review events (coach) ──────────── */
router.post("/cycle-planner/seed", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  for (const r of LOCKED_REVIEWS) {
    const [existing] = await db.select().from(cyclePlanTable)
      .where(and(eq(cyclePlanTable.athleteId, athlete.id), eq(cyclePlanTable.weekNumber, r.weekNumber), eq(cyclePlanTable.locked, true)))
      .limit(1);
    if (!existing) {
      await db.insert(cyclePlanTable).values({ ...r, athleteId: athlete.id, createdBy: "coach" });
    }
  }
  res.json({ ok: true });
});

/* ── POST add event (coach) ───────────────────────────── */
router.post("/cycle-planner/events", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const { weekNumber, eventType, eventName, dateFrom, dateTo, focusNote, notes } = req.body;
  if (!weekNumber || !eventType) { res.status(400).json({ error: "weekNumber and eventType required" }); return; }

  const [created] = await db.insert(cyclePlanTable)
    .values({ athleteId: athlete.id, weekNumber, eventType, eventName, dateFrom, dateTo, focusNote, notes, createdBy: "coach" })
    .returning();
  res.json(created);
});

/* ── DELETE event (coach, non-locked only) ────────────── */
router.delete("/cycle-planner/events/:id", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const id = parseInt(req.params.id);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const [row] = await db.select().from(cyclePlanTable)
    .where(and(eq(cyclePlanTable.id, id), eq(cyclePlanTable.athleteId, athlete.id)))
    .limit(1);

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (row.locked) { res.status(403).json({ error: "Locked events cannot be deleted" }); return; }

  await db.delete(cyclePlanTable).where(eq(cyclePlanTable.id, id));
  res.json({ ok: true });
});

/* ── PATCH publish plan ───────────────────────────────── */
router.patch("/cycle-planner/publish", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const { published } = req.body;
  await db.update(cyclePlanTable)
    .set({ published: !!published })
    .where(eq(cyclePlanTable.athleteId, athlete.id));
  res.json({ ok: true, published: !!published });
});

/* ── GET athlete goals ────────────────────────────────── */
router.get("/cycle-planner/goals", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json([]); return; }

  const goals = await db.select().from(cycleAthleteGoalsTable).where(eq(cycleAthleteGoalsTable.athleteId, athlete.id));
  res.json(goals);
});

/* ── PUT athlete goal for a week ─────────────────────── */
router.put("/cycle-planner/goals/:weekNum", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const { goal } = req.body;
  const [existing] = await db.select().from(cycleAthleteGoalsTable)
    .where(and(eq(cycleAthleteGoalsTable.athleteId, athlete.id), eq(cycleAthleteGoalsTable.weekNumber, weekNumber)))
    .limit(1);

  let result;
  if (existing) {
    const [updated] = await db.update(cycleAthleteGoalsTable)
      .set({ goal, updatedAt: new Date() })
      .where(eq(cycleAthleteGoalsTable.id, existing.id))
      .returning();
    result = updated;
  } else {
    const [created] = await db.insert(cycleAthleteGoalsTable)
      .values({ athleteId: athlete.id, weekNumber, goal })
      .returning();
    result = created;
  }
  res.json(result);
});

export default router;
