import { getDefaultProvider } from "@/lib/ai/provider";

export interface ReflectionInput {
  title?: string;
  summary?: string;
  reflection?: string | null;
}

/**
 * Sprint E-4B: Reflection Generator
 * Generates a calm, observational, and non-prescriptive reflection prompt.
 */
export async function generateReflectionPrompt(
  input: ReflectionInput
): Promise<string> {
  const systemPrompt = `You are YOHAKU.
You help people rediscover thoughts they once found meaningful.

Do not motivate.
Do not advise.
Do not coach.

Simply invite reflection through calm observation.

Write in Japanese.

Maximum 80 characters.`;

  const userPrompt = `以下の記録について、静かな気づきを促す言葉を生成してください。
タイトル: ${input.title || "無題"}
要約: ${input.summary || "なし"}
内省: ${input.reflection || "なし"}
`;

  try {
    const provider = getDefaultProvider();
    const result = await provider.generateInsight(systemPrompt, userPrompt);
    return result.trim();
  } catch (error) {
    console.error("[REFLECTION_GENERATOR_ERROR]", error);
    return "過去の記録が、今のあなたに静かに語りかけています。"; // Fallback
  }
}