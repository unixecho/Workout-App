# RepUp — Technical Design (TD)

> Derived from the approved [FD.md](FD.md). Section numbers below map loosely
> to FD sections 3–12. This is the blueprint for the Next.js/Supabase build —
> update it alongside FD.md when a decision changes.

---

## Data model

Tables below are Postgres (Supabase). `uuid` PKs everywhere (`gen_random_uuid()`),
`created_at timestamptz default now()` implied unless noted. Types are sketches,
not final DDL — TD is the contract for shape and relationships, exact column
types get finalized when the schema is written.

### Identity & profile
- **`profiles`** (1:1 with `auth.users`, PK = `user_id`) — `handle` (unique),
  `display_name`, `avatar_url`, `age`, `height_cm`, `weight_kg`, `unit_pref`
  (`metric`/`imperial` — display only, storage always metric per FD §10),
  `goal` (enum: lose_weight/build_muscle/get_stronger/endurance/stay_healthy),
  `target_weight_kg`, `days_per_week`, `weekday_availability` (int[], 0=Mon),
  `equipment` (enum: none/basic/full_gym), `limitations` (text[] tags — feeds
  both plan generation exclusions and exercise adaptation notes),
  `activity_visibility` (enum: friends/private, default friends).

### Plan & sessions
- **`plans`** — `user_id`, `name`, `week_start_date`, `status`
  (active/superseded), `generated_at`.
- **`plan_days`** — `plan_id`, `day_of_week` (0–6), `is_rest_day`,
  `session_title`, `focus_muscles` (text[]), `est_duration_min`.
- **`session_exercises`** — `plan_day_id`, `exercise_id`, `order_index`,
  `is_warmup`, `is_cooldown`, `is_optional`, `dose_type` (reps/time), `sets`,
  `reps_min`, `reps_max`, `seconds`, `rest_seconds`. Order is reorderable
  within the non-warmup/cooldown block only (FD §5).

### Exercise library (seed data, ships bundled — public read, no writes from clients)
- **`exercises`** — `slug`, `name`, `muscle_groups` (text[]), `equipment`,
  `difficulty` (1–3), `demo_keyframes` (jsonb — per-joint angle/position
  keyframes at t=0/0.4/0.6/1, see Animation architecture below), `form_cues`
  (text), `common_mistakes` (text[]), `adaptations` (jsonb keyed by
  limitation tag → replacement cue/substitute exercise slug).

### Logging (source of truth for stats/streaks/badges — FD §8, §12)
- **`workout_logs`** — `user_id`, `plan_day_id` (nullable for ad-hoc/rest
  sessions), `started_at`, `completed_at`, `status`
  (in_progress/complete/abandoned), `total_reps`, `duration_seconds`.
  Credited calendar day = the day `started_at` falls on in the user's
  device-local timezone at start (FD §6 edge case).
- **`exercise_logs`** — `workout_log_id`, `exercise_id`, `sets_completed`
  (jsonb array of actual reps/seconds per set), `removed` (bool, for FD §6
  "Remove from today"), `removed_reason`.
- **`weigh_ins`** — `user_id`, `weight_kg`, `logged_at`.

### Streaks & badges (FD §12)
- **`streaks`** (PK `user_id`) — `current_streak`, `longest_streak`,
  `freeze_count` (max 2), `last_credited_date`, `updated_at`. A computed
  cache, not a log — see Badge/streak logic below for how it's kept correct.
- **`badges`** (catalog, public read) — `key`, `section` (streaks/milestones/
  volume/social/special), `name`, `description`, `unlock_rule` (jsonb: `{type,
  threshold, ...}` — see Badge/streak logic).
- **`user_badges`** — `user_id`, `badge_id`, `earned_at` (null = not yet
  earned), `progress` (jsonb — current/target for the in-progress UI, FD §9).

### Social (FD §11)
- **`friend_requests`** — `requester_id`, `addressee_id`, `status`
  (pending/accepted/declined), cap of 20 outgoing pending per user (FD
  edge case) enforced at insert.
- **`friendships`** — `user_a`, `user_b` (`user_a < user_b`, one row per
  pair), `created_at`.
- **`activity_events`** — `user_id`, `type` (session_completed/badge_earned/
  streak_milestone/joined), `payload` (jsonb), `visible_to_friends` (bool,
  **snapshotted from `profiles.activity_visibility` at insert time** — going
  private only affects future events, per FD §11 "not retroactive").
- **`feed_entries`** — fan-out table: `recipient_id`, `event_id`, written by
  a trigger on `activity_events` insert (one row per friend **plus one for
  the actor** — your own activity shows in your feed as "You finished …",
  and the self row is written even when visibility is private). Exists purely
  so Realtime subscriptions and feed queries can filter on a single
  `recipient_id = me` equality instead of an `IN (friend_ids)` list.
