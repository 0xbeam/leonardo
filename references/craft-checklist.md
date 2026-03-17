# Craft Checklist

## Spacing

Base unit: 4px or 8px. Everything multiplies from this.

```
4px system:  4, 8, 12, 16, 24, 32, 48, 64, 96, 128
8px system:  8, 16, 24, 32, 48, 64, 96, 128, 192
```

Rules:
- Proximity = relationship. Closer = connected, farther = separate.
- Consistent gaps between similar elements. Larger gap = new section.
- Internal padding < external margin (card padding < gap between cards).
- Section spacing: 64–128px desktop, 48–80px mobile.
- Component internal padding: 12–24px depending on density.

## Motion

Motion serves exactly three purposes: **feedback** (it worked), **continuity** (where it went), **hierarchy** (look here). If an animation doesn't serve one of these — remove it.

### Timing

```
Instant (90–150ms):      hover, press, toggle, checkbox
State change (160–240ms): accordion, tab switch, tooltip
Large transition (240–360ms): modal open, drawer slide, page transition
```

Never exceed 500ms in product UI. Anything longer feels sluggish.

### Easing

```
Enter (element appearing):    ease-out    (fast start, gentle land)
Exit (element leaving):       ease-in     (gentle start, fast exit)
State change (in-place):      ease-in-out (smooth both ends)
```

Never use `linear` for UI motion — it feels robotic.

### Micro-interactions

```css
/* Button press */
transform: scale(0.98); transition: 90ms ease-out;

/* Hover background */
background-color: var(--hover); transition: 120ms ease;

/* Focus ring */
outline: 2px solid var(--focus); outline-offset: 2px; transition: 150ms ease;
```

### Accessibility

Always support `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Icons

Icons are punctuation, not illustration.

- One style per project: outline OR solid. Never mix.
- Size: match text's visual weight. Icon height ≈ text line-height or smaller.
- Color: use `currentColor` to inherit from parent text.
- Hit area: 44×44px minimum for touch targets.
- Action icons need `aria-label`. Decorative icons get `aria-hidden="true"`.

Recommended libraries: Lucide (SaaS default), Heroicons (Tailwind ecosystem), Phosphor (flexible weights).

## Anti-AI-Slop Rules

These are the tells of LLM-generated design. Avoid all of them.

### Color

- **No default indigo/violet** (#6366f1) unless the brand specifically calls for it. Every LLM defaults to it. It's the biggest tell.
- No safe blue gradients everywhere.
- No random accent colors with no brand connection.

### Layout

- Don't default to Hero → Features Grid → Pricing → FAQ → CTA. Ask: "What can I add, remove, or reorder for THIS product?"
- No perfect symmetry without visual tension.
- No blob/wave SVG backgrounds (meaningless decoration).

### Content

- No stock illustrations that could belong to any product.
- No generic headlines ("Supercharge your workflow", "Built for teams").
- No lorem ipsum left in delivered work.
- No feature grids where every card has the same structure with different icons.

### Interaction

- No hover effects on elements that aren't interactive.
- No animations that don't serve feedback, continuity, or hierarchy.
- No skeleton loaders on content that loads instantly.

### What professional design looks like

- Brand-appropriate color chosen from research, not defaults.
- Intentional font pairing that matches the product's tone.
- Visual tension and asymmetry where it serves hierarchy.
- Purposeful whitespace (not just "add more padding").
- At least one element from the Steal List implemented.
- Social proof present (or a justified reason for its absence).
- Copy that sounds like a human wrote it for this specific product.

## Quality Gates

### Before shipping, validate against all four:

**Functional**
- Primary action is visually obvious within 3 seconds
- All error states are designed (not just happy path)
- Works at 320px, 768px, and 1200px+
- Tab order is logical; focus states are visible
- Forms have proper labels, validation, and error messages

**Visual**
- Squint test: hierarchy reads correctly when blurred
- Spacing rhythm is consistent (no random gaps)
- Typography is intentional (no default browser styles leaking)
- Colors meet contrast requirements
- No orphaned words in headlines or CTAs

**Persuasion**
- Hook lands in first 3 seconds (above the fold)
- At least 2 trust signals present (logos, testimonials, stats, guarantees)
- Primary objection is addressed before the main CTA
- Microcopy has personality (not generic placeholder text)

**Polish**
- Icons are optically aligned (not just center-aligned)
- Buttons are consistent (size, padding, radius, weight)
- Loading and empty states are designed
- Transitions feel smooth, not jarring
- At least one memorable detail exists (the "screenshot moment")
