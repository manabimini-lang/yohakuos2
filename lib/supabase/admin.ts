import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client with service_role key
// MUST NOT be used in client components
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const supabaseAdmin = createAdminClient();
