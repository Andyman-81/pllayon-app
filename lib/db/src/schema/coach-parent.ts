import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const coachesTable = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  club: text("club"),
  specialisation: text("specialisation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Coach = typeof coachesTable.$inferSelect;

export const coachAthleteLinksTable = pgTable("coach_athlete_links", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
});
export type CoachAthleteLink = typeof coachAthleteLinksTable.$inferSelect;

export const parentsTable = pgTable("parents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Parent = typeof parentsTable.$inferSelect;

export const parentAthleteLinksTable = pgTable("parent_athlete_links", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
});
export type ParentAthleteLink = typeof parentAthleteLinksTable.$inferSelect;

export const coachReviewsTable = pgTable("coach_reviews", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  technicalRating: integer("technical_rating"),
  tacticalRating: integer("tactical_rating"),
  physicalRating: integer("physical_rating"),
  coachabilityRating: integer("coachability_rating"),
  awarenessRating: integer("awareness_rating"),
  biggestImprovement: text("biggest_improvement"),
  remainingConstraint: text("remaining_constraint"),
  technicalPriority: text("technical_priority"),
  tacticalPriority: text("tactical_priority"),
  physicalPriority: text("physical_priority"),
  competitionRecommendation: text("competition_recommendation"),
  behaviourNote: text("behaviour_note"),
  additionalNotes: text("additional_notes"),
});
export type CoachReview = typeof coachReviewsTable.$inferSelect;

export const parentWeeklyObservationsTable = pgTable("parent_weekly_observations", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ParentWeeklyObservation = typeof parentWeeklyObservationsTable.$inferSelect;

export const parentCheckinObservationsTable = pgTable("parent_checkin_observations", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  athleteId: integer("athlete_id").notNull(),
  monthNumber: integer("month_number").notNull(),
  effortRating: integer("effort_rating"),
  engagementRating: integer("engagement_rating"),
  positiveChangeRating: integer("positive_change_rating"),
  mostPositive: text("most_positive"),
  doDifferently: text("do_differently"),
  capstoneQuestion: text("capstone_question"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ParentCheckinObservation = typeof parentCheckinObservationsTable.$inferSelect;

export const athleteProfilesTable = pgTable("athlete_profiles", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  sport: text("sport").default("Tennis"),
  club: text("club"),
  maturityStage: text("maturity_stage"),
  programStartDate: text("program_start_date"),
  notes: text("notes"),
  inviteCode: text("invite_code").notNull().unique(),
  inviteCodeExpiresAt: timestamp("invite_code_expires_at"),
  linkedAthleteId: integer("linked_athlete_id"),
  linkedAt: timestamp("linked_at"),
  status: text("status").default("pending").notNull(),
});
export type AthleteProfile = typeof athleteProfilesTable.$inferSelect;
