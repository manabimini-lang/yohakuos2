import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { decryptKey } from '@/lib/encryption';
import { normalizeGeminiApiKey } from './gemini-key';
import { normalizeGroqApiKey } from './groq-key';
import {
    AI_USAGE_GUARDRAILS,
    getAiMonthlyRequestLimit,
    hasPremiumAccess,
} from '@/lib/constants/plan';
import { Prisma } from '@prisma/client';
import {
    ECONOMY_GEMINI_MODEL,
    resolveGeminiModelName,
    STANDARD_GEMINI_MODEL,
    type AITaskClass,
} from './gemini-model-routing';
import { resolveGroqModelName } from './groq-model-routing';
import { providerFromStoredSetting, readUserApiKey } from './user-api-keys';
export { normalizeGeminiApiKey } from './gemini-key';
export { normalizeGroqApiKey } from './groq-key';

export type AICredentialSource = 'managed' | 'byok' | 'direct';
export type AIProviderName = 'gemini' | 'groq';
export type AICredentials = {
  apiKey: string;
  modelName: string;
  source: AICredentialSource;
  provider: AIProviderName;
};

export type AIRequestOptions = string | {
    userId?: string;
    apiKey?: string;
    provider?: AIProviderName;
    modelName?: string;
    useManaged?: boolean;
    /** @deprecated Retained for call-site compatibility; shared-key fallback is disabled. */
    allowEnvFallback?: boolean;
    taskClass?: AITaskClass;
};

// GEMINI_API_KEY is retained as a production compatibility name, but this
// value is resolved exclusively inside the Premium managed-credential path.
// Free users never receive or fall back to either server-owned key.
const MANAGED_GEMINI_API_KEY = process.env.MANAGED_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

async function incrementTokenUsage(userId: string, tokenCount: number) {
    try {
        await prisma.userAISettings.update({
            where: { userId },
            data: {
                dailyTokenUsage: { increment: tokenCount },
                monthlyTokenUsage: { increment: tokenCount },
            },
        });
    } catch (error) {
        console.error("[GEMINI] CRITICAL: failed to persist token usage", {
            userId,
            tokenCount,
            error: error instanceof Error ? error.message : error,
        });
    }
}

export async function reserveMonthlyRequest(userId?: string, modelName = ECONOMY_GEMINI_MODEL): Promise<string | undefined> {
    if (!userId) return undefined;
    if (process.env.NODE_ENV !== "production" && userId.startsWith("dev-")) return undefined;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const minuteStart = new Date(Date.now() - 60_000);

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { plan: true, role: true },
                });
                if (!user) throw new Error("ユーザーが見つかりません。");

                let settings = await tx.userAISettings.findUnique({ where: { userId } });
                if (!settings) {
                    settings = await tx.userAISettings.create({
                        data: {
                            userId,
                            provider: "gemini",
                            model: STANDARD_GEMINI_MODEL,
                            isEnabled: false,
                        },
                    });
                }

                const now = new Date();
                const lastReset = settings.lastUsageReset;
                const isDifferentDay = !lastReset
                    || now.getUTCDate() !== lastReset.getUTCDate()
                    || now.getUTCMonth() !== lastReset.getUTCMonth()
                    || now.getUTCFullYear() !== lastReset.getUTCFullYear();
                const isDifferentMonth = !lastReset
                    || now.getUTCMonth() !== lastReset.getUTCMonth()
                    || now.getUTCFullYear() !== lastReset.getUTCFullYear();
                const dailyTokenUsage = isDifferentDay ? 0 : settings.dailyTokenUsage;
                const monthlyTokenUsage = isDifferentMonth ? 0 : settings.monthlyTokenUsage;

                if (isDifferentDay || isDifferentMonth) {
                    await tx.userAISettings.update({
                        where: { userId },
                        data: {
                            dailyTokenUsage,
                            monthlyTokenUsage,
                            lastUsageReset: now,
                        },
                    });
                }

                if (dailyTokenUsage >= AI_USAGE_GUARDRAILS.DAILY_TOKEN_LIMIT) {
                    throw new Error(`本日のAI利用量上限（${AI_USAGE_GUARDRAILS.DAILY_TOKEN_LIMIT.toLocaleString()}トークン）に達しました。`);
                }
                if (monthlyTokenUsage >= AI_USAGE_GUARDRAILS.MONTHLY_TOKEN_LIMIT) {
                    throw new Error(`今月のAI利用量上限（${AI_USAGE_GUARDRAILS.MONTHLY_TOKEN_LIMIT.toLocaleString()}トークン）に達しました。`);
                }

                const monthlyRequestLimit = getAiMonthlyRequestLimit(user?.plan, user?.role);
                const [usage, recentUsage] = await Promise.all([
                    tx.yuiEvent.count({
                        where: { userId, eventType: "ai_request", occurredAt: { gte: monthStart } },
                    }),
                    tx.yuiEvent.count({
                        where: { userId, eventType: "ai_request", occurredAt: { gte: minuteStart } },
                    }),
                ]);
                if (usage >= monthlyRequestLimit) {
                    throw new Error(`今月のAI利用上限（${monthlyRequestLimit}回）に達しました。翌月までお待ちください。`);
                }
                if (recentUsage >= AI_USAGE_GUARDRAILS.MAX_REQUESTS_PER_MINUTE) {
                    throw new Error("AIへの送信が続いています。1分ほど待ってから、もう一度お試しください。");
                }

                // Reserve before sending the request. Serializable isolation makes
                // concurrent requests retry instead of both passing the same count.
                const reservation = await tx.yuiEvent.create({
                    data: {
                        userId,
                        eventType: "ai_request",
                        source: "gemini",
                        title: "AI request",
                        content: "",
                        metadata: { model: modelName, status: "reserved" },
                    },
                });
                return reservation.id;
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error) {
            const isWriteConflict = error instanceof Prisma.PrismaClientKnownRequestError
                && error.code === "P2034";
            if (!isWriteConflict || attempt === 2) throw error;
        }
    }
}

