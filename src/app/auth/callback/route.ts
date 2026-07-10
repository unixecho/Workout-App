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

  // Supabase's own /auth/v1/verify step (expired/already-used link) redirects
  // here with error_code/error_description query params instead of a code —
  // forward those along so onboarding can show them instead of silently
  // dropping the user back to a logged-out step 0.
  if (!code) {
    const errorCode = searchParams.get("error_code");
    if (errorCode) {
      return NextResponse.redirect(
        `${origin}/onboarding?error_code=${errorCode}&error_description=${searchParams.get("error_description") ?? ""}`,
      );
    }
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/onboarding?error_code=exchange_failed&error_description=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
