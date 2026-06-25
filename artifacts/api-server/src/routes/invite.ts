import { Router } from "express";
import { db } from "@workspace/db";
import {
  athleteProfilesTable, coachesTable, coachAthleteLinksTable, athletesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function auth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req as any).user.id as string;
}

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ── POST /coach/athlete/new — create athlete profile ── */
router.post("/coach/athlete/new", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach profile not found" }); return; }

  const { name, dateOfBirth, sport, club, maturityStage, programStartDate, notes } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Athlete name is required" }); return; }

  const inviteCode = genCode();
  const inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [profile] = await db.insert(athleteProfilesTable).values({
    coachId: coach.id,
    name: name.trim(),
    dateOfBirth: dateOfBirth || null,
    sport: sport || "Tennis",
    club: club || null,
    maturityStage: maturityStage || null,
    programStartDate: programStartDate || null,
    notes: notes || null,
    inviteCode,
    inviteCodeExpiresAt,
    status: "pending",
  }).returning();

  res.json(profile);
});

/* ── GET /coach/athletes — list coach's profiles ─────── */
router.get("/coach/athletes", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.json([]); return; }

  const profiles = await db.select().from(athleteProfilesTable)
    .where(eq(athleteProfilesTable.coachId, coach.id));

  const now = new Date();
  const withStatus = profiles.map(p => ({
    ...p,
    status: p.status === "linked" ? "linked"
      : (p.inviteCodeExpiresAt && p.inviteCodeExpiresAt < now) ? "expired"
      : "pending",
  }));

  res.json(withStatus);
});

/* ── GET /coach/athlete/:id — single profile ─────────── */
router.get("/coach/athlete/:id", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach not found" }); return; }

  const id = parseInt(req.params.id);
  const [profile] = await db.select().from(athleteProfilesTable)
    .where(and(eq(athleteProfilesTable.id, id), eq(athleteProfilesTable.coachId, coach.id)))
    .limit(1);

  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const now = new Date();
  const status = profile.status === "linked" ? "linked"
    : (profile.inviteCodeExpiresAt && profile.inviteCodeExpiresAt < now) ? "expired"
    : "pending";

  res.json({ ...profile, status });
});

/* ── PATCH /coach/athlete/:id/regenerate-code ─────────── */
router.patch("/coach/athlete/:id/regenerate-code", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.userId, userId)).limit(1);
  if (!coach) { res.status(404).json({ error: "Coach not found" }); return; }

  const id = parseInt(req.params.id);
  const [profile] = await db.select().from(athleteProfilesTable)
    .where(and(eq(athleteProfilesTable.id, id), eq(athleteProfilesTable.coachId, coach.id)))
    .limit(1);

  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  if (profile.status === "linked") { res.status(400).json({ error: "Already linked" }); return; }

  const inviteCode = genCode();
  const inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [updated] = await db.update(athleteProfilesTable)
    .set({ inviteCode, inviteCodeExpiresAt, status: "pending" })
    .where(eq(athleteProfilesTable.id, id))
    .returning();

  res.json(updated);
});

/* ── POST /athlete/use-code — athlete links via code ──── */
router.post("/athlete/use-code", async (req, res) => {
  const userId = auth(req, res); if (!userId) return;
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) { res.status(404).json({ error: "Athlete profile not found" }); return; }

  const { code } = req.body;
  if (!code?.trim()) { res.status(400).json({ error: "Code is required" }); return; }

  const [profile] = await db.select().from(athleteProfilesTable)
    .where(eq(athleteProfilesTable.inviteCode, code.trim().toUpperCase()))
    .limit(1);

  if (!profile) { res.status(404).json({ error: "Code not found or expired. Ask your coach for a new one." }); return; }
  if (profile.status === "linked") { res.status(400).json({ error: "This code has already been used." }); return; }

  const now = new Date();
  if (profile.inviteCodeExpiresAt && profile.inviteCodeExpiresAt < now) {
    res.status(400).json({ error: "Code not found or expired. Ask your coach for a new one." }); return;
  }

  await db.update(athleteProfilesTable).set({
    linkedAthleteId: athlete.id,
    linkedAt: now,
    status: "linked",
  }).where(eq(athleteProfilesTable.id, profile.id));

  const [existingLink] = await db.select().from(coachAthleteLinksTable)
    .where(and(eq(coachAthleteLinksTable.coachId, profile.coachId), eq(coachAthleteLinksTable.athleteId, athlete.id)))
    .limit(1);

  if (!existingLink) {
    await db.insert(coachAthleteLinksTable).values({
      coachId: profile.coachId,
      athleteId: athlete.id,
    });
  }

  res.json({ ok: true, profileName: profile.name });
});

export default router;
