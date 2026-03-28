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
- Treat the current single-event schema as transitional too:
  the target product keeps one active edition in the UI, but should support
  persistent people data and participation history across editions.
