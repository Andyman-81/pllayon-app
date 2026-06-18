import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, capstoneTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SaveCapstoneBody } from "@workspace/api-zod";

const router = Router();

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

function formatCapstone(c: typeof capstoneTable.$inferSelect) {
  return {
    ...c,
    completedAt: c.completedAt?.toISOString() ?? null,
  };
}

router.get("/capstone", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Not found" }); return; }

  const [capstone] = await db.select().from(capstoneTable).where(eq(capstoneTable.athleteId, athlete.id)).limit(1);
  if (!capstone) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCapstone(capstone));
});

router.put("/capstone", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const parsed = SaveCapstoneBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { completed, ...fields } = parsed.data;
  const completedAt = completed ? new Date() : null;

  const [existing] = await db.select().from(capstoneTable).where(eq(capstoneTable.athleteId, athlete.id)).limit(1);

  let capstone;
  if (existing) {
    const [updated] = await db.update(capstoneTable)
      .set({ ...fields, completedAt })
      .where(eq(capstoneTable.id, existing.id))
      .returning();
    capstone = updated;
  } else {
    const [created] = await db.insert(capstoneTable)
      .values({ athleteId: athlete.id, ...fields, completedAt })
      .returning();
    capstone = created;
  }
  res.json(formatCapstone(capstone));
});

export default router;
