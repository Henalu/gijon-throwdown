Read these files first, in this order:

1. `AGENTS.md`
2. `MEMORY.md`
3. `ROADMAP.md`
4. `README.md`
5. `docs/chuleta_personal_gijon_throwdown.md`
6. `docs/guia_personal_gijon_throwdown.md`

Working rules:

- Keep context docs in sync when routes, schema, auth, env vars, or delivery status change.
- Do not edit `.next/**` or `.claude/worktrees/**` unless the task explicitly asks for it.
- Prefer `npx eslint src` over `npm run lint` when you need signal from the main source tree.
- Treat the current `admin` / `volunteer` role model as transitional.
  The agreed product target is `superadmin`, `admin`, `volunteer`, `athlete`
  plus a validation capability for head-judge flows.
- Volunteer judge intent now rides inside the same volunteer registration flow
  and persists as `profiles.is_judge`; do not introduce a separate global `judge` role casually.
- Treat the current single-event schema as transitional too:
  the target product keeps one active edition in the UI, but should support
  persistent people data and participation history across editions.
- That continuity foundation now exists in the repo through:
  `event_editions`, `event_config.active_edition_id`,
  `teams.edition_id`, `athletes.edition_id`, and `edition_participations`.
- Public shell is now auth-aware:
  `/cuenta`, `/registro/voluntarios`, and `/registro/equipos` already exist,
  and those public registrations now can be reviewed and converted from admin,
  but they still do not auto-create public accounts on submission.
  On desktop, internal role shortcuts now live inside a compact account menu
  instead of stretching the top bar with too many links.
- Internal mobile UX is no longer a dead end:
  `admin` and `voluntario` now have their own mobile header + overlay menu.
- Desktop footer is no longer a duplicate navigation area:
  it now prioritizes internal legal pages and community/social access.
- The people registry foundation already exists:
  `people`, `profiles.person_id`, `athletes.person_id`, `/admin/personas`,
  and admin-side conversion of volunteer/team submissions.
- Athlete account continuity has already started:
  `/cuenta` now reads edition-aware context/history and athlete setup routes
  should feel athlete-facing, not only internal/staff-facing.
- Phase 5 already closed the operational gap around:
  athlete CRUD, workout-stage CRUD, volunteer assignments, and admin-triggered athlete invites.
- Streaming and gallery now also have real product surface:
  `/admin/streaming`, `/admin/media`, `/galeria`, `/galeria/[id]`,
  and signed media downloads through `/api/media/[id]/download`.
