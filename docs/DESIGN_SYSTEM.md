# Track My Application v2 — Design System

> Direction: **Terracotta Daylight** — warm cream canvas, deep navy ink, terracotta accent with sage / sun / violet support. Optimistic, confident, graphic.

---

## 1. Typography

**Display + body:** `"Mona Sans", "Inter", -apple-system, sans-serif`
**Mono (data, kbd, timestamps, kickers):** `"JetBrains Mono", ui-monospace, monospace`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mona+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type scale

| Role         | Size  | Weight | Letter-spacing | Line-height | Use                          |
| ------------ | ----- | ------ | -------------- | ----------- | ---------------------------- |
| Hero (H1)    | 44px  | 800    | -0.035em       | 1.05        | Today greeting               |
| Section (H2) | 36px  | 800    | -0.035em       | 1.05        | Tab page titles              |
| Drawer (H3)  | 26px  | 800    | -0.025em       | 1.10        | Job / contact detail header  |
| Card title   | 16–18 | 700    | -0.015em       | 1.20        | Card headings                |
| Body         | 13–14 | 400–500| normal         | 1.55        | Paragraphs                   |
| Small        | 12px  | 500    | normal         | 1.40        | Meta lines                   |
| Kicker       | 10px  | 600    | 0.14em UPPER   | 1.20        | Section labels (mono)        |
| Pill / badge | 11px  | 600    | normal         | 1.20        | Status pills                 |
| Mono data    | 10–12 | 500–600| 0.06–0.08em    | 1.20        | Timestamps, IDs, kbd         |

---

## 2. Color tokens

```css
:root {
  /* Surfaces */
  --bg:        #FBF5EC;  /* page cream */
  --bg-warm:   #F6EEDB;
  --card:      #FFFFFF;
  --soft:      #F3E9D7;  /* warm chip bg */
  --softer:    #FAF4E8;  /* row hover, subtle fill */
  --line:      #E8DFC9;  /* primary border */
  --line-soft: #F0E8D5;  /* internal divider */

  /* Ink */
  --ink:       #1B2540;  /* deep navy — primary text */
  --ink-2:     #4E5775;
  --ink-3:     #8A93AE;
  --ink-4:     #B8BECF;

  /* Terracotta — primary brand */
  --accent:        #C85A3A;
  --accent-dark:   #A8442A;
  --accent-soft:   #F7D9CD;
  --accent-tint:   #FCEEE7;

  /* Sage — success / calm */
  --sage:          #6B8F7A;
  --sage-soft:     #DDE8DF;
  --sage-tint:     #EFF5F0;

  /* Sun — attention without alarm */
  --sun:           #D9A441;
  --sun-soft:      #F5E6C4;
  --sun-tint:      #FAF1D8;

  /* Violet — technical / informational */
  --violet:        #7C6CB0;
  --violet-soft:   #E0DAF0;
  --violet-tint:   #EFEAF7;

  /* Rose — overdue / error */
  --rose:          #B5394A;
  --rose-soft:     #F3D5DA;
}
```

---

## 3. Status → color mapping

**Application stage**

| Stage          | fg              | bg              |
| -------------- | --------------- | --------------- |
| `applied`      | ink-2           | soft            |
| `phone_screen` | accent-dark     | accent-soft     |
| `technical`    | violet          | violet-soft     |
| `final`        | sage            | sage-soft       |
| `offer`        | sage            | sage-soft       |
| `rejected`     | rose            | rose-soft       |

**Contact status**

| Status              | fg          | bg          |
| ------------------- | ----------- | ----------- |
| `applied_msg`       | sage        | sage-soft   |
| `replied`           | sage        | sage-soft   |
| `double_down`       | accent      | accent-soft |
| `followup_due`      | #A36410     | sun-soft    |
| `followup_overdue`  | rose        | rose-soft   |
| `not_contacted`     | ink-3       | soft        |

**Priority:** high → accent / accent-soft · med → #A36410 / sun-soft · low → ink-3 / soft

---

## 4. Spacing & shape

- **Radii:** `8 / 12 / 16 / 20` px (sm / md / lg / xl)
- **Card padding:** 16–22 px
- **Page padding:** 28 px (max-width 1280)
- **Section gap:** 18 px between cards, 22–28 px before section headers
- **Grid gap (stat strip):** 14 px

**Shadows**

```css
--shadow-sm: 0 1px 2px rgba(27,37,64,.04), 0 4px 16px rgba(27,37,64,.04);
--shadow-md: 0 2px 6px rgba(27,37,64,.06), 0 12px 32px rgba(27,37,64,.08);
--shadow-lg: 0 8px 16px rgba(27,37,64,.10), 0 24px 56px rgba(27,37,64,.16);
```

---

## 5. Components — quick spec

- **Pill** — `padding: 4px 10px; border-radius: 999px; font-weight: 600; font-size: 11px;` optional 6px round dot.
- **Primary button** — terracotta bg, white text, `padding: 10px 16px; border-radius: 8px; box-shadow: 0 1px 0 rgba(168,68,42,.25), inset 0 1px 0 rgba(255,255,255,.15)`.
- **Ghost button** — white bg, 1px `--line` border, ink text, radius 8.
- **Icon button** — 36×36 square, white bg, line border, `--ink-2` stroke.
- **Card** — white bg, 1px `--line` border, radius 16, `--shadow-sm`. Hover lifts `translateY(-2px)` + `--shadow-md`.
- **Drawer** — right-side, 460–540 px wide, slide-in 0.25 s `cubic-bezier(.32,.72,0,1)`, backdrop `rgba(27,37,64,.4)` with 2 px blur.
- **Modal** — centered, max 520 px, radius 20, scale-in 0.22 s. Footer strip uses `--softer` bg.
- **Tab bar** — flat tabs with 2 px terracotta underline on active; ink text active, ink-2 inactive.
- **Brand mark** — 40×40 rounded-square (radius 11), terracotta bg, cream "A" peak stroke, sun-yellow dot at base.

---

## 6. Voice & micro-rules

- Kickers number every section: `01 / Pipeline`, `02 / Outreach`, `03 / Agency`, `04 / Schedule`, `05 / Today`, `06 / Methodology`.
- Mono is reserved for **data**: timestamps, counts, ratios, IDs, keyboard shortcuts. Never for body copy.
- No emoji.
- Empty states are warm and direct — no cuteness, no exclamation marks.
- Numbers are **big and confident** — stat tiles use 42 px / weight 800 / -0.04em tracking.
- Funnel and progress bars use the stage's own color, not a single accent.
- Hover states: rows shift to `--softer`; cards lift 2 px with `--shadow-md`.

---

## 7. Tab structure

1. **Today** (default) — greeting, stat strip, today's interview hero, today's tasks, hot pipeline, funnel, overdue follow-ups, recent contacts
2. **Applications** — searchable / filterable table
3. **Contacts** — card grid with status filter chips
4. **Recruiters** — card grid with placement stats
5. **Interviews** — chronological list with countdown pills
6. **Action Items** — checklist, active + completed split
7. **Playbook** — numbered methodology, 4 phases