- **`fist_bumps`** — `event_id`, `from_user_id`, unique on
  `(event_id, from_user_id)` — re-tapping deletes the row (un-bump, FD §11).

### Notifications (FD §10, §12.3)
- **`notification_prefs`** — `user_id`, `workout_reminder_enabled`,
  `workout_reminder_time`, `friend_activity_enabled`, `badge_earned_enabled`,
  `streak_risk_enabled` (all default on except social batch, per FD §12.3).
- **`push_subscriptions`** — web push endpoint/keys per device. Out of scope
  to fully design until v1 push delivery is scoped — table shape only.

---

## Supabase schema + RLS policies

RLS is **on for every table**. Default posture: a row is only readable/
writable by its owner, with three documented exceptions:

| Table | Policy |
| --- | --- |
| `exercises`, `badges` | Public read (`using (true)`), no client writes — seeded via migration, not user-generated. |
| `activity_events` / `feed_entries` | Read allowed if `auth.uid() = user_id` (own events) **or** a `feed_entries` row exists with `recipient_id = auth.uid()` (friend's visible event). Write: only the owning user's session (via server action), never direct client insert — events are always server-derived from a completed action (log write, badge unlock, friend accept), so inserts happen with the service role from a trusted server action, not the anon/authenticated client role. |
| `friend_requests` / `friendships` | Read/write where `auth.uid()` is one of the two parties. Accept/decline mutate `status`; only the `addressee` may accept/decline, only the `requester` may cancel. |

Everything else (`profiles`, `plans`, `plan_days`, `session_exercises`,
`workout_logs`, `exercise_logs`, `weigh_ins`, `streaks`, `user_badges`,
`fist_bumps`, `notification_prefs`) is strict owner-only:
`using (auth.uid() = user_id)` for select/update/delete,
`with check (auth.uid() = user_id)` for insert.

`fist_bumps` insert additionally requires the target `event_id` be visible
to the inserting user per the `activity_events` policy above (can't bump an
event you can't see).

---

## Auth flow

- **Supabase Auth**, two providers only (FD §2 S0): magic link (email OTP)
  and Google OAuth. No passwords in v1.
- Next.js middleware refreshes the Supabase session cookie on every request
  and redirects unauthenticated requests away from the app shell to `/auth`.
- **Profile bootstrap**: a Postgres trigger on `auth.users` insert creates a
  blank `profiles` row (handle unset) and blank `notification_prefs`/
  `streaks` rows. Onboarding (FD §2 S1–S4) fills the rest in; a user with no
  `handle` is always routed back into onboarding regardless of auth state —
  this is what "resume where they left off" (FD §2) hinges on.
- Returning session with a complete profile skips straight to Today (FD §2
  S0 note).

---

## API / route structure

Next.js App Router. **No separate REST layer for reads** — Server
Components query Supabase directly with the user's session, and RLS is the
security boundary. Mutations are **Server Actions** colocated with their
feature, not a generic `/api` CRUD surface. Route Handlers are reserved for
the few things that aren't a form submission from a Server Component:
Supabase auth callback (`/auth/callback`), and any future webhook.

Server actions by feature area (names indicative, not final):
- **Onboarding** — `submitProfile`, `submitBodyStats`, `submitGoal`,
  `submitAvailability`, `generatePlan` (invokes the rule-based generator,
  FD §2 S5 / locked v1 scope: no LLM calls).
- **Today** — `startSession`, `resumeSession`.
- **Workout Player** — `updateRepCount`, `toggleTimer`, `markExerciseComplete`,
  `removeExerciseFromToday`, `endWorkoutEarly`, `completeWorkout` (writes
  `workout_logs`/`exercise_logs`, then calls the `recompute_streak_and_badges`
  RPC below — this is the one action with real server-side consequence
  fan-out, everything else is a straightforward row mutation).
- **Plan Builder** — `regenerateWeek`, `moveDayCard`, `convertToRestDay`,
  `duplicateDay`.
- **Session Editor** — `saveSession`, `addExercise`, `swapExercise`,
  `removeExercise`.
- **Stats** — `addWeighIn`.
- **Friends** — `sendFriendRequest`, `acceptRequest`, `declineRequest`,
  `cancelRequest`, `removeFriend`, `toggleFistBump`.
- **Profile** — `updateProfile`, `updateNotificationPrefs`, `deleteAccount`
  (calls a `delete_account(user_id)` Postgres function that cascades/
  anonymizes per the double-confirm flow in FD §10).

All mutations are optimistic on the client (FD's "no spinners" rule) and
reconcile silently on response — matches the offline-first requirement on
the Workout Player (FD §6) and the "optimistic sync" pattern used
everywhere else (Plan, Profile, Friends).

---

## Realtime usage

Supabase Realtime (Postgres changes) on exactly three subscriptions, all
filterable by a single equality so RLS + Realtime authorization stays simple:

1. **Activity feed** — client subscribes to `feed_entries` inserts where
   `recipient_id = auth.uid()`. New rows resolve to their `activity_events`
   row and animate into the feed from the top (FD §11).
2. **Fist-bumps** — client subscribes to `fist_bumps` changes for the set of
   `event_id`s currently rendered on screen, to keep bump counts live across
   viewers without a refetch.
3. **Friend requests** — client subscribes to `friend_requests` inserts
   where `addressee_id = auth.uid()`, for the incoming-request badge/section
   in Friends (FD §11).

Everything else (plan, session editor, stats) is request/response — no
realtime need, since only the owning user ever mutates that data.

---

## Badge / streak calculation logic

Server is authoritative (FD §12.2); client shows optimistic values that get
corrected silently if the server disagrees.

- **On `completeWorkout`**: the server action calls a Postgres function
  `recompute_streak_and_badges(user_id, workout_log_id)` in the same
  transaction as the log write. This function:
  1. Extends `streaks.current_streak` if the credited day is the expected
     next day (yesterday, or today if this is the first session ever);
     updates `longest_streak` if a new max.
  2. Evaluates every row in `badges` via a single rule-dispatch function
     keyed on `unlock_rule.type` (`total_sessions_gte`, `streak_length_gte`,
     `cumulative_reps_gte`, `cumulative_minutes_gte`, `full_week`,
     `comeback_gap_days`, `goal_reached`, `friend_count_gte`,
     `fistbumps_given_gte`, `session_time_before`/`session_time_after`,
     `perfect_form`) against aggregates computed from `workout_logs`/
     `exercise_logs`/`friendships`/`fist_bumps` — not 18 bespoke functions.
  3. Writes `user_badges` rows (or bumps `progress`) and an `activity_events`
     row of type `badge_earned` for each newly-earned badge.
- **On missed-day detection**: there's no per-user midnight cron (per-user
  timezones make a global scheduled job awkward). Instead, streak-break
  checking is **lazy**: the first read of `streaks` after a scheduled day
  has fully elapsed (device-local "now" is past that day) checks whether it
  was completed; if not, and no `freeze_count` is available, the streak
  resets and a freeze is consumed if one is. This keeps all timezone logic
  on the client's request rather than a server-side per-user schedule
  (matches FD §12.1 "changing timezone can never break a streak
  retroactively").
- **Freeze earn**: `+1` per 7 consecutive completed sessions, bank max 2,
  applied automatically inside the same lazy-check path (FD §12.1).

---

## Animation / motion architecture

- One shared component, `<ExerciseDemo exercise loop reducedMotion />`,
  renders every animated form demo — used looping in the Workout Player
  (FD §6) and paused/static in the Exercise Library list, looping again in
  Exercise Library detail (FD §7). Never a second implementation.
- Per-exercise motion is **data, not code**: `exercises.demo_keyframes`
  stores joint keyframes at t = 0 → 0.4 → 0.6 → 1 (ease down, **hold** at
  the bottom 40–60%, ease back up — the squat spec in STYLE.md §5 is the
  template every exercise's data follows).
- Because the library ships bundled and exercises don't change per-request,
  keyframes compile to **static CSS `@keyframes` rules at build/seed time**
  (one rule set per exercise) rather than a runtime JS interpolation loop —
  keeps every demo on transform/opacity, off the main thread, per STYLE.md's
  motion rules.
- `prefers-reduced-motion: reduce` swaps the animation for a static mid-rep
  frame (STYLE.md contract, FD §6 edge case) — implemented as a CSS media
  query disabling the `@keyframes`, not a JS branch.

---

## Deployment (Vercel envs)

- Vercel project connected to `github.com/unixecho/Workout-App`, framework
  preset Next.js.
- Required envs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (server-only — used by the small set of
  server actions that legitimately bypass RLS, e.g. `deleteAccount`, event
  fan-out inserts). Google OAuth client ID/secret are configured directly in
  the Supabase Auth provider dashboard, not as Vercel envs.
- Preview deployments (per-PR) should point at a separate Supabase
  environment from production — either a dedicated staging project or
  Supabase's database branching, so schema changes in a PR never touch real
  user data. Decide which before the first migration ships.
- **Open owner decision carried over from [TODO.md](../TODO.md)**: Supabase
  project region is permanent once chosen — needs a deliberate pick (closest
  to expected user base) before the project is created, not defaulted.
