# Memory

Last updated: 2026-03-28

## Product Intent

- Gijon Throwdown started as a single-event competition hub, not a generic multi-event platform.
- Core promise: one shared source of truth for public info, live scoring, admin operations, and streaming support.
- Main language is Spanish.
- The product must be mobile-first from the start, especially for public consumption and volunteer live operations.
- The operating model is intentionally split into three layers:
  management/configuration, live competition operations, and public/athlete consumption.
- New product direction adds a reusable people/participant layer:
  the UI can still focus on one active edition, but people and participation history should survive across editions.

## Architecture Snapshot

- Framework: Next.js 16.2.1 with App Router in `src/app`
- Rendering model: Server Components by default, Client Components for interaction/realtime
- Styling: Tailwind CSS 4 + tokens in `src/app/globals.css`
- Data/auth/realtime: Supabase via `@supabase/ssr` and `@supabase/supabase-js`
- Notifications: Sonner toaster in root layout
- Human-readable owner docs live in:
  `docs/guia_personal_gijon_throwdown.md` and
  `docs/chuleta_personal_gijon_throwdown.md`

## Route Inventory

- Public:
  `/`, `/wods`, `/wods/[slug]`, `/categorias/[slug]`, `/horarios`, `/clasificacion`, `/directo`, `/patrocinadores`, `/faq`
- Admin:
  `/admin`, `/admin/evento`, `/admin/categorias`, `/admin/equipos`, `/admin/wods`, `/admin/heats`, `/admin/puntuaciones`, `/admin/patrocinadores`, `/admin/voluntarios`, `/admin/streaming`
- Volunteer:
  `/voluntario`, `/voluntario/heat/[heatId]`
- Live:
  `/live/[heatId]`, `/overlay/[heatId]`
- Auth:
  `/auth/login`, `/auth/callback`

## Domain Model

Primary schema objects:

- `profiles`: current auth profile table; today it only stores a binary `admin` / `volunteer` role model
- `event_config`: single event settings, branding, dates, FAQ, stream URL
- `categories`, `teams`, `athletes`
- `workouts`, `workout_stages`
- `heats`, `lanes`
- `live_updates`: append-only realtime scoring stream
- `scores`: finalized results
- `sponsors`, `sponsor_slots`
- `volunteer_assignments`
- `stream_sessions`, `media`

Important SQL-side behavior:

- RLS policies live in `supabase/migrations/002_rls_policies.sql`
- `leaderboard` is a SQL view from `supabase/migrations/003_functions.sql`
- realtime is enabled for `live_updates` and `heats`

## Target People Registry Direction

Recommended target, not implemented yet:

- keep one active event edition in the main UI
- but introduce a persistent people layer reusable across yearly editions
- do not overload `profiles` with every future person/logistics/legal concern

Recommended conceptual split:

- `people`: canonical person record reused over time
- `profiles` or auth accounts: login/session/system role, optionally linked to `people`
- `event_editions`: yearly edition metadata
- `edition_participants` / `edition_roles`: who did what in a given edition
- `team_registrations` and `team_memberships`: team creation and roster management
- `volunteer_applications`: volunteer-specific logistics and application state
- `consent_records` / retention metadata: privacy and legal traceability

Important functional targets:

- volunteer registration should collect name, surname, email, shirt size,
  dietary restrictions, and consent/legal acknowledgements
- athlete registration should be team-led and collect 4 athletes per team,
  with current competition constraint `3 men + 1 woman`
- athlete accounts should later expose current team, current results,
  ranking, and participation history across editions
- invitation or confirmation emails are part of the desired workflow,
  even if initially implemented as lightweight links/placeholders
- WodBuster remains an external dependency for now and should be surfaced through clear links inside the platform

## Target Access Model

Recommended target, not implemented yet:

- `profiles.role` should evolve to `superadmin | admin | volunteer | athlete`
- `head_judge` fits better as an explicit capability on admin-like users
  such as `can_validate_scores`, not necessarily as a separate global role
- `superadmin` should be the only profile able to create users, change roles,
  and manage global/system-level permissions