export async function releaseMonthlyRequest(reservationId?: string) {
    if (!reservationId) return;
    await prisma.yuiEvent.delete({ where: { id: reservationId } }).catch((error) => {
        console.error("[GEMINI] Failed to release request reservation", {
            reservationId,
            error: error instanceof Error ? error.message : error,
        });
    });
}

export async function completeMonthlyRequest(
    reservationId: string | undefined,
    userId: string | undefined,
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        model: string;
        credentialSource: AICredentialSource;
    },
) {
    if (userId) await incrementTokenUsage(userId, usage.totalTokens);
    if (!reservationId) return;
    await prisma.yuiEvent.update({
        where: { id: reservationId },
        data: { metadata: { status: "completed", ...usage } },
    }).catch((error) => console.error("[GEMINI] Failed to finalize request metadata", error));
}

function assertInputWithinLimit(prompt: string, systemInstruction?: string) {
    const inputCharacters = prompt.length + (systemInstruction?.length ?? 0);
    if (inputCharacters > AI_USAGE_GUARDRAILS.MAX_INPUT_CHARACTERS) {
        throw new Error(
            `AIに送る内容が長すぎます。合計${AI_USAGE_GUARDRAILS.MAX_INPUT_CHARACTERS.toLocaleString()}文字以内に短くしてください。`,
        );
    }
}

type ProviderGeneration = {
    text: string;
    usage?: { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number };
};

function tokenUsageFromResponse(
    response: ProviderGeneration,
    prompt: string,
    output: string,
    systemInstruction?: string,
): { inputTokens: number; outputTokens: number; totalTokens: number } {
    const usageMetadata = response.usage;
    const fallbackInput = Math.ceil((prompt.length + (systemInstruction?.length || 0)) / 4);
    const fallbackOutput = Math.ceil(output.length / 4);
    const inputTokens = usageMetadata?.promptTokenCount ?? fallbackInput;
    const outputTokens = usageMetadata?.candidatesTokenCount
        ?? (usageMetadata?.totalTokenCount !== undefined
            ? Math.max(usageMetadata.totalTokenCount - inputTokens, 0)
            : fallbackOutput);
    const totalTokens = usageMetadata?.totalTokenCount ?? inputTokens + outputTokens;
    return { inputTokens, outputTokens, totalTokens };
}

function getManagedApiCredentials(taskClass: AITaskClass = 'economy'): AICredentials {
    if (!MANAGED_GEMINI_API_KEY) {
        throw new Error(
            'Premium用のAI接続が設定されていません。管理者へお問い合わせください。'
        );
    }

    return {
        apiKey: normalizeGeminiApiKey(MANAGED_GEMINI_API_KEY),
        modelName: resolveGeminiModelName(undefined, taskClass),
        source: 'managed',
        provider: 'gemini',
    };
}

