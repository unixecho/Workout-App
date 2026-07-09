import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components / Server Actions / Route
 * Handlers. RLS applies using the requesting user's session — this is the
 * only client reads/writes should go through outside of `lib/supabase/admin.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no cookie write access —
            // safe to ignore since middleware refreshes the session on every
            // request (see src/middleware.ts).
          }
        },
      },
    },
  );
}
