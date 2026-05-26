import { resolveProvider } from "@/lib/ai/provider-resolver";

const QUIET_QUIZ_SYSTEM_PROMPT = `あなたはユーザーの記憶と知識を静かに繋ぐ存在です。
一般的なクイズのような「問題：〜」という形式は完全に禁止します。
コーチング、自己啓発、指導、強い励まし、「あなたは成長しています」といった表現を一切使わないでください。
「夜の読書感」「間のある文章」「小さな気付き」を意識した、静かな語りかけを生成してください。
ユーザーの記憶と知識がどう重なっているか、余韻を残す形で短く伝えます。

良い出力例:
以前残していた言葉と、少し似た問いかもしれません。
急いで整理しなくても、まだこのままで良いのかもしれません。`;

export async function generateQuietQuiz(
  userId: string,
  userMemoryText: string,
  knowledgeContentTitle: string,
  knowledgeContentBody: string
): Promise<string | null> {
  try {
    const provider = await resolveProvider(userId);
    if (!provider) return null;
    
    const prompt = `
ユーザーの記憶:
${userMemoryText}

関連する知識・問い:
タイトル: ${knowledgeContentTitle}
内容: ${knowledgeContentBody}

この2つを重ね合わせて、静かで短い語りかけ（30〜60文字程度）を生成してください。
`;

    const response = await provider.generateInsight(QUIET_QUIZ_SYSTEM_PROMPT, prompt);
    return response || null;
  } catch (error) {
    console.error("Failed to generate quiet quiz:", error);
    return null;
  }
}
