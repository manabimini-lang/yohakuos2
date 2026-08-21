export function normalizeNotificationCopy(message: string, type: "morning" | "evening"): string {
  let normalized = message
    .replace(/。{2,}/g, "。")
    .replace(/！{2,}/g, "！")
    .trim();

  if (type === "morning") {
    normalized = normalized.replace(/^(?:おはようございます|こんにちは|こんばんは)[。！!、,\s]*/, "");
    normalized = `おはようございます。\n\n${normalized}`;
  }

  return normalized;
}
