# Roadmap

Last reviewed: 2026-03-28

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

## Next Technical Phase

This is the next block an agent can implement inside the repo.

### 1. Roles And Permissions

- Replace the current binary `admin` / `volunteer` model with the target access model:
  `superadmin`, `admin`, `volunteer`, `athlete`
- Model `head_judge` as a score-validation capability on admin-like users unless a dedicated role becomes necessary
- Centralize permission helpers in code
- Update route protection, Supabase RLS, and UI visibility to match that model
- Add superadmin-only user and role management

### 2. Official Validation Layer

- Add a dedicated review/validation dashboard for official scores
- Keep volunteer live data provisional
- Let validating admins compare live entries against official sheet values
- Only publish validated results to the official leaderboard
- Clarify the state model between live capture, reviewed result, and published score

### 3. People Registry And Registration

- Introduce a persistent people model reusable across editions
- Design volunteer registration flow with logistics fields
- Design team-led athlete registration flow
- Add athlete invitation or confirmation flow
- Prepare athlete profile/history foundations

### 4. Legal And WodBuster Bridge

- Add privacy and consent surfaces in the product
- Define retention/anonymization implementation points
- Add configurable WodBuster links in the public experience

### 5. Technical Debt And DX

- Migrate `src/middleware.ts` to `src/proxy.ts`
- Replace hardcoded role checks with centralized helpers while doing that
- Add admin UI for currently uncovered schema areas:
  athletes, workout stages, volunteer assignments
- Decide whether `stream_sessions` and `media` deserve real product surface or should be removed

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

## Later

These items matter, but they are not the best next move right now.

- richer sponsor placement strategy
- stronger test coverage
- more robust loading/error states on operational screens
- wider live/overlay ranking logic for trickier score types
- deeper media/gallery or stream-session features
