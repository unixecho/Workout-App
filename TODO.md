# TODO

- [x] Finish docs/FD.md sections 3+ (screen-by-screen design: today/home,
      plan builder, session editor, workout player, exercise library, stats,
      badges, profile/settings, social/friends, badge/streak mechanics) —
      **drafted 2026-07-08, awaiting owner review (see FD Appendix A knobs)**
- [ ] Finalize data model (users, plans, sessions, exercises, logs, badges,
      friendships)
- [x] Write docs/TD.md once FD is signed off — **drafted 2026-07-09**: data
      model, RLS policies, auth flow, API/route structure, realtime usage,
      badge/streak logic, animation architecture, deployment envs
- [x] Generate Claude Design prompts per screen — see
      [docs/DESIGN_PROMPTS.md](docs/DESIGN_PROMPTS.md) (10 prompts: onboarding,
      today, plan builder, session editor, workout player, exercise library,
      stats, badges, profile/settings, social) — **ready to fire, none run yet**
- [x] Run each Claude Design prompt, review output against the DNA compliance
      checklist — **done 2026-07-09**, all 10 screens extracted to
      `claude design/`. Workout Player/Badges/Session Editor/Plan/Friends
      clean; Today.dc.html was rewritten (had a fake iPhone bezel + hand-drawn
      status bar instead of real safe-area insets); Exercise
      Library/Onboarding/Stats/Profile have minor cosmetic token drift
      (deferred to the port step, not blocking)
- [ ] Set up Supabase project (⚠️ region choice is permanent — decide
      deliberately before creating)
- [ ] Set up Vercel project + connect to
      https://github.com/unixecho/Workout-App
- [x] Scaffold Next.js app structure — **done 2026-07-09**: Next.js 16 (App
      Router, TypeScript, src dir, no Tailwind), STYLE.md tokens in
      globals.css, all 5 tab routes + onboarding (S0-S5) + Session Editor +
      Workout Player + Exercise Library + Badges as placeholder pages,
      Supabase client/server/middleware helpers wired per docs/TD.md (auth
      gating no-ops until the Supabase project exists), dev server verified
      booting clean. Not committed yet.
- [ ] Port the reference prototype (index.html, originally
      C:\Users\Johnathan\Downloads\day1_workout_1.html) into a production
      React component, preserving its exact visual and motion quality
- [ ] Port the other 9 approved mockups (`claude design/*.dc.html`) into
      their real route files (all currently placeholders — see TD.md route
      list)
