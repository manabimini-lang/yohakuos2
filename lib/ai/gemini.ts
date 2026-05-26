import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { decryptKey } from '@/lib/encryption';

const GEMINI_MODEL = 'gemini-2.0-flash-lite-preview-02-05';

export type AIRequestOptions = string | {
    userId?: string;
    apiKey?: string;
    modelName?: string;
};

async function incrementTokenUsage(userId: string, tokenCount: number) {
    try {
        await prisma.userAISettings.update({
            where: { userId },
            data: {
                dailyTokenUsage: { increment: tokenCount },
                monthlyTokenUsage: { increment: tokenCount },
            },
        });
    } catch (e) {
        // ignore errors if settings don't exist
    }
}

export async function getApiCredentials(
    options?: AIRequestOptions
): Promise<{ apiKey: string; modelName: string }> {
    if (typeof options === 'string') {
        return getApiCredentialsFromUserId(options);
    }

    if (options && (options.apiKey || options.modelName)) {
        return {
            apiKey: options.apiKey || process.env.GEMINI_API_KEY || '',
            modelName: options.modelName || GEMINI_MODEL,
        };
    }

    return getApiCredentialsFromUserId(options?.userId);
}

async function getApiCredentialsFromUserId(userId?: string): Promise<{ apiKey: string; modelName: string }> {
    // 1. Check new UserAISettings first
    if (userId) {
        try {
            const settings = await prisma.userAISettings.findUnique({
                where: { userId },
            });
            if (settings && settings.isEnabled) {
                // Reset daily/monthly token counts if period has rolled over
                const now = new Date();
                const lastReset = settings.lastUsageReset ? new Date(settings.lastUsageReset) : null;
                let dailyUsage = settings.dailyTokenUsage;
                let monthlyUsage = settings.monthlyTokenUsage;
                let needsUpdate = false;

                const isDifferentDay = !lastReset || 
                  now.getDate() !== lastReset.getDate() || 
                  now.getMonth() !== lastReset.getMonth() || 
                  now.getFullYear() !== lastReset.getFullYear();

                const isDifferentMonth = !lastReset || 
                  now.getMonth() !== lastReset.getMonth() || 
                  now.getFullYear() !== lastReset.getFullYear();

                if (isDifferentDay) {
                    dailyUsage = 0;
                    needsUpdate = true;
                }
                if (isDifferentMonth) {
                    monthlyUsage = 0;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await prisma.userAISettings.update({
                        where: { userId },
                        data: {
                            dailyTokenUsage: dailyUsage,
                            monthlyTokenUsage: monthlyUsage,
                            lastUsageReset: now,
                        },
                    }).catch(e => console.error("[GEMINI] Failed to reset token usage:", e));
                }

                // Enforce token usage limits
                if (dailyUsage >= 100000) {
                    throw new Error("本日の一日利用量制限（100,000トークン）に達しました。");
                }
                if (monthlyUsage >= 2000000) {
                    throw new Error("当月の月間利用量制限（2,000,000トークン）に達しました。");
                }

                if (settings.encryptedApiKey) {
                    const apiKey = decryptKey(settings.encryptedApiKey);
                    const modelName = settings.model || GEMINI_MODEL;
                    return { apiKey, modelName };
                }
            }
        } catch (error: any) {
            if (error.message && error.message.includes("利用量制限")) {
                throw error;
            }
            console.warn("[GEMINI] UserAISettings read failed:", error);
        }
    }

    // 2. Fallback to legacy UserApiKey
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
                const apiKey = decryptKey(keyRecord.encryptedKey);
                return { apiKey, modelName: GEMINI_MODEL };
            }
        } catch (error) {
            console.warn("[GEMINI] UserApiKey read failed:", error);
        }
    }

    // 3. Fallback to process.env.GEMINI_API_KEY
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
        return { apiKey: envKey, modelName: GEMINI_MODEL };
    }

    throw new Error('GEMINI_API_KEY が設定されていません。設定画面からAPIキーを入力するか、環境変数を設定してください。');
}

/**
 * AIクライアントを取得する。
 */
async function getClient(options?: AIRequestOptions): Promise<{ client: GenerativeModel; modelName: string }> {
    const { apiKey, modelName } = await getApiCredentials(options);
    const genAI = new GoogleGenerativeAI(apiKey);
    const client = genAI.getGenerativeModel({ model: modelName });
    return { client, modelName };
}

export interface AIResponse {
    text: string;
    tokenUsed: number;
    model: string;
}

export async function generateJSON<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions
): Promise<{ data: T; usage: AIResponse }> {
    const { client, modelName } = await getClient(options);

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

    // Track usage
    const userId = typeof options === 'string' ? options : options?.userId;
    if (userId) {
        incrementTokenUsage(userId, tokenUsed).catch(err => {
            console.error("[GEMINI] Failed to increment token usage:", err);
        });
    }

    return {
        data,
        usage: {
            text,
            tokenUsed,
            model: modelName,
        },
    };
}

export async function generateText(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions
): Promise<AIResponse> {
    const { client, modelName } = await getClient(options);

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

    // Track usage
    const userId = typeof options === 'string' ? options : options?.userId;
    if (userId) {
        incrementTokenUsage(userId, tokenUsed).catch(err => {
            console.error("[GEMINI] Failed to increment token usage:", err);
        });
    }

    return { text, tokenUsed, model: modelName };
}

/**
 * APIキーの接続確認を行う。
 * 実際にGemini APIを呼び出して疎通を確認する。
 */
export async function validateApiKey(options?: AIRequestOptions): Promise<{
    connected: boolean;
    method: 'env' | 'apikey' | 'oauth' | null;
    error?: string;
}> {
    try {
        const { apiKey } = await getApiCredentials(options);
        const testClient = new GoogleGenerativeAI(apiKey);
        const testModel = testClient.getGenerativeModel({ model: GEMINI_MODEL });

        // 軽量なテスト呼び出し
        await testModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 1 },
        });

        // 使用されたキーの種類を特定
        let method: 'env' | 'apikey' | 'oauth' | null = 'apikey';
        if (typeof options === 'object' && options !== null && options.apiKey) {
            method = 'apikey';
        } else if (process.env.GEMINI_API_KEY) {
            method = 'env';
        } else {
            const userId = typeof options === 'string' ? options : options?.userId;
            if (userId) {
                try {
                    const settings = await prisma.userAISettings.findUnique({
                        where: { userId },
                    });
                    if (settings && settings.isEnabled) {
                        method = 'apikey';
                    } else {
                        const oauthRecord = await prisma.userApiKey.findUnique({
                            where: {
                                userId_apiProvider: { userId, apiProvider: "gemini_oauth" },
                            },
                        });
                        if (oauthRecord?.encryptedKey) {
                            method = 'oauth';
                        }
                    }
                } catch {
                    method = 'apikey';
                }
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