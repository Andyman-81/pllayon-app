import { Router } from "express";
import { db } from "@workspace/db";
import {
  athletesTable,
  phase0ModulesTable,
  weeklyReflectionsTable,
  competitionReviewsTable,
  monthlyCheckinsTable,
  capstoneTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

router.get("/progress", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);

  if (!athlete) {
    res.json({
      currentPhase: 0,
      currentWeek: 0,
      weeksCompleted: 0,
      reflectionsCompleted: 0,
      phase0Complete: false,
      overallCompletionPct: 0,
      streakWeeks: 0,
      competitionReviewsCount: 0,
      month1CheckinComplete: false,
      month2CheckinComplete: false,
      capstoneComplete: false,
      domainScores: {
        physical: { start: null, current: null },
        technical: { start: null, current: null },
        tactical: { start: null, current: null },
        psychological: { start: null, current: null },
        lifestyle: { start: null, current: null },
      },
    });
    return;
  }

  const [reflections, competitions, checkins, capstoneRows, phase0Mods] = await Promise.all([
    db.select().from(weeklyReflectionsTable).where(eq(weeklyReflectionsTable.athleteId, athlete.id)),
    db.select().from(competitionReviewsTable).where(eq(competitionReviewsTable.athleteId, athlete.id)),
    db.select().from(monthlyCheckinsTable).where(eq(monthlyCheckinsTable.athleteId, athlete.id)),
    db.select().from(capstoneTable).where(eq(capstoneTable.athleteId, athlete.id)),
    db.select().from(phase0ModulesTable).where(eq(phase0ModulesTable.athleteId, athlete.id)),
  ]);

  const phase0Complete = !!athlete.phase0CompletedAt;
  const completedReflections = reflections.filter(r => r.completedAt);
  const weeksCompleted = completedReflections.length;

  const month1Checkin = checkins.find(c => c.monthNumber === 1);
  const month2Checkin = checkins.find(c => c.monthNumber === 2);
  const capstone = capstoneRows[0] ?? null;

  const month1CheckinComplete = !!(month1Checkin?.completedAt);
  const month2CheckinComplete = !!(month2Checkin?.completedAt);
  const capstoneComplete = !!(capstone?.completedAt);

  // Determine current week and phase
  let currentWeek = 0;
  let currentPhase = 0;

  if (phase0Complete) {
    const programStart = new Date(athlete.programStartDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - programStart.getTime()) / (1000 * 60 * 60 * 24));
    currentWeek = Math.min(Math.max(Math.floor(daysDiff / 7) + 1, 1), 12);

    if (capstoneComplete) {
      currentPhase = 4;
    } else if (currentWeek <= 4) {
      currentPhase = 1;
    } else if (currentWeek <= 8) {
      currentPhase = 2;
    } else {
      currentPhase = 3;
    }
  }

  // Streak: consecutive completed weeks starting from week 1
  let streakWeeks = 0;
  const completedWeekNums = new Set(completedReflections.map(r => r.weekNumber));
  for (let w = 1; w <= 12; w++) {
    if (completedWeekNums.has(w)) streakWeeks++;
    else break;
  }

  // Overall completion: phase0 (1 point) + 12 weeks + 2 checkins + capstone = 16 total
  const phase0Points = phase0Complete ? 1 : phase0Mods.filter(m => m.completed).length / 6;
  const totalPoints = phase0Points + weeksCompleted + (month1CheckinComplete ? 1 : 0) + (month2CheckinComplete ? 1 : 0) + (capstoneComplete ? 1 : 0);
  const overallCompletionPct = Math.round((totalPoints / 16) * 100);

  // Domain scores from capstone or phase0 module 0.1
  const assessmentMod = phase0Mods.find(m => m.moduleName === "0.1");
  const assessmentData = (assessmentMod?.data ?? {}) as Record<string, any>;

  res.json({
    currentPhase,
    currentWeek,
    weeksCompleted,
    reflectionsCompleted: weeksCompleted,
    phase0Complete,
    overallCompletionPct,
    streakWeeks,
    competitionReviewsCount: competitions.length,
    month1CheckinComplete,
    month2CheckinComplete,
    capstoneComplete,
    domainScores: {
      physical: {
        start: assessmentData.physicalStart ?? null,
        current: capstone?.physicalNow ?? assessmentData.physicalNow ?? null,
      },
      technical: {
        start: assessmentData.technicalStart ?? null,
        current: capstone?.technicalNow ?? assessmentData.technicalNow ?? null,
      },
      tactical: {
        start: assessmentData.tacticalStart ?? null,
        current: capstone?.tacticalNow ?? assessmentData.tacticalNow ?? null,
      },
      psychological: {
        start: assessmentData.psychologicalStart ?? null,
        current: capstone?.psychologicalNow ?? assessmentData.psychologicalNow ?? null,
      },
      lifestyle: {
        start: assessmentData.lifestyleStart ?? null,
        current: capstone?.lifestyleNow ?? assessmentData.lifestyleNow ?? null,
      },
    },
  });
});

export default router;
