import { generateText } from "@/lib/ai/gemini";
import { WisdomInsightType, ReflectionTheme } from "@prisma/client";

interface WisdomGeneratorParams {
  type: WisdomInsightType;
  userContext: Record<string, number>;
  snapshot: any;
  patternTheme: ReflectionTheme | null;
}

export async function generateWisdomContent(params: WisdomGeneratorParams) {
  const { type, userContext, snapshot, patternTheme } = params;

  const prompt = `あなたは「YOHAKU」の Wisdom Engine です。
個人の哲学パターンとコミュニティ全体の空気感（Snapshot）を照らし合わせ、静かな気づきを提供してください。

【条件】
・トーン：静か、柔らかい、観察的、非評価的。
・絶対に説教、指導、コーチング、ランキング、他者比較を行わない。
・「鏡」のように、事実と傾向を伝えるだけ。

【状況】
インサイト種別: ${type}
コミュニティのテーマ: ${snapshot.dominantTheme}
コミュニティの要約: ${snapshot.summary}
ユーザーの哲学分布: ${JSON.stringify(userContext)}
継続パターン: ${patternTheme || "なし"}

【出力形式】
JSONのみ:
{
  "title": "短いタイトル",
  "content": "内省を促す優しい文章（3-4行）",
  "type": "${type}"
}`;

  const response = await generateText(prompt, "あなたは静かなコミュニティの観察者です。");
  
  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response parse error");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Fallback logic
    return {
      title: "今週の静かな響き",
      content: "最近のコミュニティでは、それぞれのペースで歩みを進める姿が見られます。あなたの内側にあるリズムを、大切にしてください。",
      type
    };
  }
}