export async function getApiCredentials(
    options?: AIRequestOptions
): Promise<AICredentials> {
    if (typeof options === 'string') {
        return getApiCredentialsFromUserId(options);
    }

    if (options?.useManaged) {
        return getManagedApiCredentials(options.taskClass);
    }

    if (options?.apiKey) {
        const provider = options.provider ?? 'gemini';
        return {
            apiKey: provider === 'groq' ? normalizeGroqApiKey(options.apiKey) : normalizeGeminiApiKey(options.apiKey),
            modelName: provider === 'groq'
                ? resolveGroqModelName(options.modelName, options.taskClass)
                : resolveGeminiModelName(options.modelName, options.taskClass),
            source: 'direct',
            provider,
        };
    }

    return getApiCredentialsFromUserId(
        options?.userId,
        options?.allowEnvFallback ?? false,
        options?.taskClass,
    );
}

export async function getUserOwnedApiCredentials(
    userId?: string,
    taskClass: AITaskClass = 'economy',
): Promise<AICredentials | null> {
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
            now.getUTCDate() !== lastReset.getUTCDate() ||
            now.getUTCMonth() !== lastReset.getUTCMonth() ||
            now.getUTCFullYear() !== lastReset.getUTCFullYear();

        const isDifferentMonth = !lastReset ||
            now.getUTCMonth() !== lastReset.getUTCMonth() ||
            now.getUTCFullYear() !== lastReset.getUTCFullYear();

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
            if (dailyUsage >= AI_USAGE_GUARDRAILS.DAILY_TOKEN_LIMIT) {
                throw new Error(`本日のAI利用量上限（${AI_USAGE_GUARDRAILS.DAILY_TOKEN_LIMIT.toLocaleString()}トークン）に達しました。`);
            }
            if (monthlyUsage >= AI_USAGE_GUARDRAILS.MONTHLY_TOKEN_LIMIT) {
                throw new Error(`今月のAI利用量上限（${AI_USAGE_GUARDRAILS.MONTHLY_TOKEN_LIMIT.toLocaleString()}トークン）に達しました。`);
            }

            const provider: AIProviderName = providerFromStoredSetting(settings.provider);
            const providerKey = await readUserApiKey(userId, provider).catch(() => null);
            const legacyKey = !providerKey && settings.encryptedApiKey
                ? provider === 'groq'
                    ? normalizeGroqApiKey(decryptKey(settings.encryptedApiKey))
                    : normalizeGeminiApiKey(decryptKey(settings.encryptedApiKey))
                : null;
            const decrypted = providerKey ?? legacyKey;
            if (decrypted) {
                const modelName = provider === 'groq'
                    ? resolveGroqModelName(settings.model, taskClass)
                    : resolveGeminiModelName(settings.model, taskClass);
                console.log("FOUND USER AI KEY FROM SETTINGS", {
                    userId,
                    provider,
                    model: modelName,
                });
                return {
                    apiKey: decrypted,
                    modelName,
                    source: 'byok',
                    provider,
                };
            }
        }
    }

    console.log("NO USER GEMINI CREDENTIALS FOUND", { userId });
    return null;
}

async function getApiCredentialsFromUserId(
    userId?: string,
    _allowEnvFallback = false,
    taskClass: AITaskClass = 'economy',
): Promise<AICredentials> {
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, role: true },
        });
        if (hasPremiumAccess(user?.plan, user?.role)) {
            const settings = await prisma.userAISettings.findUnique({ where: { userId } });
            if (settings?.provider?.startsWith('byok_')) {
                const credentials = await getUserOwnedApiCredentials(userId, taskClass);
                if (credentials) return credentials;
            }
            return getManagedApiCredentials(taskClass);
        }

        const credentials = await getUserOwnedApiCredentials(userId, taskClass);
        if (credentials) {
            return credentials;
        }

        throw new Error(
            "AI APIキーが設定されていません。設定画面からGeminiまたはGroqのユーザー固有キーを入力してください。"
        );
    }

    throw new Error("AI利用者を確認できません。ユーザーIDを指定してください。");
}

/**
 * AIクライアントを取得する。
 */
type TextClient = {
    generate: (prompt: string, systemInstruction: string | undefined, config: { temperature: number; maxOutputTokens: number }) => Promise<ProviderGeneration>;
};

