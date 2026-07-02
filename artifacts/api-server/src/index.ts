import app from "./app";
import { logger } from "./lib/logger";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const STATEMENTS = [
  sql`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid"    varchar   PRIMARY KEY,
      "sess"   jsonb     NOT NULL,
      "expire" timestamp NOT NULL
    )
  `,
  sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire")`,
  sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id"                varchar     PRIMARY KEY DEFAULT gen_random_uuid(),
      "email"             varchar     UNIQUE,
      "password_hash"     varchar,
      "first_name"        varchar,
      "last_name"         varchar,
      "profile_image_url" varchar,
      "created_at"        timestamptz NOT NULL DEFAULT now(),
      "updated_at"        timestamptz NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "athletes" (
      "id"                  serial    PRIMARY KEY,
      "user_id"             text      NOT NULL UNIQUE,
      "name"                text      NOT NULL,
      "dob"                 text      NOT NULL,
      "sport"               text      NOT NULL,
      "club"                text,
      "coach_name"          text,
      "parent_name"         text,
      "program_start_date"  text      NOT NULL,
      "phase0_completed_at" timestamp,
      "created_at"          timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "phase0_modules" (
      "id"           serial    PRIMARY KEY,
      "athlete_id"   integer   NOT NULL,
      "module_name"  text      NOT NULL,
      "completed"    boolean   NOT NULL DEFAULT false,
      "completed_at" timestamp,
      "data"         jsonb     DEFAULT '{}'
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "weekly_reflections" (
      "id"                serial    PRIMARY KEY,
      "athlete_id"        integer   NOT NULL,
      "week_number"       integer   NOT NULL,
      "completed_at"      timestamp,
      "effort"            integer,
      "focus"             integer,
      "consistency"       integer,
      "recovery"          integer,
      "ownership"         integer,
      "best_moment"       text,
      "biggest_challenge" text,
      "key_learning"      text,
      "focus_answer"      text,
      "impl_when"         text,
      "impl_where"        text,
      "impl_how"          text
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "competition_reviews" (
      "id"                  serial    PRIMARY KEY,
      "athlete_id"          integer   NOT NULL,
      "phase"               text,
      "competition_name"    text,
      "competition_date"    text,
      "opponent"            text,
      "result"              text,
      "performance_rating"  integer,
      "decision_rating"     integer,
      "emotion_rating"      integer,
      "best_decision"       text,
      "change_decision"     text,
      "key_learning"        text,
      "impl_when"           text,
      "impl_where"          text,
      "impl_how"            text,
      "completed_at"        timestamp DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "monthly_checkins" (
      "id"                serial    PRIMARY KEY,
      "athlete_id"        integer   NOT NULL,
      "month_number"      integer   NOT NULL,
      "completed_at"      timestamp,
      "effort_avg"        real,
      "focus_avg"         real,
      "consistency_avg"   real,
      "recovery_avg"      real,
      "ownership_avg"     real,
      "goal1_progress"    text,
      "goal2_progress"    text,
      "behaviour1_status" text,
      "key_habit"         text,
      "key_learning"      text,
      "change_next_phase" text,
      "data"              jsonb DEFAULT '{}'
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "capstone" (
      "id"                      serial    PRIMARY KEY,
      "athlete_id"              integer   NOT NULL UNIQUE,
      "completed_at"            timestamp,
      "physical_start"          integer,
      "physical_now"            integer,
      "technical_start"         integer,
      "technical_now"           integer,
      "tactical_start"          integer,
      "tactical_now"            integer,
      "psychological_start"     integer,
      "psychological_now"       integer,
      "lifestyle_start"         integer,
      "lifestyle_now"           integer,
      "goal1_achieved"          text,
      "goal2_achieved"          text,
      "goal3_achieved"          text,
      "evidence_competition"    text,
      "evidence_technical"      text,
      "evidence_behaviour"      text,
      "field_test_1"            boolean,
      "field_test_2"            boolean,
      "field_test_notes"        text,
      "engagement_rating"       integer,
      "awareness_rating"        integer,
      "decisions_rating"        integer,
      "accountability_rating"   integer,
      "proud_moment"            text,
      "fell_short"              text,
      "learned"                 text,
      "do_differently"          text,
      "signature_name"          text
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "sleep_logs" (
      "id"          serial  PRIMARY KEY,
      "athlete_id"  integer NOT NULL,
      "log_date"    date    NOT NULL,
      "rating"      integer NOT NULL,
      "hours_slept" real,
      "notes"       text
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "daily_reflections" (
      "id"               serial    PRIMARY KEY,
      "athlete_id"       integer   NOT NULL,
      "week_number"      integer   NOT NULL,
      "day_of_week"      text      NOT NULL,
      "session_type"     text,
      "session_focus"    text      NOT NULL DEFAULT '',
      "went_well"        text,
      "challenging"      text,
      "development_note" text,
      "physical_status"  text,
      "session_rating"   integer,
      "energy_rating"    integer,
      "created_at"       timestamp NOT NULL DEFAULT now(),
      "updated_at"       timestamp NOT NULL DEFAULT now(),
      UNIQUE ("athlete_id", "week_number", "day_of_week")
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "program_settings" (
      "id"                 serial    PRIMARY KEY,
      "athlete_id"         integer   NOT NULL UNIQUE,
      "program_start_date" text,
      "updated_at"         timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "injury_flags" (
      "id"                      serial    PRIMARY KEY,
      "athlete_id"              integer   NOT NULL,
      "logged_by"               text      NOT NULL,
      "logged_by_name"          text,
      "created_at"              timestamp NOT NULL DEFAULT now(),
      "updated_at"              timestamp NOT NULL DEFAULT now(),
      "body_area"               text      NOT NULL DEFAULT '',
      "side"                    text,
      "concern_type"            text      NOT NULL DEFAULT '',
      "severity"                integer   NOT NULL DEFAULT 1,
      "onset"                   text      NOT NULL DEFAULT '',
      "when_occurred"           text,
      "description"             text      NOT NULL DEFAULT '',
      "affects_training"        boolean   DEFAULT true,
      "week_number"             integer,
      "day_of_week"             text,
      "status"                  text      NOT NULL DEFAULT 'open',
      "coach_response"          text,
      "coach_action"            text,
      "coach_responded_at"      timestamp,
      "training_modification"   text,
      "return_to_full_training" text,
      "follow_up_required"      boolean   DEFAULT false,
      "follow_up_date"          text,
      "resolved_at"             timestamp
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "coaches" (
      "id"             serial    PRIMARY KEY,
      "user_id"        text      NOT NULL UNIQUE,
      "name"           text      NOT NULL,
      "club"           text,
      "specialisation" text,
      "created_at"     timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "coach_athlete_links" (
      "id"         serial    PRIMARY KEY,
      "coach_id"   integer   NOT NULL,
      "athlete_id" integer   NOT NULL,
      "linked_at"  timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "parents" (
      "id"         serial    PRIMARY KEY,
      "user_id"    text      NOT NULL UNIQUE,
      "name"       text      NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "parent_athlete_links" (
      "id"         serial    PRIMARY KEY,
      "parent_id"  integer   NOT NULL,
      "athlete_id" integer   NOT NULL,
      "linked_at"  timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "coach_reviews" (
      "id"                         serial    PRIMARY KEY,
      "coach_id"                   integer   NOT NULL,
      "athlete_id"                 integer   NOT NULL,
      "created_at"                 timestamp NOT NULL DEFAULT now(),
      "updated_at"                 timestamp NOT NULL DEFAULT now(),
      "technical_rating"           integer,
      "tactical_rating"            integer,
      "physical_rating"            integer,
      "coachability_rating"        integer,
      "awareness_rating"           integer,
      "biggest_improvement"        text,
      "remaining_constraint"       text,
      "technical_priority"         text,
      "tactical_priority"          text,
      "physical_priority"          text,
      "competition_recommendation" text,
      "behaviour_note"             text,
      "additional_notes"           text
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "parent_weekly_observations" (
      "id"          serial    PRIMARY KEY,
      "parent_id"   integer   NOT NULL,
      "athlete_id"  integer   NOT NULL,
      "week_number" integer   NOT NULL,
      "observation" text,
      "created_at"  timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "parent_checkin_observations" (
      "id"                     serial    PRIMARY KEY,
      "parent_id"              integer   NOT NULL,
      "athlete_id"             integer   NOT NULL,
      "month_number"           integer   NOT NULL,
      "effort_rating"          integer,
      "engagement_rating"      integer,
      "positive_change_rating" integer,
      "most_positive"          text,
      "do_differently"         text,
      "capstone_question"      text,
      "created_at"             timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "athlete_profiles" (
      "id"                     serial    PRIMARY KEY,
      "coach_id"               integer   NOT NULL,
      "created_at"             timestamp NOT NULL DEFAULT now(),
      "name"                   text      NOT NULL,
      "date_of_birth"          text,
      "sport"                  text      DEFAULT 'Tennis',
      "club"                   text,
      "maturity_stage"         text,
      "program_start_date"     text,
      "notes"                  text,
      "invite_code"            text      NOT NULL UNIQUE,
      "invite_code_expires_at" timestamp,
      "linked_athlete_id"      integer,
      "linked_at"              timestamp,
      "status"                 text      NOT NULL DEFAULT 'pending'
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "weekly_schedules" (
      "id"           serial    PRIMARY KEY,
      "athlete_id"   integer   NOT NULL,
      "week_number"  integer   NOT NULL,
      "day_of_week"  text      NOT NULL,
      "session_type" text      NOT NULL,
      "time_from"    text,
      "time_to"      text,
      "notes"        text,
      "created_by"   text      NOT NULL DEFAULT 'coach',
      "published"    boolean   NOT NULL DEFAULT false,
      "created_at"   timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "athlete_day_notes" (
      "id"          serial    PRIMARY KEY,
      "athlete_id"  integer   NOT NULL,
      "week_number" integer   NOT NULL,
      "day_of_week" text      NOT NULL,
      "note"        text,
      "updated_at"  timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "cycle_plan" (
      "id"           serial    PRIMARY KEY,
      "athlete_id"   integer   NOT NULL,
      "week_number"  integer   NOT NULL,
      "event_type"   text      NOT NULL,
      "event_name"   text,
      "date_from"    text,
      "date_to"      text,
      "focus_note"   text,
      "notes"        text,
      "created_by"   text      NOT NULL DEFAULT 'coach',
      "published"    boolean   NOT NULL DEFAULT false,
      "locked"       boolean   NOT NULL DEFAULT false,
      "created_at"   timestamp NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "cycle_athlete_goals" (
      "id"          serial    PRIMARY KEY,
      "athlete_id"  integer   NOT NULL,
      "week_number" integer   NOT NULL,
      "goal"        text,
      "updated_at"  timestamp NOT NULL DEFAULT now()
    )
  `,
];

async function ensureSchema() {
  let passed = 0;
  let failed = 0;
  for (const stmt of STATEMENTS) {
    try {
      await db.execute(stmt);
      passed++;
    } catch (err) {
      failed++;
      logger.warn({ err }, `Schema statement ${passed + failed} failed — skipping`);
    }
  }
  logger.info({ passed, failed, total: STATEMENTS.length }, "Schema check complete");
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
