# Design System — Gravity

<!-- HAND-EDITED: Edit this preamble section freely. build.js preserves it. -->

## Aesthetic Direction

**Editorial minimal.** Quiet confidence. Information-dense without feeling crowded. The design speaks through restraint — warm neutrals, a single forest green accent, and typography that borrows from print editorial tradition.

- **Decoration level:** Low. No gradients, no illustrations, no blobs. Texture comes from a subtle noise overlay and typographic contrast (serif headlines, sans body, mono labels).
- **Mood:** Calm, precise, trustworthy. Like reading a well-typeset journal.
- **Reference sites:** Linear (information density), Notion (editorial calm), Stripe (typographic precision).

---

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / Headings | Cormorant Garamond | 300–700 | Page titles, hero text, section headers |
| Body / UI | DM Sans | 300–700 | Paragraphs, buttons, nav, form labels |
| Labels / Code | DM Mono | 400–500 | Eyebrows, data labels, code blocks |

**CDN:** Google Fonts
```
Cormorant Garamond: ital 300,400,500,600,700 + italic 300,400
DM Sans: ital 300,400,500,600,700 + italic 400
DM Mono: 400,500
```

### Type Scale (responsive clamp)

| Token | Min | Max | Usage |
|-------|-----|-----|-------|
| `--text-xs` | 0.56rem | 0.66rem | Fine print, timestamps |
| `--text-sm` | 0.72rem | 0.82rem | Captions, metadata |
| `--text-base` | 0.85rem | 1rem | Body text, UI |
| `--text-lg` | 1.1rem | 1.3rem | Subheadings |
| `--text-xl` | 1.3rem | 1.6rem | Section titles |
| `--text-2xl` | 1.6rem | 2rem | Page titles |
| `--text-3xl` | 2rem | 2.6rem | Hero / display |

**Base:** 14px desktop, 13px below 900px.

### Typography Utilities

- `.text-eyebrow` — DM Mono, 0.56rem, uppercase, 0.08em tracking, 500 weight
- `.gravity-label` — DM Mono, 0.6rem, uppercase, 0.06em tracking, 500 weight
- `.font-serif` — Apply Cormorant Garamond
- `.tracking-tight-editorial` — -0.02em (for headlines)
- `.tracking-wide-editorial` — 0.08em (for caps/labels)

---

## Color

### Brand Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FFFFFF` | Page background |
| `--color-surface` | `#F6F5F2` | Card/panel background |
| `--color-card` | `#F6F5F2` | Card fill |
| `--color-card-hover` | `#EFEDE8` | Card hover state |
| `--color-text` | `#111114` | Primary text |
| `--color-text-secondary` | `#888` | Secondary text |
| `--color-text-faint` | `#aaa` | Tertiary/disabled text |
| `--color-accent` | `#2A7A5B` | Primary action, links, focus |
| `--color-accent-light` | `#E8F5EE` | Accent tint backgrounds |
| `--color-accent-dim` | `#E8F5EE` | Subtle accent fills |
| `--color-border` | `#E8E5E0` | Default borders |
| `--color-border-light` | `#D8D5D0` | Prominent borders |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#2A7A5B` | Success states (same as accent) |
| `--color-warning` | `#B8860B` | Warning states (goldenrod) |
| `--color-danger` | `#C0392B` | Error/destructive states |
| `--color-muted` | `#888` | Disabled/muted content |

### Accent Scale (overrides Tailwind indigo + teal)

| Step | Value |
|------|-------|
| 50 | `#E8F5EE` |
| 100 | `#D1EBE0` |
| 200 | `#A3D7C1` |
| 300 | `#75C3A2` |
| 400 | `#3DA87A` |
| 500–600 | `#2A7A5B` |
| 700 | `#1F5F46` |
| 800 | `#164536` |
| 900 | `#0D2B22` |
| 950 | `#071A14` |

### Warm Gray Scale (overrides Tailwind gray, stone, zinc)

All three Tailwind gray families map to the same warm neutral scale:

| Step | Value |
|------|-------|
| 50 | `#FAFAF8` |
| 100 | `#F6F5F2` |
| 200 | `#E8E5E0` |
| 300 | `#D8D5D0` |
| 400 | `#A3A39D` |
| 500 | `#888` |
| 600 | `#525250` |
| 700 | `#40403D` |
| 800 | `#262624` |
| 900 | `#111114` |
| 950 | `#0A0A09` |

---

## Spacing

- **Base unit:** 4px
- **Scroll padding:** 72px top (for fixed headers)

### Layout Utilities

- `.hairline-b/t/l/r` — 1px solid `--color-border`
- `.noise-overlay` — Subtle fractal noise at 0.018 opacity (fixed, pointer-events: none)
- `.row-hover` — 4px left-shift + 3% accent background on hover

---

## Motion

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-smooth` | `cubic-bezier(0.22, 1, 0.36, 1)` | General transitions, slide-ins |
| `--ease-snappy` | `cubic-bezier(0.16, 1, 0.3, 1)` | Quick interactions |

### Animations

| Name | Duration | Usage |
|------|----------|-------|
| `pulse-dot` | 2s infinite | Activity indicators |
| `slide-in` | 0.25s | Toast/drawer entrance |
| `view-fade` | 0.2s | Page transitions |
| `shimmer` | 1.5s infinite | Skeleton loading |
| `card-hover` | 0.2s | Card lift on hover (-1px + shadow) |

### Interactive Defaults

- All `button`, `a`, `[role="button"]`: `transition: all 0.2s ease`
- Focus: `2px solid accent`, 2px offset
- `prefers-reduced-motion`: all durations → 0.01ms

---

## Extensions

### Brane (terminal UI)

| Animation | Duration | Usage |
|-----------|----------|-------|
| `blink` | 1s step-end | Terminal cursor |
| `pulse-subtle` | 1.5s ease-in-out | Active log line highlight |

---

## Anti-Patterns (do NOT do)

- No default indigo/violet — our accent is forest green `#2A7A5B`
- No blob/wave SVG backgrounds
- No generic "Supercharge your workflow" copy
- No feature grids with identical card structures
- No hover effects on non-interactive elements
- No hardcoded colors — always use `var(--color-*)` tokens
- No animations that don't serve feedback, continuity, or hierarchy

---

## Apps Using Gravity

| App | Framework | Port | Extensions |
|-----|-----------|------|------------|
| Spacekayak.ops (Fermi Ops) | Vite + TW4 | 3000 | — |
| Feedback Hub | Vite + TW4 | 5180 | — |
| Meeting Notetaker (Gravity Notes) | Next.js + TW4 | 3005 | — |
| Brane | Vite + TW4 | — | brane (terminal) |

---

*Generated from leonardo tokens. Source of truth: `leonardo/tokens/*.json`*
*Push changes: `node leonardo/build.js --push`*
