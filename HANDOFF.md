# HANDOFF.md

Session-to-session handoff log. Any future Claude Code (or claude.ai) session
should read this first, then CLAUDE.md, then docs/FD.md.

---

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
