# Legal docs — status

**These are AI-drafted starting points, not legal advice, and are not yet
linked from the live app.** Do not treat them as final.

- [terms-of-service.md](./terms-of-service.md)
- [privacy-policy.md](./privacy-policy.md)
- [accessibility-statement.md](./accessibility-statement.md)

## Before these can go live

1. **Fill in every `[BRACKETED]` placeholder** — business/legal name,
   contact email, governing-law jurisdiction, launch date, and the age
   floor (13 vs. 16 — affects both COPPA and GDPR wording).
2. **Get an actual lawyer to review them.** The areas with the most real
   exposure for a fitness app: the medical-advice disclaimer and liability
   limitation in the Terms (§3, §9), and the GDPR posture in the Privacy
   Policy (§5) — the production database is hosted in the EU
   (Frankfurt/eu-central-1) and body-measurement data sits close to
   "health data," which gets stricter treatment under GDPR.
3. **Wire them into the app**, which hasn't been done yet:
   - An explicit acceptance checkbox/link on onboarding S0 ("By
     continuing you agree to the Terms and Privacy Policy") before account
     creation.
   - Links from Profile → About (FD §10 already has a slot planned there).
   - Decide whether EU users need an explicit cookie/consent banner (likely
     not, since we only use functionally-necessary auth cookies — but
     confirm with the lawyer doing the review).
4. **Re-verify the accessibility statement's claims** against the actual
   app state at whatever point you're about to publish it — it was written
   against the codebase as of 2026-07-10 and will drift as the app changes.