async function getClient(
    options: AIRequestOptions | undefined,
    defaultTaskClass: AITaskClass,
): Promise<{ client: TextClient; modelName: string; source: AICredentialSource; provider: AIProviderName }> {
    const resolvedOptions = typeof options === 'string'
        ? { userId: options, taskClass: defaultTaskClass }
        : { ...options, taskClass: options?.taskClass ?? defaultTaskClass };
    const { apiKey, modelName, source, provider } = await getApiCredentials(resolvedOptions);
    console.log("CREATE AI CLIENT", {
        provider,
        modelName,
        hasApiKey: !!apiKey,
        source: typeof options === 'string' ? 'userId' : options?.apiKey ? 'direct' : 'env/user-settings',
    });
    if (provider === 'groq') {
        return {
            modelName, source, provider,
            client: {
                async generate(prompt, systemInstruction, config) {
                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: modelName,
                            messages: [
                                ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
                                { role: "user", content: prompt },
                            ],
                            temperature: config.temperature,
                            // GPT-OSS consumes completion tokens for reasoning as well as
                            // visible text. Keep a small floor so connection checks still
                            // have enough room to return their visible "OK" response.
                            max_completion_tokens: Math.max(config.maxOutputTokens, 64),
                            reasoning_effort: "low",
                            include_reasoning: false,
                        }),
                    });
                    if (!response.ok) {
                        const payload = await response.json().catch(() => null) as {
                            error?: { code?: string; type?: string };
                        } | null;
                        const providerCode = payload?.error?.code ?? payload?.error?.type ?? "unknown";
                        console.warn("[GROQ] API request failed", { status: response.status, code: providerCode, model: modelName });
                        throw new Error(`Groq API request failed (${response.status}, ${providerCode})`);
                    }
                    const data = await response.json() as {
                        choices?: Array<{ message?: { content?: string | null } }>;
                        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
                    };
                    const text = data.choices?.[0]?.message?.content?.trim();
                    if (!text) throw new Error("Groq API returned an empty response");
                    return {
                        text,
                        usage: {
                            promptTokenCount: data.usage?.prompt_tokens,
                            candidatesTokenCount: data.usage?.completion_tokens,
                            totalTokenCount: data.usage?.total_tokens,
                        },
                    };
                },
            },
        };
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    return {
        modelName, source, provider,
        client: {
            async generate(prompt, systemInstruction, config) {
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    systemInstruction: systemInstruction ? { role: 'user', parts: [{ text: systemInstruction }] } : undefined,
                    generationConfig: { temperature: config.temperature, maxOutputTokens: config.maxOutputTokens, topK: 32, topP: 0.95 },
                });
                const response = result.response;
                return { text: response.text(), usage: response.usageMetadata };
            },
        },
    };
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
    assertInputWithinLimit(prompt, systemInstruction);
    const { client, modelName, source, provider } = await getClient(options, 'economy');
    const userId = typeof options === 'string' ? options : options?.userId;
    const reservationId = await reserveMonthlyRequest(userId, modelName);

    try {
        const response = await client.generate(prompt, systemInstruction, { temperature: 0.3, maxOutputTokens: AI_USAGE_GUARDRAILS.MAX_OUTPUT_TOKENS });
        const generatedText = response.text;
        const tokenUsage = tokenUsageFromResponse(response, prompt, generatedText, systemInstruction);
        if (userId) await incrementTokenUsage(userId, tokenUsage.totalTokens);
        if (reservationId) {
            await prisma.yuiEvent.update({
                where: { id: reservationId },
                data: {
                    metadata: {
                        status: "completed",
                        model: modelName,
                        provider,
                        credentialSource: source,
                        inputTokens: tokenUsage.inputTokens,
                        outputTokens: tokenUsage.outputTokens,
                        totalTokens: tokenUsage.totalTokens,
                    },
                },
            }).catch((error) => console.error("[GEMINI] Failed to finalize request metadata", error));
        }

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/) || generatedText.match(/[\[{][\s\S]*[\]}]/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : generatedText;
        const data = JSON.parse(jsonStr.trim()) as T;

        return {
            data,
            usage: {
                text: generatedText,
                tokenUsed: tokenUsage.totalTokens,
                model: modelName,
            },
        };
    } catch (error) {
        // A failed user-facing operation does not consume the monthly request
        // allowance. Actual token usage is still retained for cost protection.
        await releaseMonthlyRequest(reservationId);
        throw error;
    }
}

