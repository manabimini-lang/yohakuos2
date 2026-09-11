import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "yohaku-audio";
const STORAGE_PREFIX = `storage:${BUCKET}/`;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function storedAudioReference(path: string) {
  return `${STORAGE_PREFIX}${path}`;
}

export function storagePathFromReference(reference: string | null): string | null {
  if (!reference?.startsWith(STORAGE_PREFIX)) return null;
  return reference.slice(STORAGE_PREFIX.length);
}

/** Resolves new private-storage references while retaining compatibility with legacy URLs. */
export async function resolveAudioUrl(reference: string | null): Promise<string | null> {
  if (!reference) return null;
  const path = storagePathFromReference(reference);
  if (!path) return reference;
  const { data, error } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.warn("[audio-history] signed URL unavailable", { error: error?.message });
    return null;
  }
  return data.signedUrl;
}
