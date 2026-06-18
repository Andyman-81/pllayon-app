import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, competitionReviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCompetitionReviewBody, UpdateCompetitionReviewBody } from "@workspace/api-zod";

const router = Router();

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

function formatReview(r: typeof competitionReviewsTable.$inferSelect) {
  return {
    ...r,
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

router.get("/competition-reviews", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.json([]); return; }
  const reviews = await db.select().from(competitionReviewsTable).where(eq(competitionReviewsTable.athleteId, athlete.id));
  res.json(reviews.map(formatReview));
});

router.post("/competition-reviews", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const parsed = CreateCompetitionReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [created] = await db.insert(competitionReviewsTable)
    .values({ athleteId: athlete.id, ...parsed.data })
    .returning();
  res.status(201).json(formatReview(created));
});

router.put("/competition-reviews/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id);

  const parsed = UpdateCompetitionReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [updated] = await db.update(competitionReviewsTable)
    .set(parsed.data)
    .where(eq(competitionReviewsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatReview(updated));
});

export default router;
