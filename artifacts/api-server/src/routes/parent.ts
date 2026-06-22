import { Router } from "express";
import { db } from "@workspace/db";
import {
  parentsTable, parentAthleteLinksTable, parentWeeklyObservationsTable,
  athletesTable, usersTable, weeklySchedulesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function computeCurrentWeek(programStartDate: string): number {
  const diffMs = Date.now() - new Date(programStartDate).getTime();
  return Math.min(Math.max(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1, 1), 12);
}
function computePhase(week: number): number {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  return 3;
}

const PARENT_QUESTIONS: Record<number, string> = {
  1:  "What did you work on today?",
  2:  "How was your energy in training this week?",
  3:  "What were you working on in your sessions this week?",
  4:  "What are you most proud of from this first month?",
  5:  "What was the hardest part this week?",
  6:  "What did you try when it got hard?",
  7:  "What did you learn from that match?",
  8:  "What changed about you as a competitor in the last 4 weeks?",
  9:  "What's your plan for the match?",
  10: "What decision are you most proud of from today?",
  11: "What do you need from us the night before a match?",
  12: "What are you most proud of from this 12-week program?",
};

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

router.get("/parent/profile", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (!parent) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(parent);
});

router.post("/parent/profile", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }
  const [existing] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (existing) {
    const [u] = await db.update(parentsTable).set({ name }).where(eq(parentsTable.userId, userId)).returning();
    res.json(u); return;
  }
  const [created] = await db.insert(parentsTable).values({ userId, name }).returning();
  res.json(created);
});

router.post("/parent/link-athlete", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const { athleteEmail } = req.body;
  if (!athleteEmail) { res.status(400).json({ error: "athleteEmail is required" }); return; }
  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (!parent) { res.status(404).json({ error: "Parent profile not found" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, athleteEmail)).limit(1);
  if (!user) { res.status(404).json({ error: "Athlete account not found. Ask your child to register first, then come back." }); return; }
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, user.id)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete profile not found." }); return; }
  const [existing] = await db.select().from(parentAthleteLinksTable).where(and(eq(parentAthleteLinksTable.parentId, parent.id), eq(parentAthleteLinksTable.athleteId, athlete.id))).limit(1);
  if (existing) { res.json({ success: true, athleteName: athlete.name, alreadyLinked: true }); return; }
  await db.insert(parentAthleteLinksTable).values({ parentId: parent.id, athleteId: athlete.id });
  res.json({ success: true, athleteName: athlete.name, alreadyLinked: false });
});

router.get("/parent/dashboard", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (!parent) { res.status(404).json({ error: "Parent not found" }); return; }
  const links = await db.select().from(parentAthleteLinksTable).where(eq(parentAthleteLinksTable.parentId, parent.id));
  if (!links.length) {
    res.json({ parent, linkedAthlete: null, currentWeek: 1, parentQuestion: PARENT_QUESTIONS[1], schedule: [] });
    return;
  }
  const athleteId = links[0].athleteId;
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.id, athleteId)).limit(1);
  if (!athlete) {
    res.json({ parent, linkedAthlete: null, currentWeek: 1, parentQuestion: PARENT_QUESTIONS[1], schedule: [] });
    return;
  }
  const currentWeek = computeCurrentWeek(athlete.programStartDate);
  const schedule = await db.select().from(weeklySchedulesTable).where(
    and(eq(weeklySchedulesTable.athleteId, athleteId), eq(weeklySchedulesTable.weekNumber, currentWeek), eq(weeklySchedulesTable.published, true))
  );
  res.json({
    parent,
    linkedAthlete: { id: athlete.id, name: athlete.name, phase: computePhase(currentWeek), currentWeek },
    currentWeek,
    parentQuestion: PARENT_QUESTIONS[currentWeek] ?? PARENT_QUESTIONS[12],
    schedule,
  });
});

router.get("/parent/observations", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (!parent) { res.status(404).json({ error: "Parent not found" }); return; }
  const obs = await db.select().from(parentWeeklyObservationsTable).where(eq(parentWeeklyObservationsTable.parentId, parent.id));
  res.json(obs.map(o => ({ ...o, createdAt: o.createdAt.toISOString() })));
});

router.post("/parent/observations", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const { weekNumber, observation } = req.body;
  if (!weekNumber) { res.status(400).json({ error: "weekNumber is required" }); return; }
  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (!parent) { res.status(404).json({ error: "Parent not found" }); return; }
  const links = await db.select().from(parentAthleteLinksTable).where(eq(parentAthleteLinksTable.parentId, parent.id)).limit(1);
  const athleteId = links[0]?.athleteId ?? 0;
  const [existing] = await db.select().from(parentWeeklyObservationsTable).where(and(eq(parentWeeklyObservationsTable.parentId, parent.id), eq(parentWeeklyObservationsTable.weekNumber, weekNumber))).limit(1);
  if (existing) {
    const [u] = await db.update(parentWeeklyObservationsTable).set({ observation }).where(eq(parentWeeklyObservationsTable.id, existing.id)).returning();
    res.json({ ...u, createdAt: u.createdAt.toISOString() });
  } else {
    const [c] = await db.insert(parentWeeklyObservationsTable).values({ parentId: parent.id, athleteId, weekNumber, observation }).returning();
    res.json({ ...c, createdAt: c.createdAt.toISOString() });
  }
});

export default router;
