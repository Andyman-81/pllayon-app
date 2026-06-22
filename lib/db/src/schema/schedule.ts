import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const weeklySchedulesTable = pgTable("weekly_schedules", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  sessionType: text("session_type").notNull(),
  timeFrom: text("time_from"),
  timeTo: text("time_to"),
  notes: text("notes"),
  createdBy: text("created_by").default("coach").notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeeklySchedule = typeof weeklySchedulesTable.$inferSelect;

export const athleteDayNotesTable = pgTable("athlete_day_notes", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  note: text("note"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AthleteDayNote = typeof athleteDayNotesTable.$inferSelect;

export const cyclePlanTable = pgTable("cycle_plan", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  eventType: text("event_type").notNull(),
  eventName: text("event_name"),
  dateFrom: text("date_from"),
  dateTo: text("date_to"),
  focusNote: text("focus_note"),
  notes: text("notes"),
  createdBy: text("created_by").default("coach").notNull(),
  published: boolean("published").default(false).notNull(),
  locked: boolean("locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CyclePlan = typeof cyclePlanTable.$inferSelect;

export const cycleAthleteGoalsTable = pgTable("cycle_athlete_goals", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  goal: text("goal"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CycleAthleteGoal = typeof cycleAthleteGoalsTable.$inferSelect;
