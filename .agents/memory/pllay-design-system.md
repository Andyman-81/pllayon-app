---
name: Pllay design system
description: CSS approach and design rules for Pllay On Edge app. Bans shadcn, uses raw custom properties.
---

The spec explicitly bans shadcn/Radix/MUI ("No component libraries"). The `src/components/ui/` scaffold directory exists but must not be used in page or custom component code.

All styling is done via:
1. CSS custom properties in `index.css` — `--green`, `--red`, `--blue`, `--yellow`, `--dark`, `--grey`, `--grey1`, `--grey2`, `--mid`, `--ink`, `--ph0`–`--ph4`, `--r`, `--font-d`, `--font-b`, `--font-m`
2. Named CSS classes in `index.css` — `.scorecard`, `.sc-head`, `.sc-row`, `.rb`, `.rb.on`, `.wf`, `.wl`, `.mission-box`, `.focus-q`, `.impl`, `.impl-col`, `.nav`, `.progress-widget`, etc.
3. Inline `style={{}}` for dynamic phase colours

**Why:** The spec says to replicate the HTML workbook's design system exactly, including its CSS class names and custom property names. Shadcn overrides these with its own Tailwind-based token system.

**How to apply:** Build new components by adding classes from index.css to elements. Use `style={{ color: phaseColour }}` for dynamic colours. Never import from `@/components/ui/`.
