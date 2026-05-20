import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder-supabase-url.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-supabase-key-for-build-time";

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Deterministically translates a generic string string ID (like cuid, NextAuth ID, or custom text)
 * into a valid UUID string to prevent type errors in PostgreSQL UUID fields.
 */
export function toUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  // Generate a deterministic 32 hex character string based on the input
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash1 = char + ((hash1 << 5) - hash1);
    hash2 = char + ((hash2 << 7) - hash2);
  }

  let hex = "";
  for (let i = 0; i < 32; i++) {
    const factor = i % 2 === 0 ? hash1 : hash2;
    const val = Math.abs((factor + i * 2654435761) % 16);
    hex += val.toString(16);
  }

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
