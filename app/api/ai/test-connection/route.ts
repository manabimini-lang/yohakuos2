import { NextResponse } from "next/server";
import { getCurrentSession } from "@/core/auth/server";
import { validateApiKey } from "@/lib/ai/gemini";
import { normalizeGeminiApiKey } from "@/lib/ai/gemini-key";
import { normalizeGroqApiKey } from "@/lib/ai/groq-key";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { readUserApiKey } from "@/lib/ai/user-api-keys";

export const dynamic = "force-dynamic";

function toUserFacingAiError(error: string | null | undefined) {
  const detail = error ?? "";
  if (/429|quota|resource_exhausted|rate.?limit/i.test(detail)) {
    return "Groqの利用上限に達している可能性があります。少し時間をおいて再度お試しください。基本機能は通常どおり使えます。";
  }
  if (/api.?key|invalid.?key|unauthenticated|401|403/i.test(detail)) {
    return "AIの接続設定を確認してください。基本機能は通常どおり使えます。";
  }
  if (/prisma|database server|postgresql:/i.test(detail)) {
    return "AI設定の保存先に接続できません。接続を確認してからもう一度お試しください。";
  }
  return "AI文章生成は一時的に利用できません。基本機能は通常どおり使えます。";
}

export async function POST(req: Request) {
  noStore();
  try {
    const session = await getCurrentSession();
    if (!session?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.id;

    const body = await req.json().catch(() => ({}));
    const { apiKey, provider: requestedProvider } = body;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, role: true },
    });
    const isPremium = hasPremiumAccess(user?.plan, user?.role);

    const testWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTests = await prisma.yuiEvent.count({
      where: {
        userId,
        eventType: "ai_connection_test",
        occurredAt: { gte: testWindowStart },
      },
    });
    if (recentTests >= 5) {
      return NextResponse.json({
        connected: false,
        error: "接続テストは1日5回までです。時間をおいて再度お試しください。",
      }, { status: 429 });
    }
    await prisma.yuiEvent.create({
      data: {
        userId,
        eventType: "ai_connection_test",
        source: isPremium ? "managed" : "byok",
        title: "AI connection test",
        content: "",
      },
    });

    const provider = requestedProvider === "groq" ? "groq" : "gemini";
    const options: { userId: string; apiKey?: string; modelName?: string; provider?: "gemini" | "groq"; useManaged?: boolean } = {
      userId,
    };
    if (isPremium && requestedProvider === "managed") options.useManaged = true;

    if (!options.useManaged && apiKey && apiKey !== "••••••••") {
      try {
        options.apiKey = provider === "groq" ? normalizeGroqApiKey(apiKey) : normalizeGeminiApiKey(apiKey);
        options.provider = provider;
      } catch (error) {
        return NextResponse.json({
          connected: false,
          error: error instanceof Error ? error.message : "APIキーの形式が無効です。",
        }, { status: 400 });
      }
    }
    if ((!apiKey || apiKey === "••••••••") && (provider === "gemini" || provider === "groq") && !options.useManaged) {
      const savedKey = await readUserApiKey(userId, provider).catch(() => null);
      if (savedKey) {
        options.apiKey = savedKey;
        options.provider = provider;
      }
    }

    const result = await validateApiKey(options);
    if (!result.connected) {
      console.warn("[AI_CONNECTION_TEST] provider validation failed", {
        provider: options.useManaged ? "managed" : provider,
        reason: result.error ?? "unknown",
      });
    }
    const safeError = result.connected ? null : toUserFacingAiError(result.error);

    if (result.connected) {
      await prisma.userAISettings.update({
        where: { userId },
        data: { lastValidatedAt: new Date() },
      }).catch(() => undefined);
    }

    return NextResponse.json({
      connected: result.connected,
      method: result.method,
      message: result.connected ? "静かに接続されました。" : undefined,
      error: safeError,
    });
  } catch (error: any) {
    console.error("[TEST_CONNECTION_ERROR]", error);
    return NextResponse.json({
      connected: false,
      error: "AI設定の保存先に接続できません。接続を確認してからもう一度お試しください。",
    }, { status: 500 });
  }
}
