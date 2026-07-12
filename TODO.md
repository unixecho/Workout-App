# TODO

## Done (2026-07-12)

- [x] **Migration 0014 (full-gym library expansion) applied to Frankfurt prod**:
      26 new exercises live — barbell lifts (deadlift, RDL, OHP, row, incline
      bench, hip thrust, front squat), machines (leg extension/curl, hack squat,
      chest press, pec deck, shoulder press, assisted pull-up, calf raise, back
      extension), cables (pushdown, curl, fly, face pull, cable crunch) and
      dumbbell accessories (incline press; lateral raise + hammer curl are
      `basic`). 7 new hand-authored demo patterns. Arms tag added to isolation
      work for better day-type matching. Made migration idempotent with
      ON CONFLICT DO UPDATE to handle partial-apply edge cases.

## Done (2026-07-11)

- [x] **Session Editor drag-to-reorder**: hold any exercise row ~0.4s to
      lift it (scale + shadow + haptic), drag to a new position — siblings
      slide out of the way, release settles into place. New order persists
      via `order_index` on Save and flows through to Today and the Workout
      Player. Verified in preview with synthetic pointer drags (down 2
      slots, up 2 slots, quick-tap still opens the dose sheet).

## Done (2026-07-10, third round — owner bug reports)

- [x] **Real root cause of "activity doesn't update" found**: `FriendsScreen`
      seeded `items` via `useState(feed)`, which only reads the prop on
      initial mount — a subsequent `router.refresh()` (from realtime or the
      new visibility fallback) fetched fresh data server-side but never
      applied it to screen. Only a full remount (navigating away and back)
      ever showed it. Fixed with `useEffect(() => setItems(feed), [feed])`.
      Also hardened both realtime subscriptions (Friends feed, TabBar badge)
      to use `onAuthStateChange` instead of a one-shot `getSession()` call
      (avoids a hydration race that connects as anon), and added a
      visibility/focus-triggered refresh as a fallback for mobile browsers
      that drop websockets when backgrounded.
- [x] **NEXT_REDIRECT flash after onboarding fixed**: `handleAcceptPlan`'s
      client-side try/catch was catching Next's internal redirect signal
      and briefly rendering it as a save error before navigation completed.
      Now detects and rethrows redirect errors.
- [x] **Magic link removed from onboarding** — Google-only now (owner was
      rate-limited; Google already worked fine). Verified in preview.
- [x] **Friends segment badge**: a small red count now shows directly on
      the "Friends" segment toggle (not just the tab bar) so a pending
      request is discoverable from the default Activity view.
- [x] **Availability unsaved-changes guard**: dismissing the training-days
      sheet with unsaved edits now shows a Discard/Keep-editing confirm
      instead of silently losing the change. Also fixed a latent bug where
      the Availability row kept showing a stale draft count after a
      cancelled edit.
- [x] **regenerateWeek correctness fix**: `plan_days` is a single recurring
      weekly template shared by Week *and* Month view (not per-date rows),
      but the "already completed" guard checked ALL-TIME logs, permanently
      freezing any day-of-week slot ever completed in a past week. Scoped
      the check to the current week and added a `full=true` mode (used on
      availability save) that regenerates every slot instead of only
      today-onward, so an availability change now fully and correctly
      propagates through both Week and Month.
- [x] **Return a fist bump from the feed**: a "bump back" button now
      appears on incoming poke entries in the activity feed.

## Done (2026-07-10, follow-up round)

- [x] **Fixed realtime feed not updating**: the browser Supabase client's
      realtime socket connected as `anon` before the session hydrated, so
      RLS silently filtered out every row. Now calls
      `supabase.realtime.setAuth(token)` before subscribing (Friends feed +
      TabBar badge)
- [x] **"Became friends" activity** (migration 0012, applied): accepting a
      request emits a `friendship` event — "You and John are now friends 🤝"
      — fanned out to both parties and their friends
- [x] **Friends tab red badge**: pending incoming request count shown live
      on the tab bar icon, seeded server-side + bumped via realtime
- [x] **iPhone-style sliders**: thinner iOS track proportions, thumb-shadow
      polish, fill edge now aligns to the thumb center at all values (was
      drifting out of ratio near the ends); weight steps in whole kg (no
      more 82.5 kg)
- [x] **Onboarding no longer clips on iPhone**: each step now uses a
      two-layer scroll (`min-height: 100%` inner flex column inside an
      `overflow-y: auto` outer) so Days-per-week/Equipment/Limitations and
      the CTA button are always reachable, verified at short viewports
