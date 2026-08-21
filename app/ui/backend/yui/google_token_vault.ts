import "server-only";
import { decryptKey, encryptKey } from "@/lib/encryption";

export type GoogleTokenMetadata = Record<string, unknown> & {
  encryptedAccessToken?: string;
  encryptedRefreshToken?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string;
  needsMigration: boolean;
};

function decryptStoredToken(value: unknown): string {
  if (typeof value !== "string" || !value) return "";

  try {
    return decryptKey(value);
  } catch {
    throw new Error("Stored Google credentials could not be decrypted. Please reconnect.");
  }
}

export function readGoogleTokens(metadata: GoogleTokenMetadata): GoogleTokens {
  const encryptedAccessToken = decryptStoredToken(metadata.encryptedAccessToken);
  const encryptedRefreshToken = decryptStoredToken(metadata.encryptedRefreshToken);
  const legacyAccessToken = typeof metadata.accessToken === "string" ? metadata.accessToken : "";
  const legacyRefreshToken = typeof metadata.refreshToken === "string" ? metadata.refreshToken : "";

  return {
    accessToken: encryptedAccessToken || legacyAccessToken,
    refreshToken: encryptedRefreshToken || legacyRefreshToken,
    needsMigration: Boolean(legacyAccessToken || legacyRefreshToken),
  };
}

export function withEncryptedGoogleTokens(
  metadata: GoogleTokenMetadata,
  tokens: { accessToken: string; refreshToken: string },
): GoogleTokenMetadata {
  const sanitized = { ...metadata };
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  delete sanitized.encryptedAccessToken;
  delete sanitized.encryptedRefreshToken;

  return {
    ...sanitized,
    ...(tokens.accessToken ? { encryptedAccessToken: encryptKey(tokens.accessToken) } : {}),
    ...(tokens.refreshToken ? { encryptedRefreshToken: encryptKey(tokens.refreshToken) } : {}),
  };
}
