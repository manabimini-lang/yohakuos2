import { ThemeType, ContextType } from "@prisma/client";
import { THEME_LABELS, CONTEXT_LABELS } from "@/lib/constants/theme-labels";

export function generateShareMarkdown(themes: ThemeType[], contexts: ContextType[], reflection: string): string {
  const themeList = themes.map(t => `* ${THEME_LABELS[t] || t}`).join("\n");
  const contextList = contexts.map(c => `* ${CONTEXT_LABELS[c] || c}`).join("\n");

  return `# 今日の余白

テーマ
${themeList}

文脈
${contextList}

気づいたこと
${reflection}

#YOHAKU`;
}