- [x] **Warm-up swappable**: session editor's warm-up rows get a "Swap
      warm-up" picker with equipment-appropriate alternatives, not just
      dose editing
- [x] **Friend-card fist bump**: a gently-animated 👊 button next to each
      friend's streak sends a direct poke; the target sees a live "X
      fist-bumped you 👊" entry in their feed (migration 0013, applied —
      poke events route to the target only, not a broadcast)

## Done (2026-07-10)

- [x] Migrations 0008 + 0009 applied to Frankfurt (park tier, 21 exercises,
      demo patterns, Compound tags) — verified in prod
- [x] Redirect-URL allow-list fix confirmed live (`/auth/callback` entry)
- [x] Magic-link failures now surface real errors: /auth/callback forwards
      verify + code-exchange errors as query params, onboarding shows the
      resend prompt (was silently dropping the session)
- [x] **Warmup category** (migration 0010, applied): 'Warmup' tag on all
      warm-up exercises + 7 new ones (rower, elliptical, leg swings, torso
      twists, shoulder rolls, butt kicks, dead hang) with hand-authored
      animations; focus-aware mobility warm-up pick (pull day → dead hang,
      upper → arm circles/shoulder rolls, lower → leg swings/hip circles);
      Library "Warm-up" filter; stats balance ignores the tag
- [x] **Realtime friends feed** (migration 0011 applied + verified: 4/4
      events have self rows, all 3 tables published): live feed inserts
      animate in, fist-bump counts sync across clients, incoming requests
      refresh the list
- [x] **Perspective-aware activity**: own events read "You finished … /
      earned …", friends' read "John has finished …"; badge events are
      clickable → /badges (Friends + Today feeds)
- [x] **Availability auto-regen**: changing training days regenerates the
      remaining week immediately (no prompt; goal/equipment/limitations
      still prompt)
- [x] **Body-stat sliders**: height/weight/age set by slider (iOS-style
      filled track, unit-aware readouts incl. ft-in/lb) in onboarding and
      the profile Body stats sheet

## Done (v1 build-out)

- [x] docs/FD.md — all screens drafted + approved (2026-07-08)
- [x] docs/TD.md — full technical design (2026-07-09)
- [x] Claude Design prompts + all 10 mockups generated, DNA-checked (2026-07-09)
- [x] Vercel project live (workout-app-jade-theta.vercel.app), auto-deploys main
- [x] Next.js app scaffolded (Next 16, App Router, STYLE.md tokens)
- [x] Onboarding ported — real auth (magic link + Google), handle check,
      rule-based plan generation (2026-07-09)
- [x] Exercise library seeded (29 exercises, adaptations keyed to the 8
      limitation tags); plan generation fills session_exercises
- [x] **All screens ported to real features** (2026-07-09): Today, Plan,
      Session Editor, Workout Player (logging/streaks/badges/celebration),
      Exercise Library, Stats, Badges, Profile, Friends
- [x] Editable settings (body stats, goal, availability, equipment,
      limitations) + regenerate-remaining-days prompt on save (2026-07-09)
- [x] Instant tab switching (loading.tsx skeletons) + parallelized query
      waterfalls on every screen (2026-07-09)
- [x] **Migrations 0008 + 0009 applied to Frankfurt** (2026-07-10) — park
      equipment tier, 21 new exercises, 11 demo-pattern updates, Compound
      tags all live and verified in prod
- [x] **Redirect URL fix confirmed live** (2026-07-10) — Frankfurt project's
      Auth → URL Configuration now allow-lists
      `https://workout-app-jade-theta.vercel.app/auth/callback` alongside
      the bare domain and localhost callback; this was the suspected cause
      of the owner's otp_expired magic-link error
- [x] **Real root cause of the magic-link failure found + fixed** (2026-07-10)
      — `/auth/callback` silently swallowed both Supabase verify errors
      (expired/already-used token) and `exchangeCodeForSession` failures,
      always redirecting to `/onboarding` with no session and no
      explanation. Now forwards `error_code`/`error_description` as query
      params; `OnboardingFlow` reads those (previously only read hash-based
      errors) and shows the friendly resend prompt. Verified in preview.
