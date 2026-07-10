# HANDOFF.md

Session-to-session handoff log. Any future Claude Code (or claude.ai) session
should read this first, then CLAUDE.md, then docs/FD.md.

---

## 2026-07-10 (latest) — Auth fixes, warmup category, realtime social, owner bug-fix round

Owner tested this session's fixes live and confirmed they work. Three
sub-rounds, all pushed to `main` and deployed:

**Round 1 — auth reliability**
- Fixed magic-link failures silently dropping the session: `/auth/callback`
  now forwards Supabase verify + code-exchange errors as query params;
  onboarding surfaces them with a resend prompt instead of a blank step 0.
- Confirmed the Frankfurt Supabase redirect-URL allow-list fix (owner did
  this in the dashboard) resolved the otp_expired issue.

**Round 2 — warmup category + friends social layer** (migrations 0010–0013,
all applied to Frankfurt prod)
- Warmup category: `Warmup` tag + 7 new exercises (rower, elliptical, leg
  swings, torso twists, shoulder rolls, butt kicks, dead hang) with
  hand-authored demo animations; focus-aware warm-up selection; Library
  filter.
- Realtime friends feed, "You finished…" self-perspective activity,
  Steam-style "you became friends" events, friend-card fist-bump with a
  private notification to the target, Friends-tab request badge.
- Availability changes auto-regenerate the week; body stats (age/height/
  weight) are sliders now, not typed fields.

**Round 3 — owner bug reports on the above** (no new migrations, app-code
only)
- **Real root cause of "activity doesn't update" found and fixed**:
  `FriendsScreen` seeded `items` via `useState(feed)`, which never re-reads
  the prop after the initial mount. `router.refresh()` (whether from
  realtime or a new visibility-change fallback) fetched fresh data
  server-side but never displayed it — only a full remount (navigate away
  and back) did. Fixed with `useEffect(() => setItems(feed), [feed])`. Also
  hardened both realtime subscriptions (Friends feed + TabBar badge) with
  `onAuthStateChange` instead of a one-shot `getSession()` (avoids a
  hydration race that connects to Realtime as anon, which RLS then silently
  filters to nothing), and added a visibility/focus refresh as a
  belt-and-suspenders fallback since mobile browsers drop websockets when
  backgrounded.
- Fixed a `NEXT_REDIRECT` flash after finishing onboarding — the client
  catch around `completeOnboarding()` was briefly rendering Next's internal
  redirect signal as a real error before navigation completed.
- Removed the magic-link option from onboarding entirely (owner was
  rate-limited; Google-only now).
- Added a red badge on the Friends screen's own "Friends" segment toggle
  (not just the tab bar) so a pending request is discoverable from the
  default Activity view.
- Availability sheet now warns before discarding unsaved changes
  (Discard / Keep editing); also fixed a latent bug where the row summary
  kept showing a stale draft count after a cancelled edit.
- **regenerateWeek correctness fix**: `plan_days` is a single recurring
  weekly template shared by Week *and* Month view (not one row per calendar
  date) — but the "already completed" guard checked all-time logs, so any
  day-of-week ever completed in a past week was permanently frozen out of
  regeneration. Scoped the check to the current week and added a
  `full=true` mode (used on availability save) that regenerates every slot,
  not just from-today-onward, so an availability change now correctly
  propagates through both Week and Month immediately.
- Feed poke entries ("X fist-bumped you") now have a "Bump back" button.

Also from earlier in the session: iOS-quality slider polish (thumb/track
proportions, fill-to-thumb alignment, whole-kg steps) and a two-layer scroll
fix for onboarding steps clipping on iPhone Safari/Chrome; session editor
warm-ups are now swappable, not just dose-editable.

**Verified**: `tsc --noEmit` clean, production build clean throughout, all
four Supabase migrations (0010–0013) applied and spot-checked against
Frankfurt prod via the SQL editor, onboarding Google-only flow checked in
preview. Owner tested live on-device and confirmed working.

**Next**: nothing outstanding from this session. Standing items from
TODO.md — full v1 feature list is done except Badge engine remaining rule
types (full_week/comeback/goal/perfect_form/social), Session Editor
drag-to-reorder, push notifications, PWA manifest, Google OAuth consent
screen verification before public launch, and the preview-vs-prod Supabase
environment decision.

## 2026-07-09 (Cowork, latest) — Player bugs fixed; library + month view + animations

Owner-reported fixes (all verified with `tsc` + production build):

