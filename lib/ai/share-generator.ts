import { ThemeType, ContextType } from "@prisma/client";
import { getContextLabel, getThemeLabel } from "@/lib/constants/theme-labels";
import type { YohakuResult } from "@/lib/ai/yohaku-generator";

function formatList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `・${item}`).join("\n") : "・なし";
}

export function generateShareMarkdown(yohaku: YohakuResult): string {
  const themeList = formatList(yohaku.dominantThemes.map((theme: ThemeType) => getThemeLabel(theme)));
  const contextList = formatList(yohaku.dominantContexts.map((context: ContextType) => getContextLabel(context)));
  const reflection = yohaku.reflection?.trim() || "まだ言葉になっていない余白があります。";

  return `# 今日の余白

最近のテーマ
${themeList}

最近の文脈
${contextList}

今日の余白

${reflection}

#YOHAKU`;
}
