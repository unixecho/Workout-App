import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Magic-link / OAuth redirect target (docs/TD.md § Auth flow). Exchanges the
 * auth code for a session, then sends the user into onboarding — the
 * profile-completeness check there decides whether they land on a step or
 * skip straight through to /today.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
