# UI audit — Agenda Global Market (Phase 0)

Status: **audit only. No application code was changed in this phase.**
Date: 23 Nov 2026. Measurements come from a headless Chrome (390 and 1440 wide) and a script
(`contrast.mjs`) run against the real tokens in `src/app/globals.css`.

## 1. Current stack

| Area | What is there |
|---|---|
| Framework | Next.js 14.2.15, App Router, React 18, TypeScript 5 |
| Styling | Tailwind 3.4 with semantic CSS variables (`hsl(var(--x))`), no component library |
| Components | Hand-written primitives in `src/components/ui` (Button, Badge, Card, Field/Input/Textarea, custom Select, Modal, Reveal, Stars) |
| Motion | Framer-motion 11 (Reveal, hero entrance, drawers) |
| Icons | lucide-react 0.400 (single set) |
| Fonts | Inter via `next/font/google`. Google Fonts downloads are unreliable in this environment (see problem 13). |
| State and data | One JSON document (`data/db.json`) held in memory by a Node server (`src/server/db.ts`), exposed at `GET/PUT /api/db`, pushed to every page through Server-Sent Events (`/api/db/stream`). Client store in `src/lib/store.tsx`, seeded from `src/lib/seed.ts`. |
| Auth | Stub only (`src/lib/auth.ts`). Not enforced anywhere. |
| Hosting assumption | One long-running Node process. Will not work on serverless without moving data to a database (BaaS planned). |
| Tests / analytics | None. |

## 2. Page inventory

Public: `/` (single long page: banner, header, hero + trade picker, professionals grid, how it works, footer),
`/terms`, `/privacy`, `/rate/[id]` (customer rating link), `/login` (stub), `not-found`.

Admin (`/admin/*`, noindex): dashboard, work orders (list, new, detail), schedule, team, customers, settings, invoice print view.

Missing from the target sitemap: `/services`, `/services/[category]`, `/services/[category]/[area]`,
`/pros/[slug]`, `/how-it-works`, `/trust-and-safety`, `/become-a-pro`, `/about`, `/contact`, `/help`,
`/legal/*` (cookies, pro agreement, cancellation and refunds, acceptable use), `/accessibility`.

## 3. Component inventory

UI primitives: Button, Badge, Card, Input, Textarea, Field, Select (custom combobox), Modal, Reveal, Stars.
Layout: AdminShell (sidebar plus phone bottom bar), LegalPage (sticky table of contents).
Admin: WorkerDrawer, WorkerForm, GlobalSearch. Work order: Stepper, TasksCard, LinesCard, PaymentsCard, AppointmentCard, ActivityCard.

Not present, needed by the spec: Chip, Sheet (bottom sheet), Skeleton, Tabs, Accordion, Tooltip, Toast, WorkerCard
(public card is inline in `page.tsx`), LocationSheet, FilterBar, Breadcrumbs, Gallery/Lightbox, Map, CookieBanner, Header/Footer as components.

## 4. Where the spec and the product disagree (decisions needed, see end of file)

1. **Booking model.** The spec describes online booking, price, "pay after the job", escrow and "Message {pro}".
   The product is: customers call or WhatsApp **one admin number**; pros' numbers are never shown; the admin creates the work order.
   There are no customer accounts, no online payments and no pro messaging.
2. **Facts that do not exist yet** and must not be invented: verification steps, guarantee terms, payment methods,
   support hours, legal entity / registration number / address, completed-job counts, review text, app-store links, newsletter provider.
3. **Data the cards and detail page need that the model lacks:** photo, work samples, "from" price, response time,
   "available today", languages, service radius, slug, certifications documents.
4. **Serif accent words.** The spec asks for an italic serif on 1–3 words per H1. A serif look was tried and rejected earlier in this project.

## 5. Top 15 UX problems, ranked by impact

1. **The public site receives the entire business database.** `/api/db` and the live stream send every record to every visitor
   and bot, including worker phone numbers, customer names, phones and addresses, work orders and payments. This blocks any public growth, SEO or sharing. Must be fixed before pro pages go public.
