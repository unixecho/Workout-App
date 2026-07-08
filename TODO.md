# TODO

- [x] Finish docs/FD.md sections 3+ (screen-by-screen design: today/home,
      plan builder, session editor, workout player, exercise library, stats,
      badges, profile/settings, social/friends, badge/streak mechanics) —
      **drafted 2026-07-08, awaiting owner review (see FD Appendix A knobs)**
- [ ] Finalize data model (users, plans, sessions, exercises, logs, badges,
      friendships)
- [ ] Write docs/TD.md once FD is signed off
- [x] Generate Claude Design prompts per screen — see
      [docs/DESIGN_PROMPTS.md](docs/DESIGN_PROMPTS.md) (10 prompts: onboarding,
      today, plan builder, session editor, workout player, exercise library,
      stats, badges, profile/settings, social) — **ready to fire, none run yet**
- [ ] Run each Claude Design prompt, review output against the DNA compliance
      checklist, iterate until every screen clears the workout-player bar
- [ ] Set up Supabase project (⚠️ region choice is permanent — decide
      deliberately before creating)
- [ ] Set up Vercel project + connect to
      https://github.com/unixecho/Workout-App
- [ ] Scaffold Next.js app structure
- [ ] Port the reference prototype (index.html, originally
      C:\Users\Johnathan\Downloads\day1_workout_1.html) into a production
      React component, preserving its exact visual and motion quality
