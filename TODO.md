# TODO

## Done (v1 build-out)

- [x] docs/FD.md — all screens drafted + approved (2026-07-08)
- [x] docs/TD.md — full technical design (2026-07-09)
- [x] Claude Design prompts + all 10 mockups generated, DNA-checked (2026-07-09)
- [x] Supabase project live (ap-southeast-2) + schema/RLS/triggers applied
- [x] Vercel project live (workout-app-jade-theta.vercel.app), auto-deploys main
- [x] Next.js app scaffolded (Next 16, App Router, STYLE.md tokens)
- [x] Onboarding ported — real auth (magic link + Google), handle check,
      rule-based plan generation (2026-07-09)
- [x] Google OAuth provider configured and verified working
- [x] Exercise library seeded (29 exercises, adaptations keyed to the 8
      limitation tags); plan generation fills session_exercises
- [x] **All screens ported to real features** (2026-07-09): Today, Plan,
      Session Editor, Workout Player (logging/streaks/badges/celebration),
      Exercise Library, Stats, Badges, Profile, Friends

## Next

- [ ] Set `NEXT_PUBLIC_SITE_URL=https://workout-app-jade-theta.vercel.app`
      in Vercel env vars (owner) — keeps auth redirects off localhost
- [ ] Polish pass against the mockups: motion/:active states everywhere,
      per-exercise demo keyframes (only 9 generic patterns exist), richer
      week-strip/hero states
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
