import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not defined in environment variables.");
  }
  if (secret.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return Buffer.from(secret, "hex");
}

export function encryptKey(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(String(text), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decryptKey(encryptedText: string): string {
  const key = getKey();
  const stringValue = Buffer.from(encryptedText, "base64");

  const salt = stringValue.subarray(0, SALT_LENGTH);
  const iv = stringValue.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = stringValue.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = stringValue.subarray(ENCRYPTED_POSITION);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch (error) {
    throw new Error("Failed to decrypt the key. It may have been modified or the ENCRYPTION_KEY changed.");
  }
}
