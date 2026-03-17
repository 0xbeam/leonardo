# Color

## Palette structure

Four layers, each with a role:

```
Neutrals (70–90%):    backgrounds, borders, text hierarchy
Primary accent (5–10%): brand color, CTAs, key interactive elements
Semantic (3–5%):      success (green), warning (amber), danger (red), info (blue)
Effects (rare):       gradients, glows, overlays — used sparingly for emphasis
```

## Neutrals

Build a 10–12 step scale from near-white to near-black:

```
50:  #fafafa   (lightest background)
100: #f5f5f5   (card background, subtle fill)
200: #e5e5e5   (borders, dividers)
300: #d4d4d4   (disabled states, placeholder)
400: #a3a3a3   (muted text, icons)
500: #737373   (secondary text)
600: #525252   (body text — light theme)
700: #404040   (strong text)
800: #262626   (headings)
900: #171717   (primary text, near-black)
950: #0a0a0a   (darkest — rare)
```

Create breathing room with spacing, not faded text. Avoid using opacity as a lazy hierarchy tool.

## Primary color

One brand color with a full scale (50–950):

```
50–200:  tinted backgrounds, hover fills, badges
300–400: borders, secondary buttons
500–600: default interactive state (buttons, links)
700:     hover state
800:     active/pressed state
900–950: rare — text on light tint backgrounds
```

## Semantic colors

Each semantic color needs at least 3 values:

```
Success:  background (#ecfdf5), foreground (#059669), border (#a7f3d0)
Warning:  background (#fffbeb), foreground (#d97706), border (#fde68a)
Danger:   background (#fef2f2), foreground (#dc2626), border (#fecaca)
Info:     background (#eff6ff), foreground (#2563eb), border (#bfdbfe)
```

## Contrast requirements

```
Body text (≤16px):     4.5:1 minimum against background
Large text (>18px bold or >24px): 3:1 minimum
Interactive elements:  3:1 minimum against adjacent colors
Focus indicators:      3:1 minimum
```

Test with: WebAIM contrast checker, Chrome DevTools accessibility audit.

## Dark theme

Not an inversion. Separate neutral scale.

```
Background:     #0f0f0f or #111111 (not #000000 — pure black is harsh)
Surface:        #1a1a1a (cards, elevated elements)
Surface raised: #262626 (modals, dropdowns)
Border:         #333333 (subtle) / #444444 (prominent)
Text primary:   #f0f0f0 (not #ffffff — pure white causes glare)
Text secondary: #a0a0a0
Text muted:     #666666
```

Key rules:
- Reduce primary color saturation ~10–15% for dark backgrounds
- Increase spacing slightly to compensate for reduced contrast cues
- Semantic colors need adjusted tints (darker backgrounds, lighter foregrounds)
- Test on actual dark screens — monitors vary significantly

## Design tokens

Name by purpose, not color:

```css
/* Do this */
--color-primary: #2563eb;
--color-text-primary: #171717;
--color-bg-surface: #ffffff;
--color-border-default: #e5e5e5;

/* Not this */
--blue: #2563eb;
--dark-gray: #171717;
--white: #ffffff;
--light-gray: #e5e5e5;
```

Purpose-named tokens allow theme switching without renaming variables.
