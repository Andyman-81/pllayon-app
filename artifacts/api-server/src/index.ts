import app from "./app";
import { logger } from "./lib/logger";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

async function ensureSchema() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY,
        "email" varchar UNIQUE,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "athlete_profiles" (
        "id" serial PRIMARY KEY,
        "coach_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "name" text NOT NULL,
        "date_of_birth" text,
        "sport" text DEFAULT 'Tennis',
        "club" text,
        "maturity_stage" text,
        "program_start_date" text,
        "notes" text,
        "invite_code" text NOT NULL,
        "invite_code_expires_at" timestamp,
        "linked_athlete_id" integer,
        "linked_at" timestamp,
        "status" text DEFAULT 'pending' NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "athlete_profiles_invite_code_unique"
        ON "athlete_profiles" ("invite_code");

      CREATE TABLE IF NOT EXISTS "program_settings" (
        "id" serial PRIMARY KEY,
        "athlete_id" integer NOT NULL,
        "program_start_date" text,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "program_settings_athlete_id_unique"
        ON "program_settings" ("athlete_id");
    `);
    logger.info("Schema check complete");
  } catch (err) {
    logger.warn({ err }, "Schema check failed — continuing anyway");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* Start listening immediately so the healthcheck passes on cold boot,
   then run schema migrations in the background. */
const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

server.on("listening", () => {
  ensureSchema();
});
