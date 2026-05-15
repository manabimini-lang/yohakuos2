import type { CardStyleValue } from "@/lib/settings/types";

export function getThemeClasses(cardStyle: CardStyleValue) {
  if (cardStyle === "COMPACT") {
    return {
      card: "p-3 rounded-xl",
      gap: "gap-3",
    };
  }
  if (cardStyle === "COMFORTABLE") {
    return {
      card: "p-6 rounded-2xl",
      gap: "gap-5",
    };
  }
  return {
    card: "p-4 rounded-2xl",
    gap: "gap-4",
  };
}
