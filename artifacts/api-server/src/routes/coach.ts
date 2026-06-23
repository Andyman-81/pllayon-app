import { Router } from "express";
import { db } from "@workspace/db";
import {
  coachesTable, coachAthleteLinksTable, coachReviewsTable,
  athletesTable, usersTable, phase0ModulesTable, weeklyReflectionsTable,
  competitionReviewsTable, weeklySchedulesTable, cyclePlanTable,
  dailyReflectionsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function computeCurrentWeek(programStartDate: string): number {
  const start = new Date(programStartDate);
  const diffMs = Date.now() - start.getTime();
  return Math.min(Math.max(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1, 1), 12);
}
function computePhase(week: number): number {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  return 3;
}

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

router.get("/coach/profile", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(coach);
});

router.post("/coach/profile", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const { name, club, specialisation } = req.body;
  if (!name) { res.status(400).json({ error: "Name is required" }); return; }
  const [existing] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (existing) {
    const [u] = await db.update(coachesTable).set({ name, club: club ?? null, specialisation: specialisation ?? null }).where(eq(coachesTable.userId, userId)).returning();
    res.json(u); return;
  }
  const [created] = await db.insert(coachesTable).values({ userId, name, club: club ?? null, specialisation: specialisation ?? null }).returning();
  res.json(created);
});

router.post("/coach/link-athlete", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const { athleteEmail } = req.body;
  if (!athleteEmail) { res.status(400).json({ error: "athleteEmail is required" }); return; }
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach profile not found" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, athleteEmail)).limit(1);
  if (!user) { res.status(404).json({ error: "Athlete account not found. Ask your athlete to register first, then come back." }); return; }
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, user.id)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete profile not found. Ask your athlete to complete their registration." }); return; }
  const [existing] = await db.select().from(coachAthleteLinksTable).where(and(eq(coachAthleteLinksTable.coachId, coach.id), eq(coachAthleteLinksTable.athleteId, athlete.id))).limit(1);
  if (existing) { res.json({ success: true, athleteName: athlete.name, alreadyLinked: true }); return; }
  await db.insert(coachAthleteLinksTable).values({ coachId: coach.id, athleteId: athlete.id });
  res.json({ success: true, athleteName: athlete.name, alreadyLinked: false });
});

router.get("/coach/dashboard", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach not found" }); return; }
  const links = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id));
  if (!links.length) {
    res.json({ coach, linkedAthlete: null, schedule: [], reflections: [], competitionReviews: [], phase0Modules: [], cyclePlan: [] });
    return;
  }
  const athleteId = links[0].athleteId;
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.id, athleteId)).limit(1);
  if (!athlete) {
    res.json({ coach, linkedAthlete: null, schedule: [], reflections: [], competitionReviews: [], phase0Modules: [], cyclePlan: [] });
    return;
  }
  const currentWeek = computeCurrentWeek(athlete.programStartDate);
  const [schedule, reflections, competitionReviews, phase0Modules, cyclePlan] = await Promise.all([
    db.select().from(weeklySchedulesTable).where(and(eq(weeklySchedulesTable.athleteId, athleteId), eq(weeklySchedulesTable.weekNumber, currentWeek))),
    db.select().from(weeklyReflectionsTable).where(eq(weeklyReflectionsTable.athleteId, athleteId)),
    db.select().from(competitionReviewsTable).where(eq(competitionReviewsTable.athleteId, athleteId)),
    db.select().from(phase0ModulesTable).where(eq(phase0ModulesTable.athleteId, athleteId)),
    db.select().from(cyclePlanTable).where(eq(cyclePlanTable.athleteId, athleteId)),
  ]);
  const completed = reflections.filter(r => r.completedAt);
  const last = completed.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0];
  res.json({
    coach,
    linkedAthlete: {
      id: athlete.id, name: athlete.name, phase: computePhase(currentWeek),
      currentWeek, weeksCompleted: completed.length,
      completionPct: Math.round((completed.length / 12) * 100),
      lastReflectionDate: last?.completedAt?.toISOString() ?? null,
      phase0Complete: !!athlete.phase0CompletedAt,
    },
    schedule,
    reflections: reflections.map(r => ({ ...r, completedAt: r.completedAt?.toISOString() ?? null })),
    competitionReviews: competitionReviews.map(r => ({ ...r, completedAt: r.completedAt?.toISOString() ?? null })),
    phase0Modules,
    cyclePlan,
  });
});

/* GET /coach/daily-logs?weekNumber=N — daily session logs for linked athlete */
router.get("/coach/daily-logs", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const weekNumber = parseInt(req.query.weekNumber as string || '1', 10);
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach not found" }); return; }
  const links = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id)).limit(1);
  if (!links.length) { res.json([]); return; }
  const logs = await db.select().from(dailyReflectionsTable)
    .where(and(eq(dailyReflectionsTable.athleteId, links[0].athleteId), eq(dailyReflectionsTable.weekNumber, weekNumber)));
  res.json(logs);
});

router.get("/coach/review", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach not found" }); return; }
  const links = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id)).limit(1);
  if (!links.length) { res.json(null); return; }
  const [review] = await db.select().from(coachReviewsTable).where(and(eq(coachReviewsTable.coachId, coach.id), eq(coachReviewsTable.athleteId, links[0].athleteId))).limit(1);
  res.json(review ?? null);
});

router.put("/coach/review", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach not found" }); return; }
  const links = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id)).limit(1);
  if (!links.length) { res.status(400).json({ error: "No linked athlete" }); return; }
  const athleteId = links[0].athleteId;
  const d = req.body;
  const payload = {
    technicalRating: d.technicalRating ?? null, tacticalRating: d.tacticalRating ?? null,
    physicalRating: d.physicalRating ?? null, coachabilityRating: d.coachabilityRating ?? null,
    awarenessRating: d.awarenessRating ?? null, biggestImprovement: d.biggestImprovement ?? null,
    remainingConstraint: d.remainingConstraint ?? null, technicalPriority: d.technicalPriority ?? null,
    tacticalPriority: d.tacticalPriority ?? null, physicalPriority: d.physicalPriority ?? null,
    competitionRecommendation: d.competitionRecommendation ?? null, behaviourNote: d.behaviourNote ?? null,
    additionalNotes: d.additionalNotes ?? null, updatedAt: new Date(),
  };
  const [existing] = await db.select().from(coachReviewsTable).where(and(eq(coachReviewsTable.coachId, coach.id), eq(coachReviewsTable.athleteId, athleteId))).limit(1);
  if (existing) {
    const [u] = await db.update(coachReviewsTable).set(payload).where(eq(coachReviewsTable.id, existing.id)).returning();
    res.json(u);
  } else {
    const [c] = await db.insert(coachReviewsTable).values({ coachId: coach.id, athleteId, ...payload }).returning();
    res.json(c);
  }
});

export default router;
