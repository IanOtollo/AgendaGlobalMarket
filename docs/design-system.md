# Design system — Agenda Global Market

Status: **proposal for approval (Phase 0).** Nothing here is implemented yet.
Rule for color: reuse the existing palette only. Anything derived is listed in section 3 for approval.

## 1. Existing palette (source: `src/app/globals.css`)

Public site (`.site`) values; the admin `:root` values differ slightly (noted in section 5).

| Token | HSL | Hex | Role today |
|---|---|---|---|
| `--background` / `--card` | 0 0% 100% | `#FFFFFF` | page, cards |
| `--foreground` | 222 47% 11% | `#0F1729` | body text |
| `--primary` | 222 62% 16% | `#101F42` | navy: header banner, footer, buttons |
| `--primary-foreground` | 0 0% 98% | `#FAFAFA` | text on navy |
| `--brand` | 45 100% 51% | `#FFC105` | yellow: CTA fills, marks |
| `--muted` | 220 16% 96% | `#F3F4F6` | tinted sections, chips |
| `--muted-foreground` | 220 10% 38% | `#575E6B` | secondary text |
| `--border` | 220 14% 88% | `#DCDFE5` | hairlines |
| `--success` | 152 60% 36% | `#25935F` | status |
| `--warning` | 32 95% 44% | `#DB7706` | status |
| `--info` | 217 80% 52% | `#236EE7` | status (mapped to verified) |
| `--destructive` | 0 72% 51% | `#DC2828` | errors |

## 2. Semantic roles mapped to existing colors

| Spec role | Mapped to | Value |
|---|---|---|
| `--bg` | derived tint of navy (see section 3) or plain white | `#FAFBFC` / `#FFFFFF` |
| `--surface` | `--card` | `#FFFFFF` |
| `--surface-muted` | `--muted` | `#F3F4F6` |
| `--border` | `--border` (decorative hairlines only) | `#DCDFE5` |
| `--border-strong` | derived (form controls, 3:1) | `#788191` |
| `--text` | `--foreground` | `#0F1729` |
| `--text-muted` | `--muted-foreground` | `#575E6B` |
| `--text-subtle` | derived; decorative or large text only | `#788191` |
| `--accent` | `--brand` yellow, **fills only** (CTA buttons, selected markers) | `#FFC105` |
| `--on-accent` | `--primary` navy | `#101F42` |
| `--accent-soft` | yellow at 8% on the surface | rgba(255,193,5,.08) |
| `--ink` (links, active text, icons) | `--primary` navy | `#101F42` |
| `--success` | existing, lightness-adjusted for text | `#218355` |
| `--warning` | existing, lightness-adjusted for text | `#B36205` |
| `--danger` | existing (passes) | `#DC2828` |
| `--verified` | existing `--info` (passes) | `#236EE7` |

One accent: **yellow**. Navy is the ink and dark surface color, not a second accent. Yellow is never used as text or as a thin line on white.

## 3. Derived values and adjustments (need your approval)

| Item | Value | How derived |
|---|---|---|
| `--bg` | `#FAFBFC` | `--primary` hue (222), saturation 25%, lightness 98.5%. Optional; plain white is also acceptable. |
| `--text-subtle`, `--border-strong` | `#788191` (3.93:1 on white) | `--muted-foreground` hue 220, lightness raised to 52%. Used for control borders (needs 3:1). Not allowed for body text (needs 4.5:1). |
| `--success` text | `#25935F` to `#218355` | lightness 36% to 32%, hue and saturation unchanged |
| `--warning` text | `#DB7706` to `#B36205` | lightness 44% to 36%, hue and saturation unchanged |
| Trust band surface | `#0F1729` | the darkest existing neutral (`--foreground`) |
| Dark `--bg` | `#090E1A` | `--foreground` hue 222, lightness 11% to 7% |
| Dark `--surface` | `#0F1729` | existing `--foreground` |
| Dark `--text` | `#FAFAFA` | existing `--primary-foreground` |
| Dark `--text-muted` | `#A5ABB6` | `--muted-foreground`, lightness 38% to 68% |

