# Pllay On Edge — Athlete Edition

A 12-week athlete development tracking app for young athletes aged 10–18. Structured developmental curriculum with phase-gated progression, weekly accountability, and evidence-based development tracking.

## Run & Operate

- `pnpm --filter @workspace/pllay-athlete run dev` — run the frontend (port 20521)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (Barlow Condensed, Inter, Space Mono fonts)
- API: Express 5
- Auth: Replit Auth (OpenID Connect with PKCE)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pllay-athlete/` — React + Vite frontend
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod schemas for server routes
- `lib/db/src/schema/athlete.ts` — All app tables (athletes, phase0_modules, weekly_reflections, competition_reviews, monthly_checkins, capstone, sleep_logs)
- `lib/db/src/schema/auth.ts` — Auth/session tables

## Architecture decisions

- Phase-gated progression: Phase 0 must be completed before Week 1 unlocks; months 1/2 check-ins unlock after 4/8 weeks; capstone unlocks after 12 weeks.
- Pre-loaded content (week missions and focus questions) is hard-coded on the frontend — athletes cannot edit them.
- All weekly/module data auto-saves with 2-second debounce via React Query mutations.
- Phase colour system is the primary visual navigation signal (Blue → Green → Yellow → Red → Black).
- Coaches and parents do not have app access in V1 — their names are stored as reference only.

## Product

- Onboarding: Athlete registration (name, DOB, sport, club, coach, parent)
- Phase 0 — Establishment: 6 structured modules (assessment, competitive advantage map, profile/values, goals, roadmap, commitment)
- 12 weeks of structured weekly reflections with 5-dimension scorecards and implementation intentions
- Competition reviews available at any time
- Month 1 and Month 2 check-ins gating phase transitions
- Capstone review with domain comparison, goal achievement evidence, and digital signature
- Appendices A–D: static reference content (warm-up, S&C, body management with sleep log, cooldown)
- Progress screen with domain score bar charts (start vs. current)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before touching frontend or backend route code.
- The `replit-auth-web` lib needs `vite/client` types because it uses `import.meta.env`.
- Vite `fs.strict: false` required on the frontend to allow resolution of workspace lib packages outside the artifact directory.
