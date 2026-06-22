---
name: Coach-parent role flow
description: Role-based routing, DB tables, and API endpoints for coach and parent roles in Pllay On Edge
---

## Role routing

Role stored in `localStorage` as `po_role` via `getRole()`/`saveRole()` in `lib/useRole.ts`.

After Replit Auth login, `SmartRoot` (in `App.tsx`) reads the role and redirects:
- `coach` → `/dashboard/coach` (CoachDashboard)
- `parent` → `/dashboard/parent` (ParentDashboard)
- `athlete` → renders Dashboard directly (existing flow)

Each role dashboard checks for profile on mount → 404 → redirects to `/register/coach` or `/register/parent`.

## DB schema (`lib/db/src/schema/coach-parent.ts`)

Tables (all serial PKs, userId text FKs referencing users.id):
- `coaches` (id, userId unique, name, club, specialisation, createdAt)
- `coach_athlete_links` (id, coachId→coaches.id, athleteId→athletes.id, linkedAt)
- `parents` (id, userId unique, name, createdAt)
- `parent_athlete_links` (id, parentId→parents.id, athleteId→athletes.id, linkedAt)
- `coach_reviews` (id, coachId, athleteId, all ratings + text fields, updatedAt)
- `parent_weekly_observations` (id, parentId, athleteId, weekNumber, observation, createdAt)
- `parent_checkin_observations` (id, parentId, athleteId, monthNumber, ratings + text fields, createdAt)

## API endpoints

Coach (`/api/coach/*`):
- `GET/POST /coach/profile` — own coach row (404 if not registered)
- `POST /coach/link-athlete` — body: {athleteEmail} → look up users by email → athletes by userId → insert link
- `GET /coach/dashboard` — aggregated data: linkedAthlete, schedule, reflections, competitionReviews, phase0Modules, cyclePlan
- `GET/PUT /coach/review` — coach review for linked athlete

Parent (`/api/parent/*`):
- `GET/POST /parent/profile` — own parent row
- `POST /parent/link-athlete` — same email-lookup pattern
- `GET /parent/dashboard` — linkedAthlete, currentWeek, parentQuestion, published schedule
- `GET/POST /parent/observations` — weekly observations

## Athlete linking

Linking coach/parent to athlete by email:
1. SELECT from `usersTable` WHERE `email = athleteEmail` → get `user.id`
2. SELECT from `athletesTable` WHERE `userId = user.id` → get `athlete.id`
3. INSERT into coach_athlete_links / parent_athlete_links

**Why:** Athletes use Replit Auth (no email/password). Their email is stored in `users.email` from Replit OIDC. Athletes table has `userId` (varchar) not email.

## No Supabase

Spec mentions Supabase but app uses Replit Auth + Drizzle ORM + PostgreSQL. No email/password fields on registration forms — auth is handled entirely by Replit OIDC. Coach/parent registration forms only capture profile data.