## 4. Contrast results (WCAG 2.2 AA)

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on white | 17.87:1 | 4.5 | pass |
| text-muted on white / on surface-muted | 6.52 / 5.93 | 4.5 | pass |
| white on navy | 16.20 | 4.5 | pass |
| navy on yellow (CTA) | 9.93 | 4.5 | pass |
| yellow on navy | 9.93 | 4.5 | pass |
| danger text on white | 4.80 | 4.5 | pass |
| verified text on white | 4.71 | 4.5 | pass |
| **yellow as text or line on white** | 1.63 | 4.5 / 3 | **fail: never use** |
| success `#25935F` as text | 3.88 | 4.5 | fail, adjust to `#218355` |
| warning `#DB7706` as text | 3.16 | 4.5 | fail, adjust to `#B36205` |
| hairline `#DCDFE5` as control border | 1.34 | 3 | fail, use `--border-strong` for inputs; hairline stays decorative |
| yellow rating star on white (graphic) | 1.63 | 3 | fail, stars become navy fill with the number beside them |
| dark text on dark bg | 18.47 | 4.5 | pass |
| dark muted on dark surface | 7.89 | 4.5 | pass |
| yellow on dark bg | 11.83 | 4.5 | pass |

## 5. Dark mode

Same variable names, values from section 3. Yellow stays the accent (fill, navy text). Replaces today's `.dark` block, which inverts `--primary` to yellow. The admin keeps its palette until it is migrated onto the same roles (admin `:root` currently uses `--foreground 240 10% 3.9%` and `--muted-foreground 240 3.8% 46.1%`).

## 6. Typography

- UI and body: Inter (variable), 16 px base, line-height 1.55, self-hosted so builds do not depend on a font download.
- Display accent (**pending decision 4**): Instrument Serif italic, only for 1 to 3 words inside H1s. If declined, accents use Inter italic.
- Fluid scale: Display `clamp(2.75rem, 1.9rem + 3.6vw, 4.5rem)` · H1 `clamp(2.25rem, 1.7rem + 2.4vw, 3.5rem)` · H2 `clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)` · H3 `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` · Body 16 · Small 14 · Micro 12.
- Headings: weight 600, letter-spacing -0.02em. Text measure 60 to 70 ch.
- Micro (12 px) is limited to uppercase labels and legal metadata; anything a customer must read is at least 14 px.

## 7. Space, shape, elevation, layout

- Spacing (4 px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section rhythm 96 desktop / 64 mobile.
- Radius: 8 (inputs, chips), 14 (cards), 999 (pills, avatars). Current `--radius` is 0.5rem (8 px); a `--radius-card: 14px` token is added.
- Elevation: none by default; hover only: `0 1px 2px rgb(0 0 0 / .04), 0 8px 24px rgb(0 0 0 / .06)`.
- Container: max 1240 px, gutters 20 px mobile / 32 px desktop.
- Icons: lucide-react, 1.5 px stroke, 20 px default.
- Focus: 2 px outline in `--ink` navy with 2 px offset on every interactive element (replaces the weak border-only focus).

## 8. Motion

Durations 150 ms (micro), 240 ms (UI), 400 ms (page); easing `cubic-bezier(.2,.8,.2,1)`. Skeletons instead of spinners. Everything respects `prefers-reduced-motion` (including smooth scrolling and Framer entrances). View Transitions for card-to-detail, as progressive enhancement (not all browsers support it).

## 9. Implementation notes

- Tokens live as CSS variables on `:root` with a `.dark` override; Tailwind reads them through `hsl(var(--token) / <alpha-value>)` so opacity utilities keep working.
- The `.site` scoping hack is removed once the admin uses the same roles.
- Status colors for text use the adjusted `--success-text` and `--warning-text`; the original values remain for fills and icons.
