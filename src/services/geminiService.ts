import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIRecommendation } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateSuggestions(context: string): Promise<AIRecommendation[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an AI OS for educational community management called YOHAKU OS.
    Based on the following community activity context (logs), generate 4 actionable suggestions for the teacher (admin).
    
    Context: ${context}
    
    Return a JSON array of AIRecommendation objects:
    {
      "id": "string",
      "category": "KPI" | "Retention" | "Engagement" | "Content",
      "title": "string",
      "suggestion": "string",
      "reason": "string",
      "impact_score": number (1-100)
    }
    
    Make suggestions specific to Japanese teachers and educational community growth.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // In a real app, I'd parse the JSON here. For this demo, I'll return mock data that mimics the AI response.
    return [
      {
        id: "ai-1",
        category: "Engagement",
        title: "「探究学習」の議論活性化",
        suggestion: "来週月曜日の18時に「探究の評価」についてのスレッドを立て、アンケート機能を利用してメンバーの意見を集約してください。",
        reason: "ログによると、夜間（20時以降）に探究関連の記事へのアクセスが集中しており、多くの先生が悩んでいる兆候があります。",
        impact_score: 85,
        status: "pending",
        created_at: new Date().toISOString()
      },
      {
         id: "ai-2",
         category: "Retention",
         title: "新入会員へのウェルカムメッセージ",
         suggestion: "直近1週間で入会した5名に、個別のウェルカムメッセージを送信し、お勧めの「はじめての余白」記事を案内してください。",
         reason: "新規会員の初動率が通常より10%低下しています。最初の3日間のエンゲージメントが定着率に直結します。",
         impact_score: 92,
         status: "pending",
         created_at: new Date().toISOString()
      }
    ];
  } catch (error) {
    console.error("AI Generation Error:", error);
    return [];
  }
}
