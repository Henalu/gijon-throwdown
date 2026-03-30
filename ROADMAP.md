# Roadmap

Last reviewed: 2026-03-29

## Phase 1 Closed

This batch is considered done:

- public shell reworked around a single navigation source
- mobile overlay menu upgraded from simple sheet to real overlay layer
- mobile bottom nav focused on event-following tasks
- home reshaped into event hub instead of hero-first landing
- `directo`, `clasificacion`, `horarios`, and `wods` improved for small-screen scanning
- current source lint errors removed
- ESLint ignores tightened so `.claude/worktrees/**` stops polluting normal lint runs
- owner-facing docs added:
  `docs/guia_personal_gijon_throwdown.md` and
  `docs/chuleta_personal_gijon_throwdown.md`

## Phase 2 Closed

This batch is considered done:

- access model expanded to `superadmin | admin | volunteer | athlete`
- `can_validate_scores` introduced as head-judge capability
- route protection migrated to `src/proxy.ts`
- superadmin user management and internal invite/setup flow added
- dedicated validation module added:
  `/admin/validacion` and `/admin/validacion/[heatId]`
- volunteer live operations hardened with per-heat live-entry gating
- admin heats UI now controls `is_live_entry_enabled`

## Phase 3 Closed

This batch is considered done:

- public shell is now auth-aware and adapts navigation/actions by active role
- public logout is available from the shared shell
- `/cuenta` exists as lightweight account hub for any authenticated user
- `/registro/voluntarios` stores pending volunteer applications
- volunteer registration now also stores optional judge intent without opening
  a separate public registration surface
- `/registro/equipos` stores pending team preinscriptions with 4 athletes
- admin review now includes:
  `Operativos` + `Solicitudes` in `/admin/voluntarios`
  and `Confirmados` + `Preinscripciones` in `/admin/equipos`
- public registration stays intentionally separated from real auth accounts and confirmed competition entities

## Phase 4 Closed

This batch is considered done:

- persistent `people` registry introduced through `007_people_registry_and_conversions.sql`
- `profiles.person_id` and `athletes.person_id` now exist as links to canonical people
- admin conversion flow added:
  `volunteer_applications -> people + profile`
  and `team_registrations -> team + people + athletes`
- new admin surface `/admin/personas` added for person-level review and invite actions
- `/admin/voluntarios` can now convert approved volunteer submissions into real volunteer accounts
- converted/internal volunteer profiles can now persist `is_judge`, and superadmin
  can filter/edit judges clearly from `/admin/usuarios`
- `/admin/equipos` can now convert preinscriptions into confirmed teams and linked athletes
- `/cuenta` now shows real athlete/team/ranking context when the account is linked to a person and athlete record
- account shortcuts now expose the new people-registry surface for admin-like users

## Phase 5 Closed

This batch is considered done:

- `/admin/equipos` now includes athlete admin tooling:
  CRUD for `athletes`, person linking, and explicit athlete invites after team conversion
- `/admin/wods` now includes stage management for `workout_stages`
- `/admin/voluntarios` now includes operational assignment management for `volunteer_assignments`
- `/voluntario` now supports category/search filtering and clearer heat grouping for real event operation
- admin athlete/team operations now lean on the people registry instead of treating athlete rows as isolated records
- phase 5 closes the old "operational depth" gap between schema and real admin UI

## Phase 6 Closed

This batch is considered done:

- public editorial photography introduced in the main public heroes:
  `/`, `/directo`, and `/wods`
- local stock assets now live in `public/images/editorial`
- a reusable image-based hero pattern now exists for premium public storytelling
- image sources are documented in `docs/photo-sources.md`
- the visual tone now mixes editorial motivation with the existing mobile-first event structure

## Phase 7 Closed

This batch is considered done:

- `008_event_editions_and_participations.sql` introduced `event_editions`,
  `edition_participations`, and `event_config.active_edition_id`
- `teams` and `athletes` now carry `edition_id` so the current UI can stay
  single-edition while the data model starts remembering across years
- athlete continuity is now edition-aware:
  duplicate checks only block within the same edition, not forever
- athlete and volunteer invite/conversion flows now sync participation history
  instead of only linking `people` and `profiles`
- `/cuenta` now shows edition-aware athlete context and first participation history
- `/admin/personas` now surfaces basic continuity signals instead of treating
  people as flat one-off rows
- athlete onboarding now lands more coherently in `/cuenta`
- `npm run typecheck` now uses a dedicated `tsconfig.typecheck.json` so source
  checks stay reliable without depending on transient `.next` validator output

