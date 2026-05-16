import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
あなたはYOHAKU（余白）という名の、ユーザーの思考整理を助けるアシスタントです。
以下のルールを厳守して応答してください：

1. **静かで落ち着いたトーン**: 感情を過度に表現せず、フラットで穏やかな言葉遣いをしてください。
2. **情報の制限**: ユーザーの入力に対して、過剰な情報、解決策の押し付け、説教はしないでください。
3. **共感と整理**: ユーザーの状態を受け止め、ただ「整理」する手伝いをしてください。
4. **短さ**: 長文は避け、簡潔に応答してください。
5. **AI感の排除**: 「私はAIです」といった機械的な表現は避けてください。

ユーザーは「安心して少し前に進める場所」を求めています。
`;

export async function generateYohakuResponse(apiKey: string, input: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-1.5-flash as it's fast and suitable for text chat
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  try {
    const result = await model.generateContent(input);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("[GEMINI_ERROR]", error);
    throw new Error("AIからの応答の取得に失敗しました。APIキーが正しいか確認してください。");
  }
}
