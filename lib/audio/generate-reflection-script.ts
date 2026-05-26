import { resolveProvider } from "@/lib/ai/provider-resolver";

const AUDIO_REFLECTION_SYSTEM_PROMPT = `あなたはユーザーの過去の記録の空気を、静かに思い起こさせる存在です。
以下のルールを絶対に厳守してください：
- 最大90文字〜150文字程度の静かな短文を作成する（音声にした時に30秒〜1分程度になる長さ）。
- 説教、指導、自己啓発、結論、強い励ましは「完全に禁止」します。
- ポッドキャストのような元気なトーンや、AIアシスタントのような説明口調は避けてください。
- ユーザーに感情や「気づき」を押し付けないでください。
- 「夜の読書感」「間のある文章」を意識し、余韻を残してください。

良い出力例：
少し前に残していた言葉が、今の記録と静かに重なっています。
急いで整理しなくても、まだこのままで良いのかもしれません。`;

export async function generateReflectionScript(
  userId: string,
  recentMemories: string[],
  resurfacedMemories: string[] = []
): Promise<string | null> {
  try {
    const provider = await resolveProvider(userId);
    if (!provider) return null;

    const prompt = `
最近の記録:
${recentMemories.join("\n")}

浮かび上がった過去の記憶:
${resurfacedMemories.length > 0 ? resurfacedMemories.join("\n") : "なし"}

これらの言葉から漂う空気や共通する小さなテーマを掬い上げ、静かで間のある短いナレーション原稿を生成してください。
`;

    const script = await provider.generateInsight(AUDIO_REFLECTION_SYSTEM_PROMPT, prompt);
    return script || null;
  } catch (error) {
    console.error("Failed to generate audio reflection script:", error);
    return null;
  }
}
