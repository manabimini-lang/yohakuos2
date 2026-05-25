// ===================================================
// Supabase Client — Singleton for Auth Operations
// ===================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Creates or returns the singleton Supabase client instance.
 * Safe to call from both server and client components.
 */
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase environment variables are not configured.");
    }
    // During dev/build, provide a mock
    console.warn("[supabase] Missing environment variables. Using placeholder.");
  }

  supabaseClient = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  return supabaseClient;
}