export async function generateText(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions
): Promise<AIResponse> {
    assertInputWithinLimit(prompt, systemInstruction);
    const { client, modelName, source, provider } = await getClient(options, 'economy');
    const userId = typeof options === 'string' ? options : options?.userId;
    const reservationId = await reserveMonthlyRequest(userId, modelName);

    try {
        const response = await client.generate(prompt, systemInstruction, { temperature: 0.5, maxOutputTokens: AI_USAGE_GUARDRAILS.MAX_OUTPUT_TOKENS });
        const generatedText = response.text;
        const tokenUsage = tokenUsageFromResponse(response, prompt, generatedText, systemInstruction);
        if (userId) await incrementTokenUsage(userId, tokenUsage.totalTokens);
        if (reservationId) {
            await prisma.yuiEvent.update({
                where: { id: reservationId },
                data: {
                    metadata: {
                        status: "completed",
                        model: modelName,
                        provider,
                        credentialSource: source,
                        inputTokens: tokenUsage.inputTokens,
                        outputTokens: tokenUsage.outputTokens,
                        totalTokens: tokenUsage.totalTokens,
                    },
                },
            }).catch((error) => console.error("[GEMINI] Failed to finalize request metadata", error));
        }
        return { text: generatedText, tokenUsed: tokenUsage.totalTokens, model: modelName };
    } catch (error) {
        await releaseMonthlyRequest(reservationId);
        throw error;
    }
}

/**
 * APIキーの接続確認を行う。
 * 実際にGemini APIを呼び出して疎通を確認する。
 */
export async function validateApiKey(options?: AIRequestOptions): Promise<{
    connected: boolean;
    method: 'managed' | 'apikey' | 'oauth' | null;
    error?: string;
}> {
    try {
        const { client, source } = await getClient(options, 'economy');

        // A minimal real request verifies both the key and the selected provider.
        await client.generate('Reply with exactly OK.', undefined, { temperature: 0, maxOutputTokens: 16 });

        // 使用されたキーの種類を特定
        let method: 'managed' | 'apikey' | 'oauth' | null = null;
        const userId = typeof options === 'string' ? options : options?.userId;

        if (source === 'managed') {
            method = 'managed';
        } else if (typeof options === 'object' && options !== null && options.apiKey) {
            method = 'apikey';
        } else if (userId) {
            try {
                const settings = await prisma.userAISettings.findUnique({
                    where: { userId },
                });
                if (settings && settings.isEnabled) {
                    method = settings.provider === "gemini_oauth" ? 'oauth' : 'apikey';
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

export type AIAvailabilitySource =
    | "managed"
    | "user_ai_settings"
    | "gemini_oauth"
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
    const [user, settings] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, role: true },
        }),
        prisma.userAISettings.findUnique({ where: { userId } }),
    ]);

    if (hasPremiumAccess(user?.plan, user?.role)) {
        if (settings?.provider?.startsWith('byok_') && settings.isEnabled) {
            try {
                const provider = providerFromStoredSetting(settings.provider);
                const providerKey = await readUserApiKey(userId, provider);
                const legacyKey = !providerKey && settings.encryptedApiKey
                    ? provider === 'groq'
                        ? normalizeGroqApiKey(decryptKey(settings.encryptedApiKey))
                        : normalizeGeminiApiKey(decryptKey(settings.encryptedApiKey))
                    : null;
                if (!providerKey && !legacyKey) return { available: false, source: null };
                return { available: true, source: "user_ai_settings" };
            } catch {
                return { available: false, source: null };
            }
        }
        return { available: Boolean(MANAGED_GEMINI_API_KEY), source: MANAGED_GEMINI_API_KEY ? "managed" : null };
    }

    if (settings?.isEnabled) {
        try {
            const provider = providerFromStoredSetting(settings.provider);
            const providerKey = await readUserApiKey(userId, provider);
            const legacyKey = !providerKey && settings.encryptedApiKey
                ? provider === 'groq'
                    ? normalizeGroqApiKey(decryptKey(settings.encryptedApiKey))
                    : normalizeGeminiApiKey(decryptKey(settings.encryptedApiKey))
                : null;
            if (!providerKey && !legacyKey) return { available: false, source: null };
            return { available: true, source: settings.provider === "gemini_oauth" ? "gemini_oauth" : "user_ai_settings" };
        } catch {
            return { available: false, source: null };
        }
    }

    return { available: false, source: null };
}
