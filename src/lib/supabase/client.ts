import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components (e.g. optimistic mutations,
 * Realtime subscriptions — see docs/TD.md § Realtime usage).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
