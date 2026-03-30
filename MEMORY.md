# Memory

Last updated: 2026-03-30

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
  `docs/guia_tecnica_gijon_throwdown.md` and
  `docs/guia_perfiles_gijon_throwdown.md` and
  `docs/guias_operativas/README.md` and
  `docs/chuleta_personal_gijon_throwdown.md`

## Route Inventory

- Public:
  `/`, `/cuenta`, `/registro/voluntarios`, `/registro/equipos`, `/wods`, `/wods/[slug]`, `/categorias/[slug]`, `/horarios`, `/clasificacion`, `/directo`, `/galeria`, `/galeria/[id]`, `/patrocinadores`, `/faq`, `/privacidad`, `/cookies`, `/bases-legales`, `/aviso-legal`
- Admin:
  `/admin`, `/admin/evento`, `/admin/categorias`, `/admin/equipos`, `/admin/wods`, `/admin/heats`, `/admin/puntuaciones`, `/admin/validacion`, `/admin/validacion/[heatId]`, `/admin/usuarios`, `/admin/personas`, `/admin/patrocinadores`, `/admin/voluntarios`, `/admin/streaming`, `/admin/media`
- Volunteer:
  `/voluntario`, `/voluntario/heat/[heatId]`
- Live:
  `/live/[heatId]`, `/overlay/[heatId]`
- Auth:
  `/auth/login`, `/auth/callback`, `/auth/setup`, `/auth/reset-password`

## Domain Model

Primary schema objects:

- `profiles`: auth profile table with `role`, `email`, `is_active`,
  `person_id`, `is_judge`, `can_validate_scores`, `invited_at`, `setup_completed_at`
- `people`: canonical person table reused across auth and athlete identity
- `event_editions`: edition metadata while the UI still focuses on one active edition
- `edition_participations`: continuity layer linking people to a role in a given edition
- `volunteer_applications`: public volunteer requests with logistics data,
  optional judge intent, and review state
- `team_registrations`, `team_registration_members`: public team preinscriptions kept separate from confirmed competition entities
- `event_config`: single event settings, branding, dates, FAQ, stream URL
- `categories`, `teams`, `athletes`
- `workouts`, `workout_stages`
- `heats`, `lanes`
- `heats.is_live_entry_enabled`: operational gate for live entry
- `live_updates`: append-only realtime scoring stream
- `scores`: official result layer with `verified_by`, `verified_at`, `is_published`
- `sponsors`, `sponsor_slots`
- `volunteer_assignments`
- `stream_sessions`, `media`

Important SQL-side behavior:

- RLS policies live in `supabase/migrations/002_rls_policies.sql`
- `leaderboard` is a SQL view from `supabase/migrations/003_functions.sql`
- `supabase/migrations/011_harden_auth_user_bootstrap.sql` hardens
  `auth.users -> profiles` bootstrap and auto-links/creates `people`
- realtime is enabled for `live_updates` and `heats`

## People Registry Direction

Implemented foundation:

- one active event edition in the main UI remains the current product shape
- `people` now exists as canonical person layer reusable beyond a single auth account
- `profiles.person_id` and `athletes.person_id` now link auth and athletic identity back to `people`
- `event_editions` now exists and `event_config.active_edition_id` points to the active one
- `teams.edition_id`, `athletes.edition_id`, and `edition_participations`
  now provide a real continuity base under the current single-edition UI
- admin can already convert:
  `volunteer_applications -> people + profile`
  and `team_registrations -> teams + people + athletes`

Still target direction:

- keep one active event edition in the main UI
- deepen edition history and athlete-facing continuity on top of the new participation layer
- do not overload `profiles` with every future person/logistics/legal concern

Recommended conceptual split:

- `people`: canonical person record reused over time
- `profiles` or auth accounts: login/session/system role, optionally linked to `people`
- `event_editions`: yearly edition metadata
- `edition_participations`: who did what in a given edition
- `team_memberships`: team creation and roster management once preinscriptions convert into real entities
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

Implemented foundation:

- `profiles.role` now supports `superadmin | admin | volunteer | athlete`
- `head_judge` capability is currently modeled as `profiles.can_validate_scores`
- `profiles.is_judge` now marks volunteer/judge specialization while keeping
  `profiles.role` as the global access source of truth
- internal users can be invited by superadmin and complete `/auth/setup`
- invite flows now preflight person/profile collisions before calling Supabase
  Auth, instead of relying on `person_id` metadata during user creation

Still missing on top of that foundation:

- `head_judge` fits better as an explicit capability on admin-like users
  such as `can_validate_scores`, not necessarily as a separate global role
- richer athlete surface, people registry, registration flows, and scoring-rules configuration

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
- Public gallery now exists on `/galeria` and `/galeria/[id]` with signed previews,
  optional signed downloads, and configurable purchase CTA per image.
- Public shell now detects active session and adapts navbar and mobile overlay by role.
- Desktop navbar now keeps the public navigation visible and moves internal
  role-based shortcuts into a compact account dropdown to avoid overcrowding.
- Desktop footer now avoids duplicating the main navigation and instead acts as
  a legal/community area with internal legal pages and social access.
- Public routes `/cuenta`, `/registro/voluntarios`, and `/registro/equipos` now exist.
- Public team registration now treats athlete 1 as the contact responsible,
  keeps the visible gender labels in Spanish (`Chico` / `Chica`),
  and shows the selected category label instead of raw UUID values.
- Public volunteer registration now also captures whether the applicant wants
  to colaborar como juez, and converted/internal profiles surface that as
  `Juez` / `Panel juez` in the shared UI.
- `/cuenta` now shows real team/category/ranking context plus first participation history for linked athlete accounts.
- Public heroes on `/`, `/directo`, and `/wods` now include a local editorial photo layer backed by `next/image`.
- Home now extends that photo-led direction beyond the hero through editorial split sections,
  so photography supports the page rhythm instead of appearing only once at the top.
