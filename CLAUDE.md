# Agenda Global Market — Field Service Management

Next.js 14 (App Router) · TypeScript · Tailwind 3.4 · Framer Motion · lucide-react. Data: Convex (tables `records` and `meta`, functions in `convex/`), reached only from server route handlers behind `/api/db`; falls back to `data/db.json` when `CONVEX_URL`/`APP_SECRET` are unset.

## UI work
- Follow `docs/ui-spec.md` for all public-site UI work. Tokens: `docs/design-system.md`. Audit and open decisions: `docs/ui-audit.md`.
- Work **one phase at a time** (spec section 15). After each phase: run the app, screenshot at 390 px and 1440 px, review against the spec, fix gaps, then report and wait for approval.
- These project rules override the global frontend defaults where they differ:
  - Color: the existing navy `#101F42` / yellow `#FFC105` palette only. No new hues or gradients. Yellow is a fill with navy text, never text or a thin line on white.
  - Fonts must be self-hosted (the dev server cannot reliably download Google Fonts).
  - Never invent business facts (counts, ratings, guarantees, payment methods, hours). Compute from data or leave out.
- Product rules: customers contact the **single admin number** (call or WhatsApp). Individual pro phone numbers are never shown publicly. Customers have no accounts; there are no online payments.
- Public pages must not receive private data (worker or customer phones, work orders, payments).

## Security model (Phase 0.5)
- The public site is rendered from `src/server/public.ts` only (a field-by-field whitelist). Never spread a provider object into a public payload.
- `/admin/*`, `/api/db` and `/api/db/stream` need the admin session (signed cookie). Checked in `src/middleware.ts`, the admin layout and every route handler. One admin account; credentials live in `.env.local` (`npm run admin:create`).
- The only public APIs are `GET/POST /api/rate/[id]` and `GET /api/public/stream`, both rate-limited and validated.
- `npm run test:privacy` (server must be running) fails if any public page, script, API or stream contains private data or a phone number other than the admin line. Run it after any change to public pages or APIs.
- Run the site with `npm run dev:keepalive` (auto-restarts on failure). Demo data is seeded only in development or with `SEED_DEMO=1`.

## Backend (Convex)
- The browser never talks to Convex. `src/server/db.ts` calls it with `APP_SECRET`, which every private Convex function checks. Set `APP_SECRET` in the Convex dashboard and in Vercel, plus `CONVEX_URL` in Vercel. `CONVEX_DEPLOY_KEY` is for the CLI only: never commit it or add it to Vercel.
- Deploy functions with `npx convex dev --once` (dev) or `npx convex deploy` (production deployment, then re-set `APP_SECRET` there).
- Worker photos live in Convex file storage and are served through `/api/photo/[id]`.
- `ADMIN_AUTH=open` temporarily disables sign-in (see `src/server/auth.ts`); remove it to enforce login.
