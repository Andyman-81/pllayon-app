import { Router } from "express";
import { db } from "@workspace/db";
import {
  athletesTable, weeklySchedulesTable, athleteDayNotesTable,
  coachesTable, coachAthleteLinksTable,
  parentsTable, parentAthleteLinksTable,
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

/* ── GET sessions for a week (athlete + coach + parent) ── */
router.get("/schedule/:weekNum", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.json({ sessions: [], published: false }); return; }

  const sessions = await db.select().from(weeklySchedulesTable)
    .where(and(eq(weeklySchedulesTable.athleteId, ctx.athleteId), eq(weeklySchedulesTable.weekNumber, weekNumber)));

  const published = sessions.some(s => s.published);
  res.json({ sessions, published });
});

/* ── POST add session (coach → linked athlete) ─────────── */
router.post("/schedule/:weekNum/sessions", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit schedules" }); return; }

  const { dayOfWeek, sessionType, timeFrom, timeTo, notes } = req.body;
  if (!dayOfWeek || !sessionType) { res.status(400).json({ error: "dayOfWeek and sessionType required" }); return; }

  const [created] = await db.insert(weeklySchedulesTable)
    .values({ athleteId: ctx.athleteId, weekNumber, dayOfWeek, sessionType, timeFrom, timeTo, notes, createdBy: "coach" })
    .returning();
  res.json(created);
});

/* ── DELETE session (coach → linked athlete) ───────────── */
router.delete("/schedule/sessions/:id", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const id = parseInt(req.params.id);

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit schedules" }); return; }

  await db.delete(weeklySchedulesTable)
    .where(and(eq(weeklySchedulesTable.id, id), eq(weeklySchedulesTable.athleteId, ctx.athleteId)));
  res.json({ ok: true });
});

/* ── PATCH publish / unpublish week (coach → linked athlete) */
router.patch("/schedule/:weekNum/publish", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot publish schedules" }); return; }

  const { published } = req.body;
  await db.update(weeklySchedulesTable)
    .set({ published: !!published })
    .where(and(eq(weeklySchedulesTable.athleteId, ctx.athleteId), eq(weeklySchedulesTable.weekNumber, weekNumber)));
  res.json({ ok: true, published: !!published });
});

/* ── POST carry-forward from previous week (coach → linked athlete) */
router.post("/schedule/:weekNum/copy-from/:fromWeek", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const fromWeek = parseInt(req.params.fromWeek);

  const ctx = await resolveAthleteCtx(userId);
  if (!ctx) { res.status(404).json({ error: "No linked athlete found" }); return; }
  if (ctx.role === "parent") { res.status(403).json({ error: "Parents cannot edit schedules" }); return; }

  const source = await db.select().from(weeklySchedulesTable)
    .where(and(eq(weeklySchedulesTable.athleteId, ctx.athleteId), eq(weeklySchedulesTable.weekNumber, fromWeek)));

  if (source.length === 0) { res.json({ copied: 0 }); return; }

  const toInsert = source.map(({ id, createdAt, weekNumber: _, ...rest }) => ({
    ...rest,
    weekNumber,
    published: false,
  }));

  await db.insert(weeklySchedulesTable).values(toInsert);
  res.json({ copied: toInsert.length });
});

/* ── GET athlete day notes (athlete only) ──────────────── */
router.get("/schedule/:weekNum/notes", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);

  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.json([]); return; }

  const notes = await db.select().from(athleteDayNotesTable)
    .where(and(eq(athleteDayNotesTable.athleteId, athlete.id), eq(athleteDayNotesTable.weekNumber, weekNumber)));
  res.json(notes);
});

/* ── PUT athlete day note (athlete only) ───────────────── */
router.put("/schedule/:weekNum/notes/:day", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const dayOfWeek = req.params.day;

  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const { note } = req.body;
  const [existing] = await db.select().from(athleteDayNotesTable)
    .where(and(eq(athleteDayNotesTable.athleteId, athlete.id), eq(athleteDayNotesTable.weekNumber, weekNumber), eq(athleteDayNotesTable.dayOfWeek, dayOfWeek)))
    .limit(1);

  let result;
  if (existing) {
    const [updated] = await db.update(athleteDayNotesTable)
      .set({ note, updatedAt: new Date() })
      .where(eq(athleteDayNotesTable.id, existing.id))
      .returning();
    result = updated;
  } else {
    const [created] = await db.insert(athleteDayNotesTable)
      .values({ athleteId: athlete.id, weekNumber, dayOfWeek, note })
      .returning();
    result = created;
  }
  res.json(result);
});

export default router;
