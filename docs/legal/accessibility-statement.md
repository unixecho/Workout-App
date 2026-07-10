<!--
DRAFT — NOT LEGAL ADVICE. Written by an AI assistant against the actual
state of the codebase as of 2026-07-10, not by an accessibility auditor.
Every claim below should be re-verified (ideally with a screen reader and
an automated tool like axe) before this is published or linked from the
app. Overclaiming conformance here is worse than saying nothing — the ADA/
EAA exposure comes from a false claim of accessibility, not from admitting
gaps. See docs/legal/README.md for the open items.
-->

# Accessibility Statement

**Last updated:** [DATE]

RepUp is committed to making the app usable by as many people as possible,
including people with disabilities. This statement describes where we
currently stand and what's still in progress — honestly, not as a
conformance claim.

## Our Target

We're working toward the **Web Content Accessibility Guidelines (WCAG)
2.1, Level AA**. We are **not** claiming full conformance today — this is
an active area of work, tracked in [TODO.md](../../TODO.md).

## What's Already in Place

- **Reduced motion is respected.** Every animated exercise demo checks
  `prefers-reduced-motion` and freezes on a static pose instead of
  animating, for anyone whose OS setting requests less motion.
- **Interactive controls have accessible labels** on the components we've
  audited so far — sliders (age/height/weight), the tab bar's request
  badge, and several icon-only buttons expose `aria-label`s describing
  their action rather than relying on a bare icon.
- **Semantic form controls.** Body-stat inputs use native `<input
  type="range">` sliders rather than custom drag surfaces, so they work
  with keyboard, screen readers, and assistive switches out of the box.
- **Safe-area-aware layout.** The app respects device safe areas
  (notches, home indicators) so content and controls are never hidden
  behind system UI.

## Known Gaps (Being Worked On)

- Not every icon-only button in the app has an `aria-label` yet — this
  needs a full pass across Today, Plan, Stats, and the Workout Player.
- Color is used as the primary signal in a few places (e.g., completed vs.
  planned days) without a redundant text/icon cue in every instance —
  needs a pass to make sure everything reads correctly for color-blind
  users and screen readers.
- No formal screen-reader (VoiceOver/TalkBack) walkthrough has been done
  yet across the full app.
- No automated accessibility test (e.g., axe, Lighthouse a11y audit) is
  wired into CI yet.
- Custom animated components (exercise demos, workout player timers)
  haven't been evaluated against WCAG's non-text-content and
  timing-adjustable criteria in detail.

## Feedback

If you use assistive technology and hit a barrier anywhere in RepUp,
please tell us — we want to fix it. Contact [CONTACT EMAIL] with:

- The page/screen you were on
- What you were trying to do
- What assistive technology you were using (if any)

We'll acknowledge accessibility reports and prioritize fixes for anything
that blocks core functionality (signing in, generating a plan, logging a
workout).
