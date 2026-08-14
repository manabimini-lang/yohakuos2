import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

// Server-only client with service_role key
// MUST NOT be used in client components
export function createAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!serviceRoleKey) {
    throw new Error("[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables.");
  }
  if (!supabaseUrl) {
    throw new Error("[Supabase Admin] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is not configured.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createAdminClient();
  }
  return adminClient;
}
