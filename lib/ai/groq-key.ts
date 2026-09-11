const INVALID_GROQ_KEY_MESSAGE =
  "保存されたGroq APIキーの形式が無効です。設定画面で有効なキーを再入力してください。";

export function normalizeGroqApiKey(value: unknown): string {
  if (typeof value !== "string") throw new Error(INVALID_GROQ_KEY_MESSAGE);
  const normalized = value.trim();
  if (!/^gsk_[A-Za-z0-9_-]{20,}$/.test(normalized)) throw new Error(INVALID_GROQ_KEY_MESSAGE);
  return normalized;
}
