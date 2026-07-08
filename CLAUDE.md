# CLAUDE.md — RepUp

Persistent instructions for any Claude Code session on this repo.

## What this is

**RepUp** — a social fitness SaaS. A planner that turns goals into weekly
training plans, guides every rep with animated demos, and drives retention
with streaks, badges, and friends.

## Stack

- **Next.js** (React) deployed on **Vercel**
- **Supabase**: Postgres, Auth, Row Level Security, Realtime

## v1 scope — locked decisions

- **Social IN v1**: friends + activity visibility. **Leaderboards → v1.5.**
- **Plan generation is RULE-BASED in v1**: deterministic templates, no AI/LLM
  calls at runtime. AI-generated plans via the Anthropic API are **v2**.
- **No payments / monetization in v1** — fully free.

Do not re-open these without the product owner explicitly asking.

## Working with the product owner

- The product owner has **no web dev / React background**. Never assume they
  can debug, read a stack trace, or make a technical call.
- Make the correct engineering decision **autonomously**. Only surface a
  question when it's genuinely a **product / scope / cost** decision.
- **Communication style**: brief, lowercase is fine, wants to be unblocked
  fast — no long-winded explanations unless asked.

## Design bar (non-negotiable)

- **Native iOS quality.** Smooth 60fps interactions, intentional
  micro-animations, haptic-feeling tap states (`:active` scale/brightness
  responses on every tappable thing). Nothing that reads as "default web
  component."
- The reference prototype at
  `C:\Users\Johnathan\Downloads\day1_workout_1.html` (also committed here as
  [index.html](index.html)) is the **minimum quality standard for motion and
  visual polish on every screen**, not just the workout player.
- The design system extracted from it lives in [STYLE.md](STYLE.md) — use its
  tokens, don't invent new ones ad hoc.

## Performance is a feature

- Fast initial load, instant-feeling navigation.
- **Optimistic UI updates** rather than spinner-and-wait where reasonable.
- Prefer transform/opacity animations; keep everything off the main thread
  that can be.

## Process

- **Always check [docs/FD.md](docs/FD.md) and [docs/TD.md](docs/TD.md) before
  making product or architecture decisions; update them when decisions
  change.** They are living documents and the single source of truth.
- docs/TD.md stays a skeleton until docs/FD.md is complete and approved.
- Update [HANDOFF.md](HANDOFF.md) at the end of every working session.
- Keep [TODO.md](TODO.md) current as items complete or appear.
