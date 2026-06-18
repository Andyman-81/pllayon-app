import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, phase0ModulesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SavePhase0ModuleBody } from "@workspace/api-zod";

const router = Router();

const MODULE_NAMES = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6"];

async function getAthlete(userId: string) {
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.userId, userId)).limit(1);
  return athlete ?? null;
}

function formatModule(m: typeof phase0ModulesTable.$inferSelect) {
  return {
    ...m,
    completedAt: m.completedAt?.toISOString() ?? null,
  };
}

router.get("/phase0/modules", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const modules = await db.select().from(phase0ModulesTable).where(eq(phase0ModulesTable.athleteId, athlete.id));
  res.json(modules.map(formatModule));
});

router.get("/phase0/modules/:moduleName", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const { moduleName } = req.params;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const [mod] = await db.select().from(phase0ModulesTable)
    .where(and(eq(phase0ModulesTable.athleteId, athlete.id), eq(phase0ModulesTable.moduleName, moduleName)))
    .limit(1);
  if (!mod) { res.status(404).json({ error: "Module not found" }); return; }
  res.json(formatModule(mod));
});

router.put("/phase0/modules/:moduleName", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req as any).user.id as string;
  const { moduleName } = req.params;
  const athlete = await getAthlete(userId);
  if (!athlete) { res.status(404).json({ error: "Athlete not found" }); return; }

  const parsed = SavePhase0ModuleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { data, completed } = parsed.data;

  const [existing] = await db.select().from(phase0ModulesTable)
    .where(and(eq(phase0ModulesTable.athleteId, athlete.id), eq(phase0ModulesTable.moduleName, moduleName)))
    .limit(1);

  let mod;
  const completedAt = completed ? new Date() : null;

  if (existing) {
    const [updated] = await db.update(phase0ModulesTable)
      .set({ data: data as any, completed, completedAt })
      .where(eq(phase0ModulesTable.id, existing.id))
      .returning();
    mod = updated;
  } else {
    const [created] = await db.insert(phase0ModulesTable)
      .values({ athleteId: athlete.id, moduleName, data: data as any, completed, completedAt })
      .returning();
    mod = created;
  }

  // Check if all modules are complete → mark phase0 done
  if (completed) {
    const allModules = await db.select().from(phase0ModulesTable).where(eq(phase0ModulesTable.athleteId, athlete.id));
    const completedCount = allModules.filter(m => m.completed).length;
    if (completedCount >= MODULE_NAMES.length) {
      await db.update(athletesTable).set({ phase0CompletedAt: new Date() }).where(eq(athletesTable.id, athlete.id));
    }
  }

  res.json(formatModule(mod));
});

export default router;