2. **Public pages render demo data on the server.** The home page is a client component fed by the store, so server HTML contains the hard-coded seed professionals; real data replaces them after JavaScript runs. Search engines, link previews and slow phones see wrong content, and the swap can shift layout.
3. **No pro detail page or shareable URL.** A professional exists only as a card. The target journey (open a pro, see similar pros, start a booking) cannot happen.
4. **Browse state is not in the URL.** Trade selection is component state: no back-button support, no deep links, no category or area pages, no SEO landing pages.
5. **Location flow breaks the spec.** The browser permission prompt fires on page load with no soft-ask; there is no manual area picker or search, no header location chip, no remembered choice, no "how to enable" help when denied.
6. **The data model cannot support decision-relevant facts** (see section 4, item 3), so cards show only name, trade, experience, rating, distance and qualifications.
7. **Trust has no backing content.** No guarantee, verification, payment or support information exists to put in a trust band or FAQ, and only one rating exists in the system.
8. **One page does everything.** No services, how-it-works, trust, become-a-pro, about, contact or help pages; the footer is a single block with no popular-area links.
9. **Legal coverage is incomplete.** Only Terms and Privacy exist (under `/terms`, `/privacy`). Missing: Cookies, Pro Agreement, Cancellation and Refunds, Acceptable Use, Accessibility. No "In short" summaries, no scroll-spy, no draft-for-counsel marker.
10. **Weak form-control contrast.** Hairline border `#DCDFE5` on white is 1.34:1 (WCAG 1.4.11 needs 3:1 for control boundaries). Input focus is only a 40%-opacity border change. Affects admin inputs and the custom Select.
11. **Accessibility semantics.** Filter "tabs" use `role="tab"` with no arrow-key behaviour or tab panels; no skip link; no live region announcing result counts; star ratings expose no text alternative in the `Stars` component.
12. **Motion ignores `prefers-reduced-motion`.** Reveal, hero entrance and `scrollIntoView({behavior:"smooth"})` always animate.
13. **Image quality and loading.** Trade photos are about 220 px wide crops from a flyer and are shown up to about 260 px wide, so they look soft on 2–3x phones. No blur-up placeholders. Fonts depend on a Google Fonts download that fails when the dev server has no outbound network (observed: the display font silently fell back to sans-serif), so fonts should be self-hosted.
14. **Performance and measurement are unknown.** Framer-motion, an always-open EventSource and the full dataset all load on the public page. No bundle budget, no Core Web Vitals measurement, no analytics events.
15. **Token inconsistency.** Three overlapping palettes (`:root` for the admin, `.site` for the public site, `.dark` with an inverted primary), dark mode never exercised, and no type or spacing scale tokens.

Outside this spec but noted: `/admin` has no enforced login (stub), and the JSON file store is single-node only.

## 6. Measured baseline

- No horizontal overflow, no overlapping text, no text under 13 px at 320, 360, 390, 600, 768, 1024, 1440 px on `/`.
- Text pairs: foreground on white 17.87:1, muted text on white 6.52:1, white on navy 16.20:1, navy on yellow 9.93:1 (all pass).
- Fails: yellow as text on white 1.63:1; success `#25935F` as text 3.88:1; warning `#DB7706` as text 3.16:1; hairline border 1.34:1; yellow as a non-text graphic (rating stars) on white 1.63:1.
- Bundle size, LCP, CLS and INP: **not yet measured** (planned for Phase 10).

## 7. Proposed phases

Follows the spec's order. Every phase ends with screenshots at 390 and 1440 and a short change list before I continue.

| # | Phase | Notes and dependencies |
|---|---|---|
| 0 | Audit and design-system docs | This document and `design-system.md` |
| 0.5 | **Data-safety gate (recommended)** | Split a public read model (name, trade, area, rating, qualifications, no phones) from the admin data; render public pages on the server from it. Required before phases 6 and 9. |
| 1 | Tokens, base components | Chip, Sheet, Skeleton, Tabs, Accordion; self-host fonts; focus ring and control-border fixes |
| 2 | Header, footer, cookie banner | Location chip; banner shown only if non-essential cookies or analytics are added |
| 3 | WorkerCard, grid, skeletons | Fields we do not have render as absent, never as invented values |
| 4 | Location system | `useLocation` state machine, soft-ask, area picker, Location Sheet |
| 5 | Browse and filters | URL-synced filters, empty states; map toggle needs a map library and per-pro service radius |
| 6 | Pro detail page | CTA is Call / WhatsApp the admin line with the pro reference; similar pros; mobile sticky bar |
| 7 | Home sections | Only truthful figures, computed from real records |
| 8 | Legal pages and template | Full drafts marked "requires counsel review" |
| 9 | SEO landing pages, schema, OG images | Needs phase 0.5 |
| 10 | Accessibility and performance pass | Playwright screenshots, axe checks, bundle and Web Vitals measurements |

## 8. Decisions needed before Phase 1

1. Booking model on the detail page: map "Request booking / Message pro" to "Call / WhatsApp us about {pro}" (admin line, pro reference prefilled)? No online payment copy.
2. Provide, or confirm "leave out": verification process, guarantee terms, payment methods, support hours, legal entity, registration number, address, contact email, jurisdiction (Kenya assumed).
3. Approve adding admin fields: photo, gallery, from-price, response time, languages, availability, service radius, slug (photos need file storage, which comes with the BaaS).
4. Instrument Serif italic accents: use, or stay sans-serif only?
5. Accent mapping (see `design-system.md`): yellow as the single accent for fills, navy for text, links and active states.
6. Keep `/terms` and `/privacy` and add the new pages under `/legal/*` with redirects?
7. Approve the data-safety gate (phase 0.5) as a prerequisite.
8. Confirm scope for map view, analytics provider and newsletter (each needs a service choice).
