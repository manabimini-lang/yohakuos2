export function getYuiGreeting(date = new Date(), timeZone = "Asia/Tokyo"): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );

  if (hour >= 5 && hour < 12) return "おはようございます";
  if (hour >= 12 && hour < 18) return "こんにちは";
  return "こんばんは";
}

export function normalizeNotificationCopy(message: string, type: "morning" | "evening"): string {
  let normalized = message
    .replace(/。{2,}/g, "。")
    .replace(/！{2,}/g, "！")
    .trim();

  if (type === "morning") {
    normalized = normalized.replace(/^(?:おはようございます|こんにちは|こんばんは)[。！!、,\s]*/, "");
    normalized = normalized.replace(/([「『\"])[\s]*(?:おはようございます|こんにちは|こんばんは)[。！!、,\s]*/g, "$1");
    normalized = `おはようございます。\n\n${normalized}`;
  }

  return normalized;
}
