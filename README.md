# RepUp

**A social fitness planner that turns your goals into weekly training plans, guides every rep with animated demos, and keeps you going with streaks, badges, and friends.**

## Stack

- **Next.js** (React) — app framework
- **Supabase** — Postgres database, Auth, Realtime
- **Vercel** — hosting & deployment

## Status

**Pre-MVP — functional design in progress.**

No application code yet. The functional design ([docs/FD.md](docs/FD.md)) is being completed screen by screen before any code is written. The technical design ([docs/TD.md](docs/TD.md)) follows once the FD is signed off.

## How this repo operates

The product owner is **non-technical**. This README and [CLAUDE.md](CLAUDE.md) are the source of truth for how the AI assistant (Claude Code) operates on this repo: it acts as the senior engineer and design authority, makes technical decisions autonomously, and only surfaces questions that are genuinely product/scope/cost decisions.

Key documents:

| File | Purpose |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Persistent instructions for every assistant session |
| [docs/FD.md](docs/FD.md) | Functional design — screens, flows, states (living doc) |
| [docs/TD.md](docs/TD.md) | Technical design — schema, auth, APIs (locked until FD approved) |
| [STYLE.md](STYLE.md) | Design system extracted from the reference prototype |
| [TODO.md](TODO.md) | Current work queue |
| [HANDOFF.md](HANDOFF.md) | Session-to-session context handoff |
| [index.html](index.html) | Reference prototype — the design & motion quality bar |
