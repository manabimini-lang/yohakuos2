import { GoogleGenerativeAI } from "@google/generative-ai";
import { YOHAKU_SYSTEM_PROMPT } from "@/lib/prompts/yohaku-system-prompt";

export interface AIProvider {
  generateResponse(apiKey: string, input: string): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  async generateResponse(apiKey: string, input: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: YOHAKU_SYSTEM_PROMPT,
    });

    try {
      const result = await model.generateContent(input);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("[GEMINI_ERROR]", error);
      throw new Error("AIからの応答の取得に失敗しました。少し時間を置いて、もう一度試してみてください。");
    }
  }
}
