# Research Log

Append-only log of design research sessions across all Gravity apps.

---

## 2026-03-17 — Initial System Extraction

**Context:** Extracted Gravity design system from 4 apps into leonardo canonical source.

**Key observations:**
- All 4 apps share the same editorial-minimal DNA: forest green, warm neutrals, serif/sans/mono trio
- Spacekayak.ops is the most complete implementation (all utilities, all animations)
- Meeting Notetaker added semantic colors (warning, danger) — promoted to core
- Brane has terminal-specific extensions (blink, pulse-subtle) — kept as extension
- Feedback Hub was drifting (missing hairline-l/r, tracking-wide-editorial) — now gets full system

**Decisions:**
- Promoted semantic colors to core (all apps benefit)
- Promoted zinc warm override to core (Meeting Notetaker had it, others didn't)
- Kept Brane terminal animations as extension (not relevant to other apps)
