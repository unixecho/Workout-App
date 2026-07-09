# HANDOFF.md

Session-to-session handoff log. Any future Claude Code (or claude.ai) session
should read this first, then CLAUDE.md, then docs/FD.md.

---

## 2026-07-09 (latest) — Next.js app scaffolded

- Scaffolded the real Next.js app in this repo (Next 16, App Router,
  TypeScript, `src/` dir, no Tailwind — plain CSS with STYLE.md's tokens as
  CSS custom properties in `src/app/globals.css`).
- Route structure (all placeholder pages right now, ready to receive the
  ported mockups): `/onboarding` (+ `/profile`, `/body-stats`, `/goal`,
  `/availability`, `/plan-reveal` for S1-S5), the 5 tabs under a `(tabs)`
  route group with a shared `<TabBar>` (`/today`, `/plan`, `/stats`,
  `/friends`, `/profile`), `/sessions/[dayId]` (Session Editor, pushed, no
  tab bar), `/workout/[dayId]` (Workout Player, full-screen), `/library` +
  `/library/[slug]` (Exercise Library), `/badges`.
- Supabase wiring per [docs/TD.md](docs/TD.md): `src/lib/supabase/{server,
  client,middleware}.ts` (`@supabase/ssr`), `src/proxy.ts` (Next 16 renamed
  "middleware" to "proxy" — used the new convention from the start),
  `/auth/callback` route handler. Auth gating **no-ops** until
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set (no
  Supabase project exists yet) — see `.env.local.example` for the vars
  needed once it does.
- `.claude/launch.json` added so `npm run dev` can be previewed directly.
- Verified: `tsc --noEmit` clean, dev server boots with no errors, `/`
  redirects to `/today`, tab navigation and dynamic routes
  (`/workout/[dayId]` etc.) all resolve 200 server-side.
- **Nothing committed yet.**
- **Next:** owner's call — set up the Supabase project (region decision
  still open) and Vercel project, or start porting the approved
  `claude design/*.dc.html` mockups into the real route files.

## 2026-07-09 (later) — docs/TD.md drafted

- [docs/TD.md](docs/TD.md) now covers the full technical design: data model
  (profiles/plans/plan_days/session_exercises, exercises seed library,
  workout_logs/exercise_logs, streaks/badges/user_badges, friend_requests/
  friendships/activity_events/feed_entries/fist_bumps, notification_prefs),
  Supabase RLS policy shape per table, auth flow (magic link + Google, profile
  bootstrap trigger), API structure (Server Components for reads, Server
  Actions for mutations, no generic REST layer), realtime (3 subscriptions:
  feed, fist-bumps, friend requests — all fan-out to single-equality filters
  so RLS/Realtime stays simple), badge/streak calc (server-authoritative,
  lazy missed-day detection instead of per-user-timezone cron), animation
  architecture (data-driven keyframes compiled to static CSS per exercise,
  one shared `<ExerciseDemo>` component), and deployment envs.
- Also fixed the minor design-mockup token drift the owner flagged: Exercise
  Library/Onboarding/Stats/Profile all had a few invented off-palette colors,
  Stats' header was missing top safe-area padding, Profile's stat-chip
  numbers weren't `tabular-nums`. All fixed in `claude design/*.dc.html`.
  Standardized the destructive-red color (`#FF453A`) across Profile/Plan/
  Session Editor and added it to [STYLE.md](STYLE.md) as an official
  `--red` token (previously undocumented, three separate screens had
  independently invented a version of it).
- `design src/` (the raw Claude Design zip exports) is now gitignored — kept
  locally as a private backup, not committed.
- **Nothing committed yet** (owner wants to keep iterating before the first
  commit of this batch).
- **Next:** owner's call — set up Supabase project (region choice is
  permanent, still open per TODO.md), set up Vercel project, scaffold the
  Next.js app structure, or start porting screens into React components
  using the approved mockups as reference.

## 2026-07-09 (earlier) — All 10 screens generated, reviewed, Today fixed

- All 10 Claude Design prompts fired; outputs extracted to `claude design/`
  (one folder per screen, each a `.dc.html` self-contained mockup).
