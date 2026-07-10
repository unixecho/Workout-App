# TODO

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

## Open

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
- [ ] Realtime subscriptions (feed inserts, fist-bump counts, incoming
      requests) per docs/TD.md — currently request/response only
- [ ] Session Editor drag-to-reorder; "Move to…" / "Duplicate" day actions
- [ ] Workout Player: "Remove from today" + "End workout early" flows
- [ ] Notifications (workout reminder, streak-at-risk, social batch) — needs
      push infrastructure decision
- [ ] PWA manifest + app icons (add-to-home-screen)
- [ ] Google OAuth consent screen verification before public launch (owner)
- [ ] Decide preview-vs-prod Supabase environment strategy before the next
      schema change ships (docs/TD.md § Deployment)
