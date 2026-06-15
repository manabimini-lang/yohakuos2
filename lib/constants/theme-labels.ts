import { ThemeType, ContextType } from "@prisma/client";

export const THEME_LABELS: Record<ThemeType, string> = {
  WORK: "仕事",
  LEARNING: "学習",
  HEALTH: "健康",
  FAMILY: "家族",
  PARENTING: "子育て",
  SIDEBUSINESS: "副業",
  CREATION: "創作",
  AI: "AI",
  ENGLISH: "英語",
  HOBBY: "趣味",
  OTHER: "その他",
};

export const CONTEXT_LABELS: Record<ContextType, string> = {
  LEARNING: "学び",
  CONTINUITY: "継続",
  CHALLENGE: "挑戦",
  CREATION: "創造",
  EXPLORATION: "探究",
  HEALTH: "健康",
  FAMILY: "家族",
  WORK: "仕事",
  SHARING: "発信",
  REFLECTION: "自己理解",
};

export function getThemeLabel(theme: ThemeType | null | undefined): string {
  return theme ? THEME_LABELS[theme] : THEME_LABELS.OTHER;
}

export function getContextLabel(context: ContextType | null | undefined): string {
  return context ? CONTEXT_LABELS[context] : CONTEXT_LABELS.REFLECTION;
}