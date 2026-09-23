import { createHash, randomBytes } from "crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createLinkCode() {
  const bytes = randomBytes(12);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function createDeviceToken() {
  return `hko_${randomBytes(32).toString("base64url")}`;
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