- Public direct page now prefers a live `stream_sessions` entry before falling
  back to `event_config.stream_url`, and it surfaces recent public sessions as
  replay/archive cards.
- Admin dashboard on `/admin` is now a real operational hub:
  it summarizes event status, live heats, pending validation, pending public
  registrations, streaming/media state, and role-aware quick actions.
- Protected internal surfaces now have their own mobile navigation layer:
  `admin` and `voluntario` expose a mobile header + overlay menu so users can
  move between internal areas and back to the public site without getting stuck.
- WOD detail page reads `workout_stages`.
- Leaderboard page reads directly from SQL view `leaderboard`.
- Volunteer UI now checks heat operability before writing live updates and only exposes assigned/live-enabled heats.
- Volunteer dashboard now adds category/search filtering and can match category, workout, heat label, and team names.
- Admin panel can create/update/delete most event entities, enable/disable live entry per heat,
  manage internal users as superadmin, route official score review through `/admin/validacion`,
  review volunteer/team public submissions, convert them into real people/entities,
  and inspect canonical people records through `/admin/personas`.
- Admin can now also:
  manage `athletes` inside `/admin/equipos`,
  manage `workout_stages` inside `/admin/wods`,
  manage `volunteer_assignments` inside `/admin/voluntarios`,
  trigger athlete invites after team conversion,
  manage public stream sessions in `/admin/streaming`,
  and manage the event gallery in `/admin/media`.
- Internal invited users complete onboarding in `/auth/setup` before entering protected surfaces.
- Login now exposes password recovery, `/auth/callback` accepts `code`,
  `token_hash`, and the default Supabase email-link hash
  `#access_token/#refresh_token`, and `/auth/reset-password` lets users
  request a reset link or set a new password after returning from email.
- When an email link arrives without an explicit next target, the callback can
  now derive the post-login destination from the authenticated profile, so
  invited users with pending setup still land in `/auth/setup`.
- `/auth/setup` and `/auth/reset-password` now hydrate their first auth state
  from the browser client instead of trusting SSR on that first landing, which
  makes invite/recovery flows more resilient right after `/auth/callback`.
- `/auth/setup` now also repairs legacy invited profiles that are missing
  `person_id` by creating or reusing the canonical `people` row first.
- Official flow is now:
  draft from heat -> validator edits -> validator validates heat -> publish -> calculate points.
- Public and athlete consumption now share an auth-aware shell, and athlete accounts can already surface real team/ranking context when linked.
- Athlete invite and setup flow is now more athlete-aware:
  invited athletes land more coherently in `/cuenta`,
  and participation links are kept in sync when profiles are invited or activated.
- Gallery assets now live in a private Supabase bucket (`event-media`) and the
  app serves signed preview/download URLs from the server.

## Quality Snapshot

Verified on 2026-03-30:

- `npm run build`: OK
- `npm run typecheck`: OK
- `npm run lint:src`: OK
- `npm run lint`: should no longer be polluted by `.claude/worktrees/**`

## Known Gaps

- `sponsor_slots` exists in schema, but public rendering barely uses placement data.
- Demo seed and default category data are still modeled as team-of-2,
  while the current product and public registration flow are now team-of-4
  with `1 woman + 3 men`.
- Public team registration currently hardcodes that 4-person rule instead of
  deriving it from category config, so category data can drift away from the form.
- Event form updates core fields, but not the full event payload stored in schema.
- Event admin still does not expose FAQ, cover/logo/media fields,
  active-edition control, or the full location/navigation payload.
- Media purchase is now product-visible through `purchase_url`, but real checkout
  still depends on the external commerce URL/provider chosen by the organization.
- Public sponsor pages currently render names/tier emphasis more than actual logos.
- First superadmin promotion still needs a manual rollout step in production.
- There is no configurable scoring-rules module for points tables, tie-breakers, or workout-specific ranking rules.
- Public registration still starts as pending submission capture, then requires admin conversion.
- The continuity model now exists, but multi-edition management is still not surfaced as a real admin product area.
- Athlete invitation now exists as an admin-triggered follow-up step after team conversion, and setup copy is more athlete-aware, but the athlete-facing lifecycle can still be polished further.
- `athletes` stays intentionally lean; reusable identity and logistics now live in `people`.
- `/cuenta` now exposes first participation history, but it is still not a fully rich athlete profile.
- There are no public-facing invitation/confirmation email flows for athlete registration.
- Legal/data-protection work is still partial:
  public legal pages now exist, but there is still no consent capture flow or
  retention policy implementation inside the product.
- There is no visible WodBuster bridge in the current UI.

## Codebase Quirks

- `src/proxy.ts` now owns route protection; do not reintroduce `middleware.ts`.
- `eslint.config.mjs` already ignores `.claude/worktrees/**`; prefer `npm run lint:src` cuando quieras una pasada rapida y centrada en la app principal.
- `src/app/(admin)/admin/patrocinadores/sponsors-client.tsx` appears to be an older duplicate and is not imported by the current page.
- Most admin writes rely on Supabase RLS instead of explicit manual role checks inside every action.
- Editorial stock sources for the current public heroes are documented in `docs/photo-sources.md`.
- Remote image loading for signed Supabase assets and YouTube thumbnails is now
  whitelisted in `next.config.ts`.
- Auth logic is now centralized around `src/lib/auth/permissions.ts`,
  `src/lib/auth/session.ts`, and `src/lib/auth/live-access.ts`.

## Current Worktree Note

Phase 2 touched shared auth/layout/admin/volunteer files heavily.
Check `git status` before editing routing, auth, or scoring code in parallel with other work.
