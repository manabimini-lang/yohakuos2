import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { decryptKey } from '@/lib/encryption';

const GEMINI_MODEL = 'gemini-2.5-flash';

export type AIRequestOptions = string | {
    userId?: string;
    apiKey?: string;
    modelName?: string;
    allowEnvFallback?: boolean;
};

const STARTER_GEMINI_API_KEY = process.env.STARTER_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

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

function getFallbackApiCredentials(): { apiKey: string; modelName: string } {
    if (!STARTER_GEMINI_API_KEY) {
        throw new Error(
            'GEMINI APIキーが設定されていません。設定画面からAPIキーを入力するか、環境変数を設定してください。'
        );
    }

    return {
        apiKey: STARTER_GEMINI_API_KEY,
        modelName: GEMINI_MODEL,
    };
}

export async function getApiCredentials(
    options?: AIRequestOptions
): Promise<{ apiKey: string; modelName: string }> {
    if (typeof options === 'string') {
        return getApiCredentialsFromUserId(options);
    }

    if (options && (options.apiKey || options.modelName)) {
        return {
            apiKey: options.apiKey || STARTER_GEMINI_API_KEY || '',
            modelName: GEMINI_MODEL,
        };
    }

    return getApiCredentialsFromUserId(options?.userId, options?.allowEnvFallback ?? false);
}

export async function getUserOwnedApiCredentials(
    userId?: string
): Promise<{ apiKey: string; modelName: string } | null> {
    if (!userId) {
        return null;
    }

    console.log("LOAD USER OWNED GEMINI CREDENTIALS", { userId });
    const settings = await prisma.userAISettings.findUnique({
        where: { userId },
    });

    if (settings) {
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

        if (settings.isEnabled) {
            if (dailyUsage >= 100000) {
                throw new Error("本日の一日利用量制限（100,000トークン）に達しました。");
            }
            if (monthlyUsage >= 2000000) {
                throw new Error("当月の月間利用量制限（2,000,000トークン）に達しました。");
            }

            if (settings.encryptedApiKey) {
                const decrypted = decryptKey(settings.encryptedApiKey);
                console.log("FOUND USER GEMINI KEY FROM SETTINGS", {
                    userId,
                    model: GEMINI_MODEL,
                });
                return {
                    apiKey: decrypted,
                    modelName: GEMINI_MODEL,
                };
            }
        }
    }

    const keyRecord = await prisma.userApiKey.findUnique({
        where: {
            userId_apiProvider: {
                userId,
                apiProvider: "gemini",
            },
        },
    });

    if (keyRecord?.encryptedKey) {
        console.log("FOUND USER GEMINI KEY FROM LEGACY STORAGE", { userId });
        return {
            apiKey: decryptKey(keyRecord.encryptedKey),
            modelName: GEMINI_MODEL,
        };
    }

    console.log("NO USER GEMINI CREDENTIALS FOUND", { userId });
    return null;
}

async function getApiCredentialsFromUserId(userId?: string, allowEnvFallback = false): Promise<{ apiKey: string; modelName: string }> {
    if (userId) {
        const credentials = await getUserOwnedApiCredentials(userId);
        if (credentials) {
            return credentials;
        }

        if (allowEnvFallback) {
            return getFallbackApiCredentials();
        }

        throw new Error(
            "Gemini APIキーが設定されていません。設定画面からユーザー固有のAPIキーを入力してください。"
        );
    }

    return getFallbackApiCredentials();
}

/**
 * AIクライアントを取得する。
 */
async function getClient(options?: AIRequestOptions): Promise<{ client: GenerativeModel; modelName: string }> {
    const { apiKey } = await getApiCredentials(options);
    const modelName = GEMINI_MODEL;
    console.log("CREATE GEMINI CLIENT", {
        modelName,
        hasApiKey: !!apiKey,
        source: typeof options === 'string' ? 'userId' : options?.apiKey ? 'direct' : 'env/user-settings',
    });
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
        let method: 'env' | 'apikey' | 'oauth' | null = null;
        const userId = typeof options === 'string' ? options : options?.userId;

        if (typeof options === 'object' && options !== null && options.apiKey) {
            method = 'apikey';
        } else if (userId) {
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
                    const legacyRecord = await prisma.userApiKey.findUnique({
                        where: {
                            userId_apiProvider: { userId, apiProvider: "gemini" },
                        },
                    });

                    if (oauthRecord?.encryptedKey) {
                        method = 'oauth';
                    } else if (legacyRecord?.encryptedKey) {
                        method = 'apikey';
                    }
                }
            } catch {
                method = 'apikey';
            }
        } else if (process.env.GEMINI_API_KEY) {
            method = 'env';
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

export type AIAvailabilitySource =
    | "user_ai_settings"
    | "gemini_oauth"
    | "legacy_api_key"
    | "starter"
    | null;

export interface AIAvailabilityResult {
    available: boolean;
    source: AIAvailabilitySource;
}

/**
 * ユーザーAI利用可能判定（詳細ソース付き）
 * user_ai_settings.isEnabled / OAuth / Legacy の3つを書き辞数順で確認する。
 * Gemini APIへの実際の通信は行わない。
 */
export async function checkAIAvailability(userId: string): Promise<AIAvailabilityResult> {
    const settings = await prisma.userAISettings.findUnique({
        where: { userId },
    });
    if (settings?.isEnabled) {
        return { available: true, source: "user_ai_settings" };
    }

    const oauthRecord = await prisma.userApiKey.findUnique({
        where: { userId_apiProvider: { userId, apiProvider: "gemini_oauth" } },
    });
    if (oauthRecord?.encryptedKey) {
        return { available: true, source: "gemini_oauth" };
    }

    const legacyRecord = await prisma.userApiKey.findUnique({
        where: { userId_apiProvider: { userId, apiProvider: "gemini" } },
    });
    if (legacyRecord?.encryptedKey) {
        return { available: true, source: "legacy_api_key" };
    }

    return { available: false, source: null };
}