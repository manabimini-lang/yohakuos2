import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash-lite-preview-02-05'; // Gemini 3.1 Pro Low 相当

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getClient(): GenerativeModel {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    if (!model) {
        model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    }
    return model;
}

export interface AIResponse {
    text: string;
    tokenUsed: number;
    model: string;
}

export async function generateJSON<T>(
    prompt: string,
    systemInstruction?: string
): Promise<{ data: T; usage: AIResponse }> {
    const client = getClient();

    const result = await client.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction
            ? { role: 'user', parts: [{ text: systemInstruction }] }
            : undefined,
        generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 2048,
        },
    });

    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/{[\s\S]*?}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    const data = JSON.parse(jsonStr.trim()) as T;

    // Token estimation (approximate)
    const tokenUsed = Math.ceil((prompt.length + text.length) / 4);

    return {
        data,
        usage: {
            text,
            tokenUsed,
            model: GEMINI_MODEL,
        },
    };
}

export async function generateText(
    prompt: string,
    systemInstruction?: string
): Promise<AIResponse> {
    const client = getClient();

    const result = await client.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction
            ? { role: 'user', parts: [{ text: systemInstruction }] }
            : undefined,
        generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
        },
    });

    const response = result.response;
    const text = response.text();
    const tokenUsed = Math.ceil((prompt.length + text.length) / 4);

    return { text, tokenUsed, model: GEMINI_MODEL };
}