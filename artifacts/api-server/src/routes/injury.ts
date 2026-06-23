import { Router } from "express";
import { db } from "@workspace/db";
import {
  athletesTable, injuryFlagsTable,
  coachesTable, coachAthleteLinksTable,
  parentsTable, parentAthleteLinksTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

async function resolveAthleteId(userId: string): Promise<{ athleteId: number; role: string; userName: string } | null> {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (athlete) return { athleteId: athlete.id, role: 'athlete', userName: athlete.name };

  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (coach) {
    const [link] = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id)).limit(1);
    if (!link) return null;
    return { athleteId: link.athleteId, role: 'coach', userName: coach.name };
  }

  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.userId, userId)).limit(1);
  if (parent) {
    const [link] = await db.select().from(parentAthleteLinksTable).where(eq(parentAthleteLinksTable.parentId, parent.id)).limit(1);
    if (!link) return null;
    return { athleteId: link.athleteId, role: 'parent', userName: parent.name };
  }

  return null;
}

/* GET /injury/stats — athlete progress page */
router.get("/injury/stats", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const flags = await db.select().from(injuryFlagsTable).where(eq(injuryFlagsTable.athleteId, athlete.id));
  const openCount = flags.filter(f => f.status === 'open' || f.status === 'monitoring').length;
  const resolvedCount = flags.filter(f => f.status === 'cleared').length;
  const avgSeverity = flags.length
    ? Math.round((flags.reduce((s, f) => s + f.severity, 0) / flags.length) * 10) / 10
    : null;

  res.json({ openCount, resolvedCount, avgSeverity, total: flags.length });
});

/* GET /injury — role-aware list */
router.get("/injury", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const ctx = await resolveAthleteId(userId);
  if (!ctx) { res.json([]); return; }

  const flags = await db.select().from(injuryFlagsTable)
    .where(eq(injuryFlagsTable.athleteId, ctx.athleteId))
    .orderBy(desc(injuryFlagsTable.createdAt));

  res.json(flags);
});

/* POST /injury — create flag (athlete or parent) */
router.post("/injury", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const ctx = await resolveAthleteId(userId);
  if (!ctx) { res.status(404).json({ error: "User context not found" }); return; }

  const {
    loggedBy, bodyArea, side, concernType, severity,
    onset, whenOccurred, description, affectsTraining,
    weekNumber, dayOfWeek,
  } = req.body;

  if (!bodyArea || !concernType || !severity || !description) {
    res.status(400).json({ error: "bodyArea, concernType, severity and description are required" }); return;
  }

  const [created] = await db.insert(injuryFlagsTable).values({
    athleteId: ctx.athleteId,
    loggedBy: loggedBy ?? ctx.role,
    loggedByName: ctx.userName,
    bodyArea,
    side: side ?? null,
    concernType,
    severity: parseInt(severity),
    onset: onset ?? 'gradual',
    whenOccurred: whenOccurred ?? null,
    description,
    affectsTraining: affectsTraining !== false && affectsTraining !== 'false',
    weekNumber: weekNumber ? parseInt(weekNumber) : null,
    dayOfWeek: dayOfWeek ?? null,
    status: 'open',
  }).returning();

  res.json(created);
});

/* GET /injury/:id — single flag (any authorized role) */
router.get("/injury/:id", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const ctx = await resolveAthleteId(userId);
  if (!ctx) { res.status(403).json({ error: "Forbidden" }); return; }

  const flagId = parseInt(req.params.id);
  const [flag] = await db.select().from(injuryFlagsTable)
    .where(and(eq(injuryFlagsTable.id, flagId), eq(injuryFlagsTable.athleteId, ctx.athleteId)))
    .limit(1);

  if (!flag) { res.status(404).json({ error: "Flag not found" }); return; }
  res.json({ ...flag, viewerRole: ctx.role });
});

/* PUT /injury/:id/respond — coach responds */
router.put("/injury/:id/respond", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;

  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(403).json({ error: "Coach profile not found" }); return; }

  const [link] = await db.select().from(coachAthleteLinksTable).where(eq(coachAthleteLinksTable.coachId, coach.id)).limit(1);
  if (!link) { res.status(403).json({ error: "No linked athlete" }); return; }

  const flagId = parseInt(req.params.id);
  const [flag] = await db.select().from(injuryFlagsTable)
    .where(and(eq(injuryFlagsTable.id, flagId), eq(injuryFlagsTable.athleteId, link.athleteId)))
    .limit(1);
  if (!flag) { res.status(404).json({ error: "Flag not found" }); return; }

  const {
    coachAction, coachResponse, trainingModification, returnToFullTraining,
    followUpRequired, followUpDate, status,
  } = req.body;

  const newStatus = status === 'cleared' ? 'cleared'
    : status === 'referred' ? 'referred'
    : status === 'monitoring' ? 'monitoring'
    : 'coach_reviewed';

  const [updated] = await db.update(injuryFlagsTable).set({
    coachAction: coachAction ?? null,
    coachResponse: coachResponse ?? null,
    trainingModification: trainingModification ?? null,
    returnToFullTraining: returnToFullTraining ?? null,
    followUpRequired: followUpRequired === true || followUpRequired === 'true',
    followUpDate: followUpDate ?? null,
    status: newStatus,
    coachRespondedAt: new Date(),
    resolvedAt: newStatus === 'cleared' ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(injuryFlagsTable.id, flagId)).returning();

  res.json(updated);
});

export default router;
