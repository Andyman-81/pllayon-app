import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, weeklySchedulesTable, athleteDayNotesTable } from "@workspace/db";
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

/* ── GET sessions for a week ──────────────────────────── */
router.get("/schedule/:weekNum", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json({ sessions: [], published: false }); return; }

  const sessions = await db.select().from(weeklySchedulesTable)
    .where(and(eq(weeklySchedulesTable.athleteId, athlete.id), eq(weeklySchedulesTable.weekNumber, weekNumber)));

  const published = sessions.some(s => s.published);
  res.json({ sessions, published });
});

/* ── POST add session (coach) ─────────────────────────── */
router.post("/schedule/:weekNum/sessions", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const { dayOfWeek, sessionType, timeFrom, timeTo, notes } = req.body;
  if (!dayOfWeek || !sessionType) { res.status(400).json({ error: "dayOfWeek and sessionType required" }); return; }

  const [created] = await db.insert(weeklySchedulesTable)
    .values({ athleteId: athlete.id, weekNumber, dayOfWeek, sessionType, timeFrom, timeTo, notes, createdBy: "coach" })
    .returning();
  res.json(created);
});

/* ── DELETE session ───────────────────────────────────── */
router.delete("/schedule/sessions/:id", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const id = parseInt(req.params.id);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  await db.delete(weeklySchedulesTable)
    .where(and(eq(weeklySchedulesTable.id, id), eq(weeklySchedulesTable.athleteId, athlete.id)));
  res.json({ ok: true });
});

/* ── PATCH publish / unpublish week ───────────────────── */
router.patch("/schedule/:weekNum/publish", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const { published } = req.body;
  await db.update(weeklySchedulesTable)
    .set({ published: !!published })
    .where(and(eq(weeklySchedulesTable.athleteId, athlete.id), eq(weeklySchedulesTable.weekNumber, weekNumber)));
  res.json({ ok: true, published: !!published });
});

/* ── POST copy week from prev week (coach) ────────────── */
router.post("/schedule/:weekNum/copy-from/:fromWeek", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const fromWeek = parseInt(req.params.fromWeek);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const source = await db.select().from(weeklySchedulesTable)
    .where(and(eq(weeklySchedulesTable.athleteId, athlete.id), eq(weeklySchedulesTable.weekNumber, fromWeek)));

  if (source.length === 0) { res.json({ copied: 0 }); return; }

  const toInsert = source.map(({ id, createdAt, weekNumber: _, ...rest }) => ({
    ...rest,
    weekNumber,
    published: false,
  }));

  await db.insert(weeklySchedulesTable).values(toInsert);
  res.json({ copied: toInsert.length });
});

/* ── GET athlete day notes ────────────────────────────── */
router.get("/schedule/:weekNum/notes", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json([]); return; }

  const notes = await db.select().from(athleteDayNotesTable)
    .where(and(eq(athleteDayNotesTable.athleteId, athlete.id), eq(athleteDayNotesTable.weekNumber, weekNumber)));
  res.json(notes);
});

/* ── PUT athlete day note ─────────────────────────────── */
router.put("/schedule/:weekNum/notes/:day", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.params.weekNum);
  const dayOfWeek = req.params.day;
  const athlete = await getAthlete(userId);
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
