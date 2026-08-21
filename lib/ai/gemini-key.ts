const INVALID_GEMINI_KEY_MESSAGE =
  "保存されたGemini APIキーの形式が無効です。設定画面で有効なキーを再入力してください。";

export function normalizeGeminiApiKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(INVALID_GEMINI_KEY_MESSAGE);
  }

  const normalized = value.trim();
  const isGeminiApiKey = /^AIza[0-9A-Za-z_-]{20,}$/.test(normalized);
  const isGoogleAccessKey = /^AQ\.[0-9A-Za-z._~-]{20,}$/.test(normalized);
  if (!normalized || (!isGeminiApiKey && !isGoogleAccessKey)) {
    throw new Error(INVALID_GEMINI_KEY_MESSAGE);
  }

  return normalized;
}
