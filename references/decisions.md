# Design Decisions

ADR-style records of design system decisions.

---

## DEC-001: Token format — JSON source + CSS output

**Date:** 2026-03-17
**Decision:** Store tokens as JSON, compile to CSS via build.js
**Rationale:** JSON is machine-readable (taste layer can programmatically read/modify), diffable in PRs, and framework-agnostic. CSS output has zero runtime overhead.
**Alternatives considered:** CSS-only (harder to parse programmatically), YAML (less tooling support), Style Dictionary (over-engineered for 4 apps)

## DEC-002: App injection via CSS markers

**Date:** 2026-03-17
**Decision:** Use `/* GRAVITY-START */` / `/* GRAVITY-END */` markers in app CSS
**Rationale:** Apps keep app-specific CSS outside the markers. gravity-core owns only the fenced section. This preserves flexibility while ensuring single source of truth.
**Alternatives considered:** Full file replacement (too aggressive), npm package import (too much ceremony for sibling dirs)

## DEC-003: Brane as extension, not fork

**Date:** 2026-03-17
**Decision:** Brane's terminal animations (blink, pulse-subtle) are an extension, not part of core
**Rationale:** Terminal cursor blink and log line pulse are specific to Brane's terminal UI. Other apps don't need them. Extensions keep core clean while allowing per-app customization.

## DEC-004: Superset token strategy

**Date:** 2026-03-17
**Decision:** All apps get the full token superset (including semantic colors, zinc overrides)
**Rationale:** Unused tokens have zero cost in CSS custom properties. Having them available prevents apps from hardcoding values when they eventually need them.
