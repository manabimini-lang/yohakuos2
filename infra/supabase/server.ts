// ===================================================
// Supabase Server Client — Admin / Service Role Operations
// ===================================================
//
// IMPORTANT: This client uses the service_role key and
// bypasses RLS. Only use in server-side code (API routes,
// server actions, server components).
// ===================================================

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client with the service role key.
 * Use this for server-side operations that need to bypass RLS.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("[supabase/admin] Missing service role configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}