- Ran the Design DNA compliance checklist against all 10:
  - **Workout Player, Badges, Session Editor, Plan Builder, Friends** — clean,
    no drift.
  - **Today.dc.html — was the outlier and has been fixed in place.** It had
    drawn a decorative iPhone bezel (rounded corners, fake status bar with
    9:41/battery/signal icons) instead of the real safe-area-aware full-bleed
    technique every other screen and [index.html](index.html) use — it had
    **zero** `env(safe-area-inset-*)` usage. Rewrote it to drop the fake
    chrome and use real safe-area insets on the sticky header and bottom nav,
    matching the rest.
  - **Exercise Library, Onboarding, Stats, Profile** — minor cosmetic token
    drift only (a few invented off-palette colors, Stats' header missing
    top safe-area padding, Profile's stat numbers not `tabular-nums`).
    Not blocking — deferred to the real Next.js port, where STYLE.md tokens
    get enforced in actual CSS anyway.
- **Next:** either eyeball the screens directly, or move on to writing
  docs/TD.md and scaffolding the Next.js app using these as the visual
  reference.

## 2026-07-08 — Design prompts written

- [docs/DESIGN_PROMPTS.md](docs/DESIGN_PROMPTS.md) now has **10 self-contained
  Claude Design prompts** covering every v1 screen (onboarding S0–S5 as one
  flow, then Today, Plan Builder, Session Editor, Workout Player, Exercise
  Library, Stats, Badges, Profile & Settings, Social/Friends), each derived
  directly from its FD.md section and repeating the STYLE.md tokens inline so
  it can be pasted standalone into a fresh session.
- Each prompt asks for a single self-contained HTML mockup (same
  no-build technique as [index.html](index.html)) so outputs are directly
  comparable and reviewable in a browser.
- A **Design DNA compliance checklist** at the bottom of that file is the bar
  for accepting/rejecting each generated screen — the workout player prompt
  is explicitly framed as the quality floor for every other screen.
- **Nothing has been run yet.** Next: fire the prompts one by one (owner's
  call on order/pace), review each against the checklist, iterate. Once
  screens are approved they become the reference for the real Next.js port.

## 2026-07-08 (later) — FD drafted end-to-end

- [docs/FD.md](docs/FD.md) now covers **every v1 screen**: navigation model
  (5-tab bar), Today/home, Plan Builder, Session Editor, Workout Player
  (formalized from the prototype), Exercise Library, Stats, Badges screen,
  Profile & Settings, Social/Friends, and badge/streak mechanics — each with
  purpose, layout, every button + destination, states, and edge cases.
- **Appendix A** in the FD lists the product knobs the assistant decided
  autonomously (streak credit rule, freezes, privacy retroactivity, etc.) —
  owner should skim and confirm/tune these.
- Owner confirmed: animated **SVG** exercise demos are the v1 technique
  (no sprite sheets needed for now).
- Repo is public (owner tests the prototype live via GitHub Pages) — keep
  anything sensitive out of committed files; production deploys to Vercel.
- Owner reviewed Appendix A: **all knobs confirmed**. Streak credit =
  full completion; the editable session ("Remove from today" in the player)
  is the escape valve, no partial credit.
- Personal medical details scrubbed from the public prototype
  ([index.html](index.html)) — warn blocks are now generic form/safety cues.
- **FD is approved. Next:** generate Claude Design prompts per screen, then
  write docs/TD.md.

## 2026-07-08 — Project bootstrap

Project bootstrapped at `C:\Users\Johnathan\Documents\GitHub\Workout-App`,
connected to https://github.com/unixecho/Workout-App.

- FD in progress — onboarding flow (sections 1–2) drafted in
  [docs/FD.md](docs/FD.md).
- Reference prototype at `C:\Users\Johnathan\Downloads\day1_workout_1.html`
  (committed in this repo as [index.html](index.html)) sets the design/motion
  bar for the whole app. Design system extracted into [STYLE.md](STYLE.md).
- [docs/TD.md](docs/TD.md) is a locked skeleton until the FD is approved.
- **Next: design FD screens 3 onward before writing any application code.**
- Product owner is non-technical — treat this as full-service development
  (see CLAUDE.md for operating rules and locked v1 scope).
