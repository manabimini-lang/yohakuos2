import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { decryptKey } from '@/lib/encryption';

const GEMINI_MODEL = 'gemini-2.0-flash-lite-preview-02-05'; // Gemini 3.1 Pro Low 相当

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

/**
 * APIキーを取得する。
 * 優先順位: 環境変数 > ユーザー設定 (DB)
 */
async function getApiKey(userId?: string): Promise<string> {
    // 1. 環境変数があればそれを優先
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) return envKey;

    // 2. ユーザーIDが指定されていればDBから取得
    if (userId) {
        try {
            const keyRecord = await prisma.userApiKey.findUnique({
                where: {
                    userId_apiProvider: {
                        userId,
                        apiProvider: "gemini",
                    },
                },
            });

            if (keyRecord?.encryptedKey) {
                return decryptKey(keyRecord.encryptedKey);
            }

            // OAuth keyも試す
            const oauthRecord = await prisma.userApiKey.findUnique({
                where: {
                    userId_apiProvider: {
                        userId,
                        apiProvider: "gemini_oauth",
                    },
                },
            });

            if (oauthRecord?.encryptedKey) {
                try {
                    const decrypted = decryptKey(oauthRecord.encryptedKey);
                    const tokenData = JSON.parse(decrypted);
                    if (tokenData.access_token && Date.now() < tokenData.expires_at) {
                        return tokenData.access_token;
                    }
                } catch {
                    // OAuthトークンが無効な場合は無視
                }
            }
        } catch (error) {
            console.warn("[GEMINI] DBからのキー取得に失敗:", error);
        }
    }

    throw new Error('GEMINI_API_KEY が設定されていません。設定画面からAPIキーを入力するか、環境変数を設定してください。');
}

/**
 * AIクライアントを取得する。
 * userIdを指定すると、そのユーザーのAPIキーをDBから読み込む。
 */
async function getClient(userId?: string): Promise<GenerativeModel> {
    const apiKey = await getApiKey(userId);

    // キャッシュをリセット（キーが変わった可能性があるため）
    if (genAI) {
        genAI = null;
        model = null;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    return model;
}

export interface AIResponse {
    text: string;
    tokenUsed: number;
    model: string;
}

export async function generateJSON<T>(
    prompt: string,
    systemInstruction?: string,
    userId?: string
): Promise<{ data: T; usage: AIResponse }> {
    const client = await getClient(userId);

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
    systemInstruction?: string,
    userId?: string
): Promise<AIResponse> {
    const client = await getClient(userId);

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

/**
 * APIキーの接続確認を行う。
 * 実際にGemini APIを呼び出して疎通を確認する。
 */
export async function validateApiKey(userId?: string): Promise<{
    connected: boolean;
    method: 'env' | 'apikey' | 'oauth' | null;
    error?: string;
}> {
    try {
        const apiKey = await getApiKey(userId);
        const testClient = new GoogleGenerativeAI(apiKey);
        const testModel = testClient.getGenerativeModel({ model: GEMINI_MODEL });

        // 軽量なテスト呼び出し
        await testModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 1 },
        });

        // 使用されたキーの種類を特定
        let method: 'env' | 'apikey' | 'oauth' | null = 'apikey';
        if (process.env.GEMINI_API_KEY) {
            method = 'env';
        } else if (userId) {
            try {
                const oauthRecord = await prisma.userApiKey.findUnique({
                    where: {
                        userId_apiProvider: { userId, apiProvider: "gemini_oauth" },
                    },
                });
                if (oauthRecord?.encryptedKey) {
                    method = 'oauth';
                }
            } catch {
                method = 'apikey';
            }
        }

        return { connected: true, method };
    } catch (error: any) {
        return {
            connected: false,
            method: null,
            error: error.message || 'APIキーの検証に失敗しました',
        };
    }
}