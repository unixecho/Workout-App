import { redirect } from "next/navigation";

/**
 * Entry redirect. Once auth is wired up (see docs/TD.md — Auth flow), this
 * should check the session and route to /onboarding (no profile yet) or
 * /today (returning user) instead of a hardcoded redirect.
 */
export default function RootPage() {
  redirect("/today");
}