- `admin` should own event operations, scoring configuration, team/athlete editing,
  heat visibility, and score correction without owning role management
- `volunteer` should be limited to mobile-first live data entry surfaces
- `athlete` should remain read-only and public-consumption oriented

Recommended permission architecture:

- keep `profiles.role` as the source of truth
- centralize checks in a permission helper module instead of ad hoc string comparisons
- mirror those rules in Supabase RLS helper functions
- keep a strict separation between provisional live data and validated official results

Recommended result lifecycle:

- volunteer submits or updates provisional live data
- admin controls which WODs/heats are operationally active
- head judge or validating admin reviews official sheet data
- validated result is then published and only then feeds the official leaderboard

## Current App Behavior

- Public home page loads event config, visible workouts, categories, and sponsors.
- WOD detail page reads `workout_stages`.
- Leaderboard page reads directly from SQL view `leaderboard`.
- Volunteer UI sends live updates through server actions and listens with Supabase realtime.
- Admin panel can create/update/delete most event entities and finalize/publish/calculate scores.
- Streaming is currently just a YouTube URL stored on `event_config`.
- Volunteer home currently revolves around assigned heats plus any active heats; it does not yet implement the full mobile-first filtering flow requested for real event operations.
- Public and athlete consumption still share the same unauthenticated surface; no dedicated athlete account experience exists yet.

## Quality Snapshot

Verified on 2026-03-28:

- `npm run build`: OK
- `npx tsc --noEmit`: OK
- `npx eslint src`: OK
- `npm run lint`: should no longer be polluted by `.claude/worktrees/**`

## Known Gaps

- No admin CRUD for athletes.
- No admin CRUD for workout stages.
- No admin UI to assign volunteers to heats/lanes even though `volunteer_assignments` exists.
- `stream_sessions` and `media` exist in DB but are not wired into app flows.
- `sponsor_slots` exists in schema, but public rendering barely uses placement data.
- Event form updates core fields, but not the full event payload stored in schema.
- Public sponsor pages currently render names/tier emphasis more than actual logos.
- `public/` still contains only default Next starter assets.
- Auth/permissions are still in a first-pass state:
  only `admin` and `volunteer` exist in schema, middleware, and UI assumptions.
- There is no superadmin-only user/role management flow.
- There is no explicit validator/head-judge dashboard to compare provisional live data against official results.
- The scoring model exposes `verified_by` and `is_published`, but the business workflow between live capture, official review, and leaderboard consolidation is still underdefined in code.
- There is no configurable scoring-rules module for points tables, tie-breakers, or workout-specific ranking rules.
- WOD activation and volunteer input restrictions need to become more explicit so many simultaneous volunteers can operate safely.
- There is no persistent person registry distinct from auth `profiles`.
- There is no edition/history model; schema is still single-event.
- Volunteer registration does not exist.
- Team-led athlete registration does not exist.
- `athletes` lacks email, gender, shirt size, consent, invitation state, and reusable identity fields.
- There is no athlete account/profile experience with ranking/history continuity.
- There are no invitation/confirmation email flows.
- Legal/data-protection work is absent from the app:
  no privacy policy surface, no consent capture, no retention policy implementation.
- There is no visible WodBuster bridge in the current UI.

## Codebase Quirks

- `src/middleware.ts` works, but Next 16 marks middleware as deprecated in favor of `proxy.ts`.
- `eslint.config.mjs` ignores `.next/**` but not `.claude/worktrees/**`, so full-project lint is noisy.
- `src/app/(admin)/admin/patrocinadores/sponsors-client.tsx` appears to be an older duplicate and is not imported by the current page.
- Most admin writes rely on Supabase RLS instead of explicit manual role checks inside every action.
- `src/lib/supabase/middleware.ts` still hardcodes `profile.role === "admin"` for `/admin`,
  so the future access model should be introduced behind centralized helpers, not by duplicating more string checks.

## Current Worktree Note

As of 2026-03-28, `git status` shows local uncommitted UI work in public pages/navigation and volunteer scoring related files.
Check the working tree before changing shared layout or public route files.
