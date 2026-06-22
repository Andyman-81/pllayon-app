---
name: Pllay layout pattern
description: How the Layout component works and how pages should use it.
---

`src/components/layout.tsx` exports `Layout` and `PageHeader`.

**Layout:**
- Fetches athlete profile and progress internally via React Query (cached, no duplicates)
- Renders a fixed top `<nav className="nav">` (52px, `rgba(15,23,42,.97)` bg, phase-colour 4px bottom border)
- Main content gets `paddingTop: 56px`
- Renders `<ProgressWidget>` in fixed bottom-right corner (only when progress data is available)
- Props: `currentPhase` (number, default 0), `currentSection` (string, defaults to "Phase N: Label")

**Pages usage pattern:**
```tsx
<Layout currentPhase={phase} currentSection="Week 3">
  <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>
    ...content...
  </div>
</Layout>
```

The `120px` bottom padding is needed to ensure content isn't hidden behind the ProgressWidget.

**Why:** The spec has a fixed top navbar (not bottom tabs) with phase-colour bottom border. The ProgressWidget is fixed bottom-right. Layout owns both so every page gets them automatically.

**How to apply:** Always use `currentPhase` on Layout so the navbar border and ProgressWidget colour match the current page's phase. Pass `currentSection` to show what module/week the user is on in the navbar pill.
