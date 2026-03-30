<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repo Snapshot

- Stack: Next.js 16.2.1, React 19.2.4, Tailwind 4, Supabase SSR/Auth/Realtime.
- App Router lives in `src/app`.
- The current repo exposes four active surfaces: public site, admin backoffice, volunteer scoring, and live/overlay views.
- The public site is now auth-aware and also exposes lightweight account/registration routes.
  Desktop footer is intentionally legal/community-focused instead of duplicating the main nav,
  and now points to internal legal pages instead of external links.
  Desktop navbar also keeps public navigation visible while grouping internal
  role shortcuts inside a compact account menu.
- Protected `admin` and `voluntario` surfaces now also expose dedicated mobile
  navigation overlays so internal users can keep moving through the app on
  small screens.
- Product direction now adds two clearer operating layers on top of that base:
  athlete/public consumption and head-judge validation of official results.
- Current repo is still single-event, but it now also includes a first `people`
  registry layer intended to survive across yearly editions of the same competition.
- Public UI copy is in Spanish and the visual system is dark-first with green/cyan brand accents from `src/app/globals.css`.

## Route Groups

- `(public)`: event site, account hub, and public registration routes.
- `(admin)`: protected admin routes under `/admin`.
- `(volunteer)`: protected volunteer routes under `/voluntario`.
- `(live)`: live heat screen and overlay routes.

## Project Conventions

- Follow the current Next 16 route signature style already used here:
  `params: Promise<{ ... }>`
- Keep data fetching in Server Components whenever possible.
- Use Client Components only for interaction, browser APIs, or realtime subscriptions.
- Keep mutations in `src/lib/actions/*.ts` and preserve existing `revalidatePath` behavior unless caching strategy is intentionally being redesigned.
- Supabase helpers live in:
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/middleware.ts`
  - `src/lib/supabase/admin.ts`
  - `src/proxy.ts`

## Auth And Access

- `src/proxy.ts` now refreshes Supabase sessions and protects `/admin`, `/voluntario`, and `/auth/setup`.
- `/auth/callback` now needs to support both invite and recovery email flows,
  and `/auth/reset-password` is the public password recovery surface.
- Write access is enforced primarily through Supabase RLS in `supabase/migrations/002_rls_policies.sql`.
- The leaderboard comes from SQL objects in `supabase/migrations/003_functions.sql`.
- Current implementation now supports:
  `superadmin`, `admin`, `volunteer`, `athlete`.
- Score validation capability is modeled as `profiles.can_validate_scores`.
- Volunteer judges are tracked through `profiles.is_judge` and the unified
  volunteer registration flow, not through a separate global role.
- Internal invited users must complete `/auth/setup` before entering protected surfaces.
- `supabase/migrations/011_harden_auth_user_bootstrap.sql` hardens the
  `auth.users -> profiles` bootstrap so new auth users can still create/reuse
  canonical `people` links with sparse metadata, and app invite flows now
  preflight profile/person collisions before calling Supabase Auth.
- Public visitors can now submit pending volunteer/team registrations without creating auth accounts.
- The codebase now also distinguishes:
  - persistent `people` records
  - auth-enabled `profiles`
  - athletic participation records in `athletes`
- Admin can already convert public submissions into real people/entities from:
  `/admin/voluntarios`, `/admin/equipos`, and `/admin/personas`
- Target access model for the product should evolve to:
  - `superadmin`: full platform control, user creation, role changes, global configuration.
  - `admin`: competition operations, data editing, WOD/heats visibility, scoring config, no role management.
  - `volunteer`: mobile-first live data entry only.
  - `athlete`: read-only consumption/profile access.
  - `head_judge`: preferred as an explicit capability on admin-like users
    such as `can_validate_scores`, not necessarily a separate global role.
- Keep `profiles.role` as the source of truth and centralize permission helpers in code,
  similar to ShiftSwap's `user-roles` pattern, instead of scattering string checks.
- Official leaderboard data should depend on validated/published scores, never directly on provisional live updates.
- Volunteer and athlete registration flows now belong to target scope:
  volunteer logistics, team registration, invitations, consent capture, and retention-aware personal data handling.

## Feature Coverage

- Implemented and usable:
  public pages, live heat page, overlay page, volunteer scoring flow,
  admin CRUD for event core entities, score finalization/publication,
  superadmin user management, invite/setup onboarding,
  validator dashboard, live-entry gating per heat, streaming URL config,
  auth-aware public shell, `/cuenta`, pending public registration capture/review,
  people registry foundation, admin conversion flows, people-level admin review/invite tools,
  athlete CRUD, workout-stage CRUD, volunteer-assignment UI, athlete invites after team conversion,
  a filterable volunteer dashboard, an editorial photo layer on the public heroes,
  first continuity/history support through `event_editions` and `edition_participations`,
  public stream-session surfaces in `/directo`,
  gallery upload/consumption through `/admin/media`, `/galeria`, and `/galeria/[id]`,
  and unified volunteer/judge registration with judge labeling/filtering in internal UI.
- Partial or missing:
  richer sponsor slot handling, public use of all event branding fields,
  deeper gallery commerce/album workflow, and configurable scoring/legal/WodBuster layers.
- Also missing but now product-critical:
  richer multi-edition management on top of the continuity layer,
  athlete profile/history beyond the current first account timeline, privacy/consent/retention layer,
  and explicit WodBuster bridge links while the external system is still in use.

## Verification Snapshot

Reviewed on `2026-03-30`.

- `npm run build`: passes
- `npm run typecheck`: passes
- `npm run lint:src`: passes

## Files To Keep In Sync

If you change routes, schema, auth behavior, operating assumptions, or delivery status, update the relevant context docs in the same task:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `MEMORY.md`
- `ROADMAP.md`
- `docs/guia_personal_gijon_throwdown.md`
- `docs/guia_tecnica_gijon_throwdown.md`
- `docs/guia_perfiles_gijon_throwdown.md`
- `docs/guias_operativas/*.md`
- `docs/chuleta_personal_gijon_throwdown.md`

## Safety Notes

- Do not edit generated output in `.next/**`.
- Do not treat files inside `.claude/worktrees/**` as part of the main app unless the task explicitly targets those worktrees.
- Check `git status` before editing shared auth/layout/navigation files; this repo often has local WIP there.