- **Set 3/3 bug**: finishing the final set never turned its dot green or
  completed the exercise — the rep tracker/timer had no last-set handler.
  Now the final rep/final timer lights the dot and auto-completes the
  exercise (guarded so it can't toggle a done exercise back off).
- **Refresh recovery**: set/rep progress now checkpoints to localStorage
  per day (cleared on completion), the workout page reads exercise logs
  across ALL open logs (a race could create duplicates and the page could
  read the wrong one), `ensureWorkoutLog` picks the newest, and exercise
  logging is idempotent (delete-then-insert).
- **Magic-link error**: /onboarding now parses Supabase's hash errors
  (#error_code=otp_expired…) into a friendly message + reopens the email
  field. Root cause is still the missing `/auth/callback` redirect
  allow-list entry (see TODO ⚠️ — one-click owner fix in the dashboard).

Features:

- **Plan month view**: Week/Month segmented toggle; calendar projects the
  weekly template onto any month, green = completed (from workout_logs
  dates), blue = planned, taps open the session editor.
- **Library expansion — migrations 0008/0009 written but NOT APPLIED yet**:
  new `park` equipment tier (public calisthenics parks; capability-set
  selection replaces the linear tier — park and home-basic are disjoint),
  21 new exercises (treadmill/bike/rope/high-knee warmups, bodyweight
  mains incl. burpee/wall-sit/pike push-up/doorway row, park pull-up/
  chin-up/dips/inverted row/hanging knee raise/step-up), Compound tags so
  "Full Body" days stop matching Core-only. UI: park option in
  onboarding/profile/library filter.
- **Warm-up block**: 3 min cardio (best available equipment) + 1 mobility
  drill at the top of every generated session.
- **Demo precision pass**: 25 new hand-authored SVG patterns in
  ExerciseDemo (pullup, dip, invrow, kneeraise, stepup, burpee, deadbug,
  birddog, superman, treadmill, bike, jumprope, situp, sideplank, wallsit,
  catcow, childpose, jumpingjack, climber, calfraise, armcircle,
  hipcircle, highknees, jumpsquat, pike); 0009 points every existing
  exercise at its precise pattern.
- **Workout intro/outro**: branded loading screen for /workout (barbell
  outline draws in, stick figure reps, RepUp wordmark, speed lines) and a
  finish sequence (summary tiles stagger in → whole overlay fades to bg →
  lands on /plan).

Notes for next session: apply 0008 then 0009 (separate transactions —
enum value can't be added and used in one), then delete-Sydney checklist
item still pending; sandbox mount showed stale file sizes for
file-tool edits this session, bash-side writes were used instead.

## 2026-07-09 — Frankfurt migration verified; editable settings shipped

- Editable settings landed: Profile rows for body stats, goal, availability,
  equipment, and limitations now open real edit sheets with server actions;
  saving a training-affecting field offers "Regenerate remaining days?"
  (FD §10). Verified live end-to-end.
- Instant navigation: `loading.tsx` skeleton on every route segment (tab bar
  lives outside the data boundary, so switching tabs never blocks), and
  collapsed sequential query waterfalls into parallel `Promise.all` batches
  on Today/Stats/Friends/Badges.
- **Migrated Supabase Sydney → Frankfurt** (owner's Israel location made
  Sydney's ~270ms one-way latency the dominant cost on every screen). New
  project `pjzdqxbmpaplmrqecdqf`; all 7 migrations reapplied. Discovered
  and fixed a real gap along the way: the fresh project didn't have
  Supabase's usual default anon/authenticated table grants (RLS policies
  alone aren't enough — Postgres also needs table-level grants), so added
  an explicit `0007_grants.sql`. `vercel.json` pins functions to `fra1`.
- Owner updated Vercel env vars, Google OAuth redirect URI, and Supabase
  provider/URL config. Verified end-to-end: production JS bundle confirmed
  serving Frankfurt (zero Sydney references left after a redeploy — env var
  changes alone don't rebuild already-deployed code, had to trigger a fresh
  build), and traced a real magic-link through production's redirect flow.
- **Found one open bug during that trace**: the new project's Redirect URLs
  allow-list only has the bare domain, not `/auth/callback` specifically —
  Supabase silently truncates the redirect target rather than erroring,
  which would make production login silently fail. Documented in TODO.md
  as the one remaining step before Frankfurt is fully cut over.
- Old Sydney project still exists (not deleted) until the above is fixed
  and a real login is confirmed working on Frankfurt.

## 2026-07-09 (earlier) — Every v1 screen ported and live

- **All 9 remaining screens ported to real, working features** against live
  Supabase data (commit 69fba9e): Today, Plan, Session Editor, Workout
  Player (with logging, streaks, badge engine, celebration overlay),
  Exercise Library (browse/detail/picker), Stats, Badges, Profile
  (toggles/sign-out/delete), Friends (feed/requests/search/fist-bumps).
- **Exercise library seeded** (29 exercises, migration 0004) with form cues,
  common mistakes, and adaptations keyed to the 8 limitation tags. Plan
  generation now fills `session_exercises` via the rule-based selector in
  [src/lib/plan/exercises.ts](src/lib/plan/exercises.ts). Demos are
  pattern-driven animated SVG stick figures (SMIL, pause-at-extremes) in
  the single shared [ExerciseDemo](src/components/ExerciseDemo.tsx).
- New RPCs: `search_profiles` (0005) and `friend_cards` (0006) — narrow
  security-definer functions because profiles RLS is owner-only.
- **Discovered two real auth users exist** (owner's accounts: `john` via
  email, `codra` via Google — Supabase did NOT link them). Briefly
  mis-diagnosed their two plans as duplicates and superseded john's; fixed.
  Multi-account is worth watching in future debugging.
- Verified in-browser with an authenticated session: real plan/day data,
  personalized adaptation notes (wrist → push-up note), friend search
  finds real accounts, badges/stats aggregate correctly.
- Known gaps: full_week/comeback/goal/perfect-form/social badge rules not
  yet evaluated (engine handles the other 6 types); streak freezes not
  auto-applied; no realtime subscriptions yet; drag-reorder in Session
  Editor deferred; no push notifications.

## 2026-07-09 (earlier) — Next.js app scaffolded

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
