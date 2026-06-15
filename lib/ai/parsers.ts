import { ThemeType, ContextType } from "@prisma/client";

/**
 * ThemeType のバリデーション関数
 * 無効な値は ThemeType.OTHER へフォールバックします
 */
export function parseTheme(value: string | undefined | null): ThemeType {
  if (!value) return ThemeType.OTHER;
  
  const themeValues = Object.values(ThemeType) as string[];
  return themeValues.includes(value) ? (value as ThemeType) : ThemeType.OTHER;
}

/**
 * ContextType のバリデーション関数
 * 無効な値は ContextType.REFLECTION へフォールバックします
 */
export function parseContext(value: string | undefined | null): ContextType {
  if (!value) return ContextType.REFLECTION;

  const contextValues = Object.values(ContextType) as string[];
  return contextValues.includes(value) ? (value as ContextType) : ContextType.REFLECTION;
}