# UI SPEC — Agenda Global Market

Source of truth for all public-site UI work. Amendments from the owner are already applied
(existing color palette only; AVOID list; trust band surface). Status of each phase and the
open decisions are tracked in `docs/ui-audit.md`; tokens live in `docs/design-system.md`.

**Resolved placeholders:** BRAND_NAME = Agenda Global Market · CITY/COUNTRY = Nairobi, Kenya · CURRENCY = KES.
**Still open (must come from the client, never invented):** LEGAL_ENTITY, REG_NO, ADDRESS, EMAIL for legal,
JURISDICTION (Kenya assumed), payment methods, verification process, guarantee terms, support hours.

# ROLE
Senior product designer and front-end engineer. Marketplace products (Airbnb, Thumbtack, Urban Company,
Linear-style SaaS). Restraint, hierarchy, speed, trust. No template-looking UI.

# CONTEXT
The project exists. Content, data model and product idea are in place. Only raise the UI/UX to a
world-class standard. Do not start from scratch, rename routes, drop features or rewrite copy unless this spec says so.

Product: customers find, compare and book verified service professionals ("Pros") near them: plumbers,
electricians, carpenters, masons, painters. Most traffic is mobile, often mid-range Android on patchy 4G.
Design for that first.

## PHASE 0: AUDIT FIRST (no code changes)
1. Inspect the repo. 2. Write `docs/ui-audit.md`. 3. Write `docs/design-system.md`. 4. Present a phased plan and WAIT for approval.

---

# 1. DESIGN DIRECTION: "Quiet confidence"
Minimal does not mean empty. Every element earns its place.
- Editorial and calm: generous whitespace, hairline borders, almost no shadows, one accent color.
- Content-first: real photos of pros and real numbers carry the page, not illustrations or gradients.
- Trust visible everywhere: verification, ratings, response time, guarantees (only where real).
- One primary action per viewport. If two buttons compete, demote one to a text link.

AVOID: any colors or gradients not in the existing palette, glassmorphism, stock-photo heroes of smiling
handshakes, emoji icons, more than one accent color, centered text blocks wider than 60ch, carousels for core
content, and "Lorem ipsum" or generic filler anywhere.

# 2. DESIGN TOKENS

## Color: USE THE EXISTING BRAND PALETTE (do not invent new colors)
The project already has a color theme. Keep it. Do NOT introduce new hues, gradients or a different accent.
1. Find the current colors and list them in `docs/design-system.md` with their hex values.
2. Map them onto these semantic roles, reusing existing colors for every role:
   --bg, --surface, --surface-muted, --border, --text, --text-muted, --text-subtle,
   --accent (primary brand color: CTAs, links, active states ONLY), --accent-soft (accent at ~8% opacity),
   --success, --warning, --danger, --verified
3. If a role has no existing color, derive it from the current palette (a tint/shade of an existing color).
   Never bring in an unrelated hue. List anything derived so the owner can approve it.
4. Keep the restraint rules: one accent color, mostly neutral surfaces, accent used sparingly so CTAs stand out.
5. Check every text/background pair for WCAG AA (4.5:1 body, 3:1 large text/UI). If an existing pair fails,
   adjust only its lightness and report the change. Do not swap it for a new color.
6. Dark mode: build it from the same palette (darker shades of the existing neutrals, same accent), not new colors.

## Typography
- UI/body: Geist or Inter (variable), 16px base, line-height 1.55
- Display: Instrument Serif (italic), ONLY for 1–3 accent words in H1s (pending owner decision)
- Fluid scale with clamp(): Display 44→72 / H1 36→56 / H2 28→40 / H3 20→24 / Body 16 / Small 14 / Micro 12
- Headings: letter-spacing -0.02em, weight 600. Max line length 60–70ch for text.

## Space, shape, elevation
- 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section rhythm 96px desktop / 64px mobile
- Radius: 8 (inputs, chips), 14 (cards), 999 (pills, avatars)
- Elevation none by default. Hover: `0 1px 2px rgb(0 0 0 / .04), 0 8px 24px rgb(0 0 0 / .06)`
- Container max 1240px, gutters 20px mobile / 32px desktop
- Icons: one set only, 1.5px stroke, 20px default

## Motion
- 150ms micro / 240ms UI / 400ms page. Easing cubic-bezier(.2,.8,.2,1)
- View Transitions API so a worker card photo morphs into the detail page hero (progressive enhancement)
- Skeletons instead of spinners. Respect `prefers-reduced-motion`.

---

# 3. ATTENTION-SPAN RULES
1. 5-second test: know WHAT this is, WHERE it works, WHAT TO DO next.
2. First useful result (real pros near the user) visible within one scroll on mobile.
3. Progressive disclosure: 3 most decision-relevant facts visible, the rest behind "More".
4. Scannable copy: headlines ≤ 8 words, sub-copy ≤ 20 words, bullets over paragraphs.
5. Perceived speed: skeletons within 100ms, optimistic filter UI, no layout shift.
6. Every section ends with a clear next step.

# 4. SITEMAP
/ · /services · /services/[category] · /services/[category]/[area] · /pros/[slug] · /how-it-works ·
/trust-and-safety · /become-a-pro · /about · /contact · /help ·
/legal/terms · /legal/privacy · /legal/cookies · /legal/pro-agreement · /legal/cancellation-refunds ·
/legal/acceptable-use · /accessibility

# 5. GLOBAL HEADER (sticky, 64px, blurs bg on scroll)
Desktop: brand · Services ▾ · How it works · For Pros · location chip · Log in · primary CTA.
Mobile: brand · location chip · menu.
- The location chip is ALWAYS visible and tappable; it opens the Location Sheet.
- "Services ▾" opens a mega-menu: categories in 3 columns with icons plus a "Most booked this week" column.
- After the hero search scrolls out of view, a compact search bar slides into the header.

# 6. HOME PAGE
6.1 Hero (≤ 85vh): live micro-badge with the REAL pro count; H1 with a serif-italic accent; one-line sub-copy;
    search row [What do you need? | location | Find pros]; Popular trades; trust line (real figures only).
    Desktop right: 3 real worker cards slowly cycling. Search autocompletes services AND pros, with recent searches.
    Headline updates once location is known ("Trusted pros in Kilimani.").
6.2 Category rail: horizontal scroll tiles (icon, label, count). Snap on mobile, grid on desktop. Selected tile has
    accent outline and accent-soft fill. Filters in place and updates the URL.
6.3 "Pros near you": 8 worker cards sorted by distance, plus "See all N pros near X →". If location unknown:
    "Top-rated in Nairobi" with an inline soft-ask.
6.4 How it works: 3 numbered steps, ≤ 12 words each.
6.5 Trust band on the darkest neutral from the existing palette: verification, guarantee, payments, support hours.
    Numbers, not adjectives. (Only real facts.)
6.6 Social proof: 3 review cards (name, area, service, rating, 2-line quote). No auto-rotating carousel.
6.7 Become a Pro band: split layout, 3 benefits, [Apply as a Pro].
6.8 FAQ: 6 questions, accordion, FAQPage schema.
6.9 Final CTA: repeat the search with one line of copy.

# 7. WORKER CARD (get this perfect)
Photo 4:3 (lazy, blur-up) with availability pill bottom-left; name 16/600 with verified icon; trade · area;
rating (count) · distance (ONLY when location is granted); response time; divider; price line with arrow.
- The whole card is ONE link; the favorite button stops propagation.
- Hover (desktop): lift 2px, hover shadow, image zoom 1.03 over 400ms. Focus: 2px outline, 2px offset.
- Badges max 1 ("Top Pro" OR "New"). Grid: 1 col <640, 2 ≥640, 3 ≥1024, 4 ≥1280, gap 24px.
- Skeleton with identical dimensions (zero CLS). Variants: default, compact (horizontal rails), selected.
- Fields the data does not have are omitted, never invented.

# 8. WORKER DETAIL PAGE (/pros/[slug])
Desktop: gallery (hero + work samples, lightbox, hero photo morphs from the card), identity block (name, verified,
trade, area, distance, rating, jobs, experience), anchors About · Services · Reviews · Area, services and pricing
table, credentials, reviews with breakdown bars, service area map with radius (never an exact address),
sticky booking panel on the right.
Below the fold (required): Similar pros near you (compact rail), Customers also booked (complementary trades),
Recently viewed (localStorage, hidden if empty).
Mobile: one column, swipeable gallery with counter, sticky bottom bar [price · rating] [primary action].
Breadcrumbs with BreadcrumbList schema; Person/LocalBusiness + AggregateRating schema; Web Share with copy-link fallback.
Product rule: the booking action contacts the admin line (call or WhatsApp with the pro reference). Pros' own numbers are never shown.

# 9. BROWSE & FILTERING
Desktop: filter sidebar (distance, rating, price, availability, verified only, sub-services, languages) and a results
column with count, sort, grid/map toggle, active filter chips with "Clear all".
Mobile: sticky bar [Filters (n)] [Sort] [Map]; filters in a 90vh bottom sheet with sticky [Clear] [Show N pros]; live count.
Rules: ALL filter state in the URL query string (never raw lat/lng; use area slug or keep coordinates in memory);
debounce 250ms and keep previous results at reduced opacity while loading; sorts: Nearest (default when location is
granted), Top rated (default otherwise), Lowest price, Most booked, Fastest response; map view with price pins and card
highlight; empty state never a dead end ("No electricians within 5 km." + [Expand to 15 km] + [Notify me when one joins]);
infinite scroll with a "Load more" fallback and screen-reader page announcements.

# 10. LOCATION: PERMISSION-HEAVY, BUT RESPECTFUL
Never call `navigator.geolocation` on page load. Always soft-ask first (triggered by the location chip, the search
"Use my location" action, or first scroll into results). The soft-ask explains the purpose, offers [Use my current
location], and ALWAYS offers an area search fallback.
State machine (`useLocation`): unknown → prompting (spinner "Locating…", 8s timeout to manual) → granted | denied |
unavailable | manual.
- denied: do not nag; chip "Choose area"; manual picker; small help link "How to enable location".
- unavailable: same as denied plus an approximate default city.
- Check `navigator.permissions.query({name:'geolocation'})` first to skip the soft-ask if already granted.
- Round stored coordinates to ~3 decimals (~100 m). Persist area + coarse coordinates in localStorage with a 7-day expiry.
  Expose "Clear my location".
- Location Sheet: current location, recent areas, area search, radius selector.
- Distance labels "<1 km", "2.3 km", "12 km". Show "Serves your area ✓" when inside the pro's service radius.

# 11. FOOTER
Brand + short description + newsletter (only if a service exists); link columns Services / Company / Support / For Pros;
popular areas as SEO links to /services/[category]/[area]; legal row (entity, registration, Terms · Privacy · Cookies ·
Pro Agreement · Accessibility); language and payment methods only if real. Muted surface, 14px text, 40px column gap.
Mobile: columns collapse to accordions; legal links stay visible.
Cookie consent: a bottom-left card (not a full-width bar) with Accept all / Reject non-essential / Preferences, equal
visual weight, no dark patterns. Shown only if non-essential cookies or analytics exist.

# 12. LEGAL PAGES: REAL CONTENT, NOT TEMPLATES
Complete, specific, plain-English content for THIS marketplace model (the platform connects customers with independent
pros). Use LEGAL_ENTITY, ADDRESS, EMAIL, JURISDICTION. A source-only banner: "DRAFT — requires review by qualified
counsel before launch."
Layout: sticky table of contents with scroll-spy; title, last-updated, reading time, [Print]; per-section "In short"
summary; numbered clauses (2.1, 2.2 …); max width 720px, 17px body; change log at the bottom.
Coverage: Terms of Service; Privacy Policy (Kenya Data Protection Act 2019 / ODPC; precise vs approximate location,
sharing with pros, processors, retention, transfers, security, rights, children, cookies, DPO contact, regulator
complaints); Cookie Policy (table of actual cookies); Pro Agreement; Cancellation & Refunds; Acceptable Use; Trust &
Safety; Accessibility statement.

# 13. MARKETING & CONVERSION LAYER
SEO landing pages /services/[category]/[area] (unique H1, live pro count, average price, top 6 pros, local FAQs, nearby
areas, statically generated and revalidated); schema.org (Organization, WebSite+SearchAction, Service, LocalBusiness/Person,
AggregateRating, FAQPage, BreadcrumbList); dynamic OG images; verbs on buttons ("Find pros", never "Submit"); trust line
next to every primary CTA (only true statements); analytics events: search_submitted, category_selected, filter_changed,
location_permission_{shown,granted,denied}, pro_card_clicked, pro_viewed, booking_started, booking_requested,
pro_apply_clicked.

# 14. QUALITY BARS (non-negotiable)
- WCAG 2.2 AA, full keyboard navigation, visible focus, semantic landmarks, aria-live result counts, 44×44px touch
  targets, labels on every input.
- Mobile, throttled 4G: LCP < 2.5s, CLS < 0.05, INP < 200ms, home JS < 170KB gzipped; AVIF/WebP with responsive srcset,
  preload hero font, font-display: swap.
- Responsive check at 360, 390, 768, 1024, 1280, 1440px. No horizontal scroll except intentional rails.

# 15. EXECUTION ORDER (one phase at a time; show after each)
1 Tokens + docs + base components (Button, Input, Chip, Badge, Card, Sheet, Skeleton) · 2 Header, footer, cookie banner ·
3 Worker card + grid + skeletons · 4 Location system · 5 Browse + filters + empty states + map toggle ·
6 Worker detail + suggestions + mobile sticky bar + view transition · 7 Home sections · 8 Legal pages + template ·
9 SEO landing pages, schema, OG images · 10 A11y + performance pass.
After each phase: run the app, take screenshots at 390px and 1440px, review critically against this spec, fix gaps, then
report with the screenshots and a short list of what changed.

# DEFINITION OF DONE
A first-time visitor on a phone can, in under 30 seconds and without instructions: understand the service → share or set
their location → filter to a category → open a pro → see similar pros → start a booking. The site looks like a funded,
trusted brand, not a template.
