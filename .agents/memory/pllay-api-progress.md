---
name: Pllay API progress fields
description: Fields returned by GET /api/progress, especially non-obvious ones.
---

The progress endpoint (`GET /api/athlete/progress`) returns:

```ts
{
  currentPhase: number,       // 0–4
  currentWeek: number,        // 0–12 (0 = phase0 not complete)
  weeksCompleted: number,
  reflectionsCompleted: number,
  phase0Complete: boolean,
  overallCompletionPct: number, // 0–100
  streakWeeks: number,        // ← field name is streakWeeks, not streak
  competitionReviewsCount: number,
  month1CheckinComplete: boolean,
  month2CheckinComplete: boolean,
  capstoneComplete: boolean,
  domainScores: { physical, technical, tactical, psychological, lifestyle }
}
```

Streak is called `streakWeeks` (not `streak`). Computed as consecutive weeks from 1 without gaps.

Overall completion is out of 16 total points: phase0(1) + 12 weeks + 2 checkins + capstone.
