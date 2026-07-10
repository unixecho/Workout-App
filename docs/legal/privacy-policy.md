<!--
DRAFT — NOT LEGAL ADVICE. Written by an AI assistant from the app's actual
data model (docs/TD.md) as a starting point, not by a lawyer. Do not
publish or link this from the live app until every [BRACKETED] placeholder
is filled in and a lawyer has reviewed it — particularly the GDPR posture
(the production database is hosted in Frankfurt/eu-central-1 and body
measurements are arguably health-adjacent data) and the age/COPPA
position. See docs/legal/README.md for the open items.
-->

# Privacy Policy

**Last updated:** [DATE]

This Privacy Policy explains what data RepUp ("we," "us," "the App")
collects, why, and how you can control it. It applies to everyone who uses
the App.

## 1. What We Collect

**Account & profile**
- Email address and name/avatar, from Google sign-in.
- Handle, display name, age, height, weight, unit preference, fitness
  goal, target weight, training-day availability, equipment access, and
  any physical limitations you tell us about.

**Training data**
- Your generated weekly plan and sessions.
- Workout logs: which exercises you did, sets/reps/time completed, when,
  and how long the session took.
- Body-weight check-ins you log over time.

**Social data** (only if you use the Friends feature)
- Friend requests and connections.
- Activity you choose to make visible to friends (completed workouts,
  badges earned, fist bumps) — controlled by your Activity Visibility
  setting (Profile → Privacy).

**Automatically collected**
- Standard technical/log data from our hosting and infrastructure
  providers (e.g., IP address, browser type, request timestamps) —
  collected by Vercel (hosting) and Supabase (database/auth) as part of
  operating the service, not by us directly for tracking purposes.
- We do not currently use third-party advertising trackers or analytics
  cookies.

**What we don't collect**
- No payment/financial information (the App is free — see Terms §7).
- No location data, camera, or microphone access.
- No health data from third-party fitness trackers/wearables (not
  integrated in the current version).

## 2. Why We Collect It

| Data | Purpose |
| --- | --- |
| Email, auth identity | Sign you in, secure your account |
| Body stats, goal, equipment, limitations | Generate a training plan tailored to you |
| Workout logs | Track progress, power streaks/badges/stats |
| Friend connections, activity visibility | Power the optional social features you opt into |
| Technical/log data | Operate, secure, and debug the service |

We do not sell your personal data. We do not use your body-stat or health
data for advertising.

## 3. Who We Share It With

We use a small number of infrastructure providers ("processors") to run
the App. They only receive the data needed to provide their service and
are contractually bound to keep it confidential:

- **Supabase** — hosts our database, authentication, and file storage.
  Our production database is hosted in the EU (Frankfurt, eu-central-1).
- **Google** — provides sign-in (OAuth). We receive your name, email, and
  profile photo if you sign in with Google; we don't receive your Google
  password.
- **Vercel** — hosts and serves the App itself.

We do not share your data with advertisers or data brokers. We may
disclose data if required by law, to protect our legal rights, or in
connection with a merger/acquisition (with notice to you).

**Friends and other users**: if you enable friend activity visibility,
your connected friends can see the activity you've allowed (per §1). They
cannot see your body stats, weight, limitations, or private profile
details — only what's rendered in the activity feed.

## 4. Data Retention & Deletion

We keep your data for as long as your account is active. If you delete
your account (Profile → Delete account), this is **immediate and
permanent** — your profile, workout history, body-stat history, and
friend connections are deleted from our production database. [Placeholder
— confirm with a lawyer/your infra whether backups retain deleted data for
some period, and disclose that here if so.]

## 5. Your Rights

Depending on where you live (this section is written with GDPR in mind
given our EU hosting), you may have the right to:

- **Access** the personal data we hold about you.
- **Correct** inaccurate data (most fields are editable directly in
  Profile).
- **Delete** your data (self-service via account deletion, or contact us).
- **Export** your data in a portable format.
- **Object to or restrict** certain processing.
- **Withdraw consent** at any time where processing is based on consent.

To exercise any of these, use the in-app controls where available, or
contact us at [CONTACT EMAIL]. [Placeholder — if you have EU users, you
may need to name an EU representative/DPO here per GDPR Art. 27, and
confirm the legal basis you're relying on for each category of processing
— likely "contract" for core account/training data and "consent" for the
social/activity features.]

## 6. Children's Privacy

RepUp is not directed at children under [13 / 16 — align with the age
floor chosen in Terms §1]. We do not knowingly collect data from children
under that age. If you believe a child has created an account, contact us
at [CONTACT EMAIL] and we'll delete it.

## 7. Security

We rely on Supabase's infrastructure (encryption in transit and at rest,
Row Level Security policies scoping every table to its owner) and standard
authentication practices (OAuth, no passwords stored by us). No system is
perfectly secure, and we can't guarantee absolute security.

## 8. Cookies

We use only the cookies necessary to keep you signed in (authentication
session cookies via Supabase Auth). We don't use advertising or
cross-site tracking cookies.

## 9. Changes to This Policy

We'll update the "Last updated" date above when this policy changes, and
make a reasonable effort to notify you in-app of material changes.

## 10. Contact

Questions or requests about your data: [CONTACT EMAIL].
