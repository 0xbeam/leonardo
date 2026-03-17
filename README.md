# 🎨 Gravity

**One design system to rule them all.** Centralized tokens for color, typography, spacing, and motion — built to push into every app from a single source of truth.

![Node.js](https://img.shields.io/badge/node.js-%3E%3D16-brightgreen) ![CSS Custom Properties](https://img.shields.io/badge/output-CSS%20Custom%20Properties-blue) ![Tailwind 4](https://img.shields.io/badge/tailwind-v4%20ready-orange)

## Quick Start

```bash
git clone <repo-url> && cd gravity-core
node build.js          # Build dist/ from tokens
node build.js --push   # Build + inject into all connected apps
node build.js --diff   # Dry run — see what would change
```

Zero dependencies. Just Node.

## What's Inside

```
tokens/
  color.json        — Forest green accent (#2A7A5B), warm neutrals, semantic palette
  typography.json   — Cormorant Garamond (display), DM Sans (body), DM Mono (labels)
  spacing.json      — Consistent spatial scale
  motion.json       — Easing curves & duration tokens
extensions/         — App-specific overrides
dist/               — Built CSS (gravity.css, gravity-tw4.css)
```

## Usage

```bash
# Build locally
node build.js

# Push to all apps defined in apps.json
node build.js --push

# Preview changes without writing
node build.js --diff
```

The build reads `tokens/*.json`, compiles CSS custom properties, and (with `--push`) injects the output between `/* GRAVITY-START */` / `/* GRAVITY-END */` markers in each target app.

## Design Philosophy

**Editorial minimal.** Quiet confidence. Information-dense without feeling crowded.

- **Palette:** Warm neutrals + a single forest green accent (`#2A7A5B`)
- **Type:** Serif headlines (Cormorant Garamond), sans body (DM Sans), mono labels (DM Mono)
- **Decoration:** None. No gradients, no illustrations, no blobs. Texture comes from typographic contrast and a subtle noise overlay.
- **Mood:** Calm, precise, trustworthy — like reading a well-typeset journal.
- **References:** Linear (density), Notion (editorial calm), Stripe (typographic precision).
