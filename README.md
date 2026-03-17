# 🎨 leonardo — universal design system

> Taste-driven, agentic-first design tokens. One source of truth for color, typography, spacing, and motion — pushed into every app with a single command.

![CSS Custom Properties](https://img.shields.io/badge/output-CSS%20Custom%20Properties-blue) ![Node.js](https://img.shields.io/badge/node.js-%3E%3D16-brightgreen) ![Tailwind 4](https://img.shields.io/badge/tailwind-v4%20ready-orange) ![Zero Deps](https://img.shields.io/badge/deps-0-lightgrey)

## Features

| Feature | Description |
|---------|-------------|
| **Single source of truth** | All tokens live in `tokens/*.json`, compiled to CSS custom properties |
| **Multi-app push** | `--push` injects tokens between `GRAVITY-START` / `GRAVITY-END` markers in every connected app |
| **Dry-run diffs** | `--diff` previews exactly what would change before writing |
| **Tailwind v4 output** | Generates both `gravity.css` and `gravity-tw4.css` |
| **App-specific extensions** | Override tokens per-app via `extensions/` |
| **Zero dependencies** | Just Node.js — no build tools, no bundler |

## Quick Start

```bash
node build.js           # build dist/ from tokens
node build.js --push    # build + inject into all connected apps
node build.js --diff    # dry run — see what would change
```

## Token Overview

| Token | File | Details |
|-------|------|---------|
| **Color** | `tokens/color.json` | Forest green accent `#2A7A5B`, warm neutrals, semantic palette |
| **Typography** | `tokens/typography.json` | Cormorant Garamond (display), DM Sans (body), DM Mono (labels) |
| **Spacing** | `tokens/spacing.json` | Consistent spatial scale |
| **Motion** | `tokens/motion.json` | Easing curves & duration tokens |

## Connected Apps

| App | Framework | CSS Target |
|-----|-----------|------------|
| Fermi Ops | Vite + TW4 | `src/index.css` |
| Feedback Hub | Vite + TW4 | `src/index.css` |
| Brane | Vite + TW4 | `src/index.css` |
| Gravity Notes | Next.js + TW4 | `src/app/globals.css` |
| MiroFish | Vite + TW4 | `src/index.css` |

Configure targets in `apps.json`.

## Structure

```
tokens/           JSON token definitions
extensions/       app-specific overrides
dist/             compiled CSS (gravity.css, gravity-tw4.css)
apps.json         connected app registry
build.js          compiler + injector
```

## Design Philosophy

**Editorial minimal.** Quiet confidence. Information-dense without feeling crowded.

| Axis | Choice |
|------|--------|
| **Palette** | Warm neutrals + single forest green accent `#2A7A5B` |
| **Type** | Serif headlines (Cormorant Garamond), sans body (DM Sans), mono labels (DM Mono) |
| **Decoration** | None — no gradients, no illustrations, no blobs. Texture from typographic contrast + subtle noise |
| **Mood** | Calm, precise, trustworthy — like a well-typeset journal |
| **References** | Linear (density), Notion (editorial calm), Stripe (typographic precision) |

## Stack

Node.js · CSS Custom Properties · Tailwind v4 · JSON tokens

## License

MIT
