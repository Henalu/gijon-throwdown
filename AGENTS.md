<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repo Snapshot

- Stack: Next.js 16.2.1, React 19.2.4, Tailwind 4, Supabase SSR/Auth/Realtime.
- App Router lives in `src/app`.
- The current repo exposes four active surfaces: public site, admin backoffice, volunteer scoring, and live/overlay views.
- Product direction now adds two clearer operating layers on top of that base:
  athlete/public consumption and head-judge validation of official results.
- Current repo is still single-event, but target product direction now requires
  a persistent people registry that can survive across yearly editions of the same competition.
- Public UI copy is in Spanish and the visual system is dark-first with green/cyan brand accents from `src/app/globals.css`.

## Route Groups

- `(public)`: event site and information pages.
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

## Auth And Access

- `src/middleware.ts` refreshes Supabase sessions and protects `/admin` and `/voluntario`.
- Next 16 deprecates `middleware` in favor of `proxy.ts`. Treat that migration as known technical debt.
- Write access is enforced primarily through Supabase RLS in `supabase/migrations/002_rls_policies.sql`.
- The leaderboard comes from SQL objects in `supabase/migrations/003_functions.sql`.
- Current implementation is still a simplified binary role model:
  `profiles.role` only supports `admin` and `volunteer`.
- Current schema also conflates auth/profile with the broader concept of a person linked to the event.
- Target domain should distinguish:
  - persistent person records reusable across editions
  - auth-enabled user accounts
  - edition-specific participations and roles
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
  public pages, live heat page, overlay page, volunteer scoring flow, admin CRUD for event core entities, score finalization/publication, streaming URL config.
- Partial or missing:
  athlete management, workout stage management, volunteer assignment UI, richer sponsor slot handling, public use of all event branding fields, media/stream session features.
- Not implemented yet but now part of the target operating model:
  superadmin user management, role editing UI, validator/head-judge dashboard, scoring rules configuration, and a clean live-to-official validation pipeline.
- Also missing but now product-critical:
  reusable people registry, volunteer application flow, team-based athlete registration,
  invitation emails, athlete profile/history, privacy/consent/retention layer,
  and explicit WodBuster bridge links while the external system is still in use.

## Verification Snapshot

Reviewed on `2026-03-28`.

- `npm run build`: passes
- `npx tsc --noEmit`: passes
- `npx eslint src`: fails with 2 source errors and 8 warnings
- `npm run lint`: noisy because ESLint also scans `.claude/worktrees/**`

Known source lint errors:

- `src/components/home/countdown-timer.tsx`
- `src/app/(volunteer)/voluntario/heat/[heatId]/scoring-interface.tsx`

Both are `react-hooks/set-state-in-effect`.

## Files To Keep In Sync

If you change routes, schema, auth behavior, operating assumptions, or delivery status, update the relevant context docs in the same task:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `MEMORY.md`
- `ROADMAP.md`
- `docs/guia_personal_gijon_throwdown.md`
- `docs/chuleta_personal_gijon_throwdown.md`

## Safety Notes

- Do not edit generated output in `.next/**`.
- Do not treat files inside `.claude/worktrees/**` as part of the main app unless the task explicitly targets those worktrees.
- Check `git status` before editing shared public layout/navigation files; this repo often has local WIP there.
