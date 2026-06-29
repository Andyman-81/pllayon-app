import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

/* Root of /api — used by Replit's healthcheck */
router.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), app: "Pllay On Edge" });
});

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
