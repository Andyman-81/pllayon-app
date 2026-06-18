import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateAthleteProfileBody } from "@workspace/api-zod";

const router = Router();

router.get("/athlete/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = (req as any).user.id as string;
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (!athlete) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json({
    ...athlete,
    programStartDate: athlete.programStartDate,
    phase0CompletedAt: athlete.phase0CompletedAt?.toISOString() ?? null,
    createdAt: athlete.createdAt.toISOString(),
  });
});

router.post("/athlete/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = (req as any).user.id as string;
  const parsed = CreateAthleteProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, dob, sport, club, coachName, parentName } = parsed.data;
  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  if (existing) {
    const [updated] = await db
      .update(athletesTable)
      .set({ name, dob, sport, club: club ?? null, coachName: coachName ?? null, parentName: parentName ?? null })
      .where(eq(athletesTable.userId, userId))
      .returning();
    res.json({ ...updated, phase0CompletedAt: updated.phase0CompletedAt?.toISOString() ?? null, createdAt: updated.createdAt.toISOString() });
    return;
  }

  const [created] = await db
    .insert(athletesTable)
    .values({ userId, name, dob, sport, club: club ?? null, coachName: coachName ?? null, parentName: parentName ?? null, programStartDate: today })
    .returning();
  res.json({ ...created, phase0CompletedAt: created.phase0CompletedAt?.toISOString() ?? null, createdAt: created.createdAt.toISOString() });
});

export default router;