## Phase 8 Closed

This batch is considered done:

- `/admin/streaming` now manages both fallback embed URL and real public
  `stream_sessions`
- public `/directo` now consumes live/public stream sessions and surfaces recent
  replay/archive cards
- `/admin/media` now supports gallery upload, visibility, featured state,
  signed download toggles, and configurable purchase links
- public `/galeria` and `/galeria/[id]` now exist as real product surfaces
- media assets now live in a private Supabase bucket and are served with signed
  preview/download URLs from the server
- the public shell and home page now acknowledge the gallery as part of the
  event product, not as hidden admin-only data

## Next Technical Phase

This is the next block an agent can implement inside the repo.

### 1. Scoring Rules, Legal And WodBuster Bridge

- Add configurable scoring rules, points tables, and tie-breakers
- Deepen privacy and consent handling beyond the new legal pages
- Define retention/anonymization implementation points
- Add configurable WodBuster links in the public experience
- Decide how much of the external system remains visible during coexistence

### 2. Event Config And Real Competition Shape

- Update demo seed and category defaults from team-of-2 to team-of-4
- Make registration derive team composition from category/event rules instead of hardcoding it
- Expand `/admin/evento` so FAQ, maps, branding/media URLs, and active edition control are really manageable from UI

### 3. Technical Debt And DX

- Add stronger automated coverage around auth, validation, volunteer write restrictions, and gallery/download flows

## Final Stretch

This is the most practical closing sequence from the current repo state.

### 1. Align Real Event Shape

- Update demo seed and live base data from team-of-2 to team-of-4
- Align category defaults and existing category rows with the real competition format
- Decide whether team composition rules live globally or per category, then make registration reflect that source of truth

### 2. Close Event-Config Surface

- Expand `/admin/evento` so it can manage the fields the public app actually depends on:
  FAQ, `maps_url`, branding/media URLs, and active edition control
- Decide which branding/media fields stay manual and which should move to the new gallery/asset workflow

### 3. Finish Product-Critical Missing Pieces

- Configurable scoring rules, points tables, and tie-breakers
- Privacy, consent, and retention implementation on top of the new public legal surfaces
- Visible WodBuster bridge with configurable external URLs

### 4. Production Rollout And Smoke Pass

- Apply migrations `005` through `010`
- Promote the first real `superadmin`
- Verify invite emails and `NEXT_PUBLIC_SITE_URL`
- Recheck production flows:
  public navigation, login/setup, volunteer dashboard, validation, account hub,
  public registrations, athlete conversion, directo, and galeria/download links

## Needs Your Hand

These are not blocked by code skill. They are blocked by product decisions, content, legal scope, or external assets.

### 1. Brand And Content

- Confirm final branding direction
- Deliver final logo and brand assets
- Deliver final home copy, event description, FAQ, venue text, and directions
- Deliver sponsor logos in usable quality

### 2. Competition Rules

- Confirm scoring logic per event
- Confirm points by position
- Confirm tie-break rules
- Confirm how official validation should work in real operation

### 3. WodBuster Coexistence

- Confirm the real WodBuster URLs that must be linked
- Decide which parts remain external and which must feel native inside this platform

### 4. Legal And Data Decisions

- Approve privacy-policy scope
- Approve consent language
- Confirm retention/caducity rules for volunteer and athlete personal data
- Decide what should persist across editions and what should expire

### 5. Edition Strategy

- Confirm whether the future model is:
  one active edition plus historical participation underneath
- Or a more explicit multi-edition product with stronger edition management in UI

### 6. Tone Review

- Review the human-owner docs and tune tone if you want them more serious or more playful

### 7. Rollout

- Decide which existing account must be promoted manually to the first `superadmin`
- Confirm Supabase email/invite setup and production `NEXT_PUBLIC_SITE_URL`
- Apply migrations `005_phase2_auth_and_validation.sql`, `006_public_registrations.sql`,
  `007_people_registry_and_conversions.sql`, and
  `008_event_editions_and_participations.sql`, and
  `009_streaming_and_media_experience.sql`, and
  `010_judge_profiles.sql` where they are not yet applied

## Later

These items matter, but they are not the best next move right now.

- richer sponsor placement strategy
- stronger test coverage
- more robust loading/error states on operational screens
- wider live/overlay ranking logic for trickier score types
- deeper gallery commerce workflow, albums, and photographer/asset operations
