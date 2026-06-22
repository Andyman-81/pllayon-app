---
name: Pllay component naming
description: Current exported names from src/components/ui-elements.tsx after the spec-compliance refactor.
---

After refactoring to match the spec, the named exports from `src/components/ui-elements.tsx` are:

- `RatingBox` — single 36×36 box, `selected` prop = cumulative fill
- `ScorecardTable` — full table (5 rows × 5 RatingBox columns), dark header row
- `WriteField` — auto-grow textarea with border-bottom only, phase-colour focus
- `ImplIntention` — 3-column WHEN/WHERE/HOW grid on `--grey1` background
- `MissionBox` — left-border box, `phaseColour + '14'` background
- `FocusQuestion` — left-border box on `--grey1`
- `Callout` — left-border note box
- `PhaseDivider` — full-colour phase header with ghost number
- `ModuleHeader` — module eyebrow + large title + desc
- `RatingRow` — standalone rating (competition review use)
- `SaveIndicator` — idle/saving/saved/error status label
- `PhaseBadge` — phase colour pill
- `ProgressBarInline` — thin horizontal bar
- `DataTable` — dark-header table

**Old names that no longer exist:** `Scorecard` (→ `ScorecardTable`), `ImplIntentionTrio` (→ `ImplIntention`), `ProgressBar` (→ `ProgressBarInline`).

**Why:** Renamed to match the spec's component names exactly and to remove ambiguity.
