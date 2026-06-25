import { Router } from "express";
import { db } from "@workspace/db";
import {
  athletesTable, cyclePlanTable, cycleAthleteGoalsTable,
  coachesTable, coachAthleteLinksTable,
  parentsTable, parentAthleteLinksTable,
  programSettingsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

type AthleteCtx = { athleteId: number; role: "athlete" | "coach" | "parent" };

async function resolveAthleteCtx(userId: string): Promise<AthleteCtx | null> {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (athlete) return { athleteId: athlete.id, role: "athlete" };

  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (coach) {
    const [link] = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id)).limit(1);
    if (link) return { athleteId: link.athleteId, role: "coach" };
  }

  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (parent) {
    const [link] = await db.select().from(parentAthleteLinksTable).where(eq(parentAthleteLinksTable.parentId, parent.id)).limit(1);
    if (link) return { athleteId: link.athleteId, role: "parent" };
  }

  return null;
}

const LOCKED_REVIEWS = [
  { weekNumber: 4,  eventType: "review", eventName: "Month 1 Check-In",  locked: true },
  { weekNumber: 8,  eventType: "review", eventName: "Month 2 Check-In",  locked: true },
  { weekNumber: 12, eventType: "review", eventName: "Capstone Review",    locked: true },
];

/* ── GET all cycle plan events (athlete + coach + parent) ─ */
router.get("/cycle-planner", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.json({ events: [], published: false }); return; }

  const events = await db.select().from(cyclePlanTable).where(eq(cyclePlanTable.athleteId, ctx.athleteId));
  const published = events.some(e => e.published);
  res.json({ events, published });
});

/* ── POST seed locked review events (coach → linked athlete) */
router.post("/cycle-planner/seed", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit the cycle plan" }); return; }

  for (const r of LOCKED_REVIEWS) {
    const [existing] = await db.select().from(cyclePlanTable)
      .where(and(eq(cyclePlanTable.athleteId, ctx.athleteId), eq(cyclePlanTable.weekNumber, r.weekNumber), eq(cyclePlanTable.locked, true)))
      .limit(1);
    if (!existing) {
      await db.insert(cyclePlanTable).values({ ...r, athleteId: ctx.athleteId, createdBy: "coach" });
    }
  }
  res.json({ ok: true });
});

/* ── POST add event (coach → linked athlete) ──────────── */
router.post("/cycle-planner/events", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit the cycle plan" }); return; }

  const { weekNumber, eventType, eventName, dateFrom, dateTo, focusNote, notes } = req.body;
  if (!weekNumber || !eventType) { res.status(400).json({ error: "weekNumber and eventType required" }); return; }

  const [created] = await db.insert(cyclePlanTable)
    .values({ athleteId: ctx.athleteId, weekNumber, eventType, eventName, dateFrom, dateTo, focusNote, notes, createdBy: "coach" })
    .returning();
  res.json(created);
});

/* ── DELETE event (coach, non-locked only) ────────────── */
router.delete("/cycle-planner/events/:id", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const id = parseInt(req.params.id);

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit the cycle plan" }); return; }

  const [row] = await db.select().from(cyclePlanTable)
    .where(and(eq(cyclePlanTable.id, id), eq(cyclePlanTable.athleteId, ctx.athleteId)))
    .limit(1);

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (row.locked) { res.status(403).json({ error: "Locked events cannot be deleted" }); return; }

  await db.delete(cyclePlanTable).where(eq(cyclePlanTable.id, id));
  res.json({ ok: true });
});

/* ── PATCH publish plan (coach → linked athlete) ──────── */
router.patch("/cycle-planner/publish", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot publish the cycle plan" }); return; }

  const { published } = req.body;
  await db.update(cyclePlanTable)
    .set({ published: !!published })
    .where(eq(cyclePlanTable.athleteId, ctx.athleteId));
  res.json({ ok: true, published: !!published });
});

/* ── GET athlete goals (athlete only) ─────────────────── */
router.get("/cycle-planner/goals", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.json([]); return; }

  const goals = await db.select().from(cycleAthleteGoalsTable).where(eq(cycleAthleteGoalsTable.athleteId, athlete.id));
  res.json(goals);
});

/* ── PUT athlete goal for a week (athlete only) ─────────  */
router.put("/cycle-planner/goals/:weekNum", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);

  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
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

/* ── GET program settings (start date) ─────────────── */
router.get("/cycle-planner/settings", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.json({ programStartDate: null }); return; }

  const [settings] = await db.select().from(programSettingsTable)
    .where(eq(programSettingsTable.athleteId, ctx.athleteId)).limit(1);

  res.json({ programStartDate: settings?.programStartDate ?? null });
});

/* ── PUT program settings (start date) ──────────────── */
router.put("/cycle-planner/settings", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit settings" }); return; }

  const { programStartDate } = req.body;

  const [existing] = await db.select().from(programSettingsTable)
    .where(eq(programSettingsTable.athleteId, ctx.athleteId)).limit(1);

  if (existing) {
    await db.update(programSettingsTable)
      .set({ programStartDate: programStartDate || null, updatedAt: new Date() })
      .where(eq(programSettingsTable.athleteId, ctx.athleteId));
  } else {
    await db.insert(programSettingsTable)
      .values({ athleteId: ctx.athleteId, programStartDate: programStartDate || null });
  }

  res.json({ ok: true, programStartDate: programStartDate || null });
});

export default router;
