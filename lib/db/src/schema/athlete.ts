import { pgTable, serial, text, integer, boolean, timestamp, date, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const athletesTable = pgTable("athletes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  dob: text("dob").notNull(),
  sport: text("sport").notNull(),
  club: text("club"),
  coachName: text("coach_name"),
  parentName: text("parent_name"),
  programStartDate: text("program_start_date").notNull(),
  phase0CompletedAt: timestamp("phase0_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAthleteSchema = createInsertSchema(athletesTable).omit({ id: true, createdAt: true });
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletesTable.$inferSelect;

export const phase0ModulesTable = pgTable("phase0_modules", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  moduleName: text("module_name").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  data: jsonb("data").default({}),
});

export const insertPhase0ModuleSchema = createInsertSchema(phase0ModulesTable).omit({ id: true });
export type InsertPhase0Module = z.infer<typeof insertPhase0ModuleSchema>;
export type Phase0Module = typeof phase0ModulesTable.$inferSelect;

export const weeklyReflectionsTable = pgTable("weekly_reflections", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  completedAt: timestamp("completed_at"),
  effort: integer("effort"),
  focus: integer("focus"),
  consistency: integer("consistency"),
  recovery: integer("recovery"),
  ownership: integer("ownership"),
  bestMoment: text("best_moment"),
  biggestChallenge: text("biggest_challenge"),
  keyLearning: text("key_learning"),
  focusAnswer: text("focus_answer"),
  implWhen: text("impl_when"),
  implWhere: text("impl_where"),
  implHow: text("impl_how"),
});

export const insertWeeklyReflectionSchema = createInsertSchema(weeklyReflectionsTable).omit({ id: true });
export type InsertWeeklyReflection = z.infer<typeof insertWeeklyReflectionSchema>;
export type WeeklyReflection = typeof weeklyReflectionsTable.$inferSelect;

export const competitionReviewsTable = pgTable("competition_reviews", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  phase: text("phase"),
  competitionName: text("competition_name"),
  competitionDate: text("competition_date"),
  opponent: text("opponent"),
  result: text("result"),
  performanceRating: integer("performance_rating"),
  decisionRating: integer("decision_rating"),
  emotionRating: integer("emotion_rating"),
  bestDecision: text("best_decision"),
  changeDecision: text("change_decision"),
  keyLearning: text("key_learning"),
  implWhen: text("impl_when"),
  implWhere: text("impl_where"),
  implHow: text("impl_how"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertCompetitionReviewSchema = createInsertSchema(competitionReviewsTable).omit({ id: true });
export type InsertCompetitionReview = z.infer<typeof insertCompetitionReviewSchema>;
export type CompetitionReview = typeof competitionReviewsTable.$inferSelect;

export const monthlyCheckinsTable = pgTable("monthly_checkins", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  monthNumber: integer("month_number").notNull(),
  completedAt: timestamp("completed_at"),
  effortAvg: real("effort_avg"),
  focusAvg: real("focus_avg"),
  consistencyAvg: real("consistency_avg"),
  recoveryAvg: real("recovery_avg"),
  ownershipAvg: real("ownership_avg"),
  goal1Progress: text("goal1_progress"),
  goal2Progress: text("goal2_progress"),
  behaviour1Status: text("behaviour1_status"),
  keyHabit: text("key_habit"),
  keyLearning: text("key_learning"),
  changeNextPhase: text("change_next_phase"),
  data: jsonb("data").default({}),
});

export const insertMonthlyCheckinSchema = createInsertSchema(monthlyCheckinsTable).omit({ id: true });
export type InsertMonthlyCheckin = z.infer<typeof insertMonthlyCheckinSchema>;
export type MonthlyCheckin = typeof monthlyCheckinsTable.$inferSelect;

export const capstoneTable = pgTable("capstone", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().unique(),
  completedAt: timestamp("completed_at"),
  physicalStart: integer("physical_start"),
  physicalNow: integer("physical_now"),
  technicalStart: integer("technical_start"),
  technicalNow: integer("technical_now"),
  tacticalStart: integer("tactical_start"),
  tacticalNow: integer("tactical_now"),
  psychologicalStart: integer("psychological_start"),
  psychologicalNow: integer("psychological_now"),
  lifestyleStart: integer("lifestyle_start"),
  lifestyleNow: integer("lifestyle_now"),
  goal1Achieved: text("goal1_achieved"),
  goal2Achieved: text("goal2_achieved"),
  goal3Achieved: text("goal3_achieved"),
  evidenceCompetition: text("evidence_competition"),
  evidenceTechnical: text("evidence_technical"),
  evidenceBehaviour: text("evidence_behaviour"),
  fieldTest1: boolean("field_test_1"),
  fieldTest2: boolean("field_test_2"),
  fieldTestNotes: text("field_test_notes"),
  engagementRating: integer("engagement_rating"),
  awarenessRating: integer("awareness_rating"),
  decisionsRating: integer("decisions_rating"),
  accountabilityRating: integer("accountability_rating"),
  proudMoment: text("proud_moment"),
  fellShort: text("fell_short"),
  learned: text("learned"),
  doDifferently: text("do_differently"),
  signatureName: text("signature_name"),
});

export const insertCapstoneSchema = createInsertSchema(capstoneTable).omit({ id: true });
export type InsertCapstone = z.infer<typeof insertCapstoneSchema>;
export type Capstone = typeof capstoneTable.$inferSelect;

export const sleepLogsTable = pgTable("sleep_logs", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  logDate: date("log_date").notNull(),
  rating: integer("rating").notNull(),
  hoursSlept: real("hours_slept"),
  notes: text("notes"),
});

export const insertSleepLogSchema = createInsertSchema(sleepLogsTable).omit({ id: true });
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type SleepLog = typeof sleepLogsTable.$inferSelect;
