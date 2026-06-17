import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side admin client (service role). Never import this into client
// components. Returns null when Supabase isn't configured, so the app
// transparently falls back to the seed Repo.
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function isSupabaseEnabled(): boolean {
  return (
    process.env.USE_SUPABASE === "true" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
