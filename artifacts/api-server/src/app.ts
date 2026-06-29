import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

/* ── Fast health routes ─────────────────────────────────────────────────────
   These MUST come before every middleware (pino, cors, auth, etc.) so the
   deployment healthcheck gets a 200 in < 5 ms even on cold start.        */
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});
app.get("/api", (_req, res) => {
  res.status(200).json({ status: "ok", app: "Pllay On Edge" });
});
/* ── End fast health routes ─────────────────────────────────────────────── */

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
