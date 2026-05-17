import { GeminiProvider, AIProvider } from "@/lib/ai/providers/gemini.provider";

export class AIService {
  private providers: Record<string, AIProvider>;

  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      // Future: openai: new OpenAIProvider(),
    };
  }

  async createAIResponse(providerName: string, apiKey: string, input: string): Promise<string> {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`未対応のAIプロバイダです: ${providerName}`);
    }

    return provider.generateResponse(apiKey, input);
  }
}

export const aiService = new AIService();