- [x] **Migrated Supabase Sydney → Frankfurt (eu-central-1)** (2026-07-09) —
      new project `pjzdqxbmpaplmrqecdqf`, all 7 migrations reapplied (0007
      adds explicit table grants the fresh project didn't have by default).
      Vercel env vars + Google OAuth + Supabase URL config all updated by
      owner; verified end-to-end: production bundle confirmed serving
      Frankfurt (zero trace of Sydney left), DB schema/grants/seed data
      all live, real magic-link generated and traced through production's
      redirect flow.

## Done (2026-07-09, Cowork session)

- [x] Workout Player: finishing the last set now turns its dot green and
      auto-completes the exercise (rep tracker + timer)
- [x] Workout Player: checkpoints — set/rep progress and done state persist
      through refresh (localStorage per day + server logs read across all
      open logs; exercise logging made idempotent)
- [x] Onboarding: magic-link errors in the URL hash (otp_expired etc.) now
      surface a friendly message + reopen the email field to resend
- [x] Plan tab: Week/Month toggle — month calendar projects the weekly
      template, shows completed (green) / planned (blue) days, taps open
      the session editor
- [x] Exercise library expansion written as migrations 0008+0009 (NOT YET
      APPLIED): `park` equipment tier (calisthenics parks), 21 new
      exercises (cardio warmups incl. treadmill/bike/jump rope/high knees,
      bodyweight mains, park: pull-up/dips/inverted row/step-up etc.),
      Compound tags for full-body days
- [x] Warm-up block: sessions now start with 3 min easy cardio (best
      equipment option) + 1 mobility drill
- [x] Per-exercise demo precision: 25 new hand-authored stick-figure
      patterns; every exercise maps to a specific motion (0009 updates)
- [x] Branded workout loader (barbell draw-in + squatting figure + RepUp)
      and finish sequence (summary tiles → fade out to Plan)

## Done (2026-07-12)

- [x] **Weight per set + badges** — MVP complete:
  - [x] Migration 0015: schema documentation for weight-per-set storage
  - [x] Workout Player: weight input UI in RepTracker/Timer for equipped exercises
  - [x] Weight checkpoint persistence (localStorage)
  - [x] Migration 0016: weight-based badge rules (Loaded 300/500, Daily 1000, Plate Loaded, Squatter, Bencher)
  - [x] Badge evaluation: milestone_loading and total_daily_loading rules
  - [x] Stats UI: per-exercise personal records (top 5 by max weight)
  - Future: enhanced rep tracking (per-set actual values), loading progression graphs

## Open

- [ ] **Hebrew locale** — in progress on the local `i18n-hebrew` branch
      (NOT pushed, per owner). Infra + first translated surfaces done;
      remaining: extract the rest of the screens, RTL audit, exercise-name
      translations (DB strategy documented in docs/I18N.md on the branch)
- [ ] **Full gym machine library** — cover every machine you can find at a
      gym (expansions beyond the current 26 new exercises in migration 0014)
- [ ] Delete the old Sydney Supabase project now that the redirect-URL fix
      is confirmed live (see Done) — do this once a real sign-in has been
      tested end-to-end on Frankfurt (test accounts don't carry over —
      fresh start on Frankfurt)
- [ ] Polish pass against the mockups: motion/:active states everywhere,
      richer week-strip/hero states (per-exercise demo keyframes: done
      2026-07-09)
- [ ] Badge engine: implement remaining rule types (full_week, comeback,
      goal_reached, perfect_form, friend/social) + streak freeze auto-apply
      (earn 1 per 7 sessions, bank 2)
- [ ] Session Editor "Move to…" / "Duplicate" day actions (drag-to-reorder:
      done 2026-07-11)
- [ ] Workout Player: "Remove from today" + "End workout early" flows
- [ ] Notifications (workout reminder, streak-at-risk, social batch) — needs
      push infrastructure decision
- [ ] PWA manifest + app icons (add-to-home-screen)
- [ ] Google OAuth consent screen verification before public launch (owner)
- [ ] Decide preview-vs-prod Supabase environment strategy before the next
      schema change ships (docs/TD.md § Deployment)
- [ ] ⚠️ **Legal: Terms of Service, Privacy Policy, Accessibility Statement**
      — first drafts written (docs/legal/), NOT legal advice. Owner still
      needs to: (1) fill in business name/contact email/governing-law
      placeholders, (2) have an actual lawyer review before public launch
      (health-adjacent data + EU users under GDPR raises real exposure),
      (3) wire the docs into the app — an acceptance checkbox on onboarding
      S0 and links from Profile → About (per FD §10)

## v1.5 / Future

- [ ] **Gym registration system** — allow users / gyms to register equipment
      in our system (machines, weights, available bars/dumbbells) so that a
      gym's inventory syncs with the app, enabling personalized session
      plans. Later: personal trainers at that gym visible + bookable
