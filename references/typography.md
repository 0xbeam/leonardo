# Typography

## Scale

Use a modular ratio (1.2 or 1.25). Define 6–8 sizes max:

```
Display:  48–64px   (hero headlines)
H1:       36–48px   (page titles)
H2:       24–32px   (section titles)
H3:       20–24px   (subsections)
Body:     16–18px   (paragraphs)
Small:    13–14px   (captions, metadata)
Caption:  11–12px   (labels, fine print)
```

## Line-height

Larger text = tighter leading. Body = looser.

```
Display (48px+):   1.0–1.15
Headings (24–48px): 1.15–1.3
Body (16–18px):    1.5–1.6
Small (11–14px):   1.4–1.5
```

## Letter-spacing (do not skip)

```
Body (14–18px):        0         (default is fine)
Small text (11–13px):  +0.01–0.02em  (required — improves readability)
UI labels / buttons:   +0.02em       (required)
ALL CAPS text:         +0.06–0.1em   (always required — looks cramped without it)
Headings (32px+):      -0.01 to -0.02em  (tighten for optical balance)
Display (48px+):       -0.02 to -0.03em  (tighten more)
```

Common mistakes:
- ALL CAPS without tracking → cramped, amateur
- Small text without positive tracking → hard to read
- Display text without negative tracking → loose, disconnected

## Font pairing

Max 2 fonts per project. Common pairings:

```
Geometric sans + humanist sans  (Inter + Source Sans)
Grotesque + mono               (Helvetica Neue + JetBrains Mono)
Serif heading + sans body      (Playfair + Inter)
One family, multiple weights   (Inter 400/500/600/700)
```

Use weight contrast (not size alone) to create hierarchy within a single family.

## Line length

Optimal: 50–75 characters per line. Enforce with `max-width: 65ch` on text containers.

## Responsive type

Scale down for mobile — don't just let things wrap:

```
Display:  48–64px desktop → 32–40px mobile
H1:       36–48px desktop → 28–32px mobile
H2:       24–32px desktop → 20–24px mobile
Body:     16–18px both (never below 16px on mobile)
```

Use `clamp()` for fluid scaling:
```css
font-size: clamp(2rem, 5vw, 4rem);
```

## Weight usage

```
400 (Regular):   body text, secondary content
500 (Medium):    UI labels, nav items, subtle emphasis
600 (Semibold):  subheadings, card titles, interactive elements
700 (Bold):      headlines, primary CTAs, strong emphasis
```

Avoid using more than 3 weights from a single family in one view.
