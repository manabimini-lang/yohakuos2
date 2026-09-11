// app/api/ai/settings/route.ts
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/core/auth/server";
import { saveAISettings } from "@/app/actions/ai-settings";
import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/encryption";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { normalizeByokKey, providerFromStoredSetting, readUserApiKey, type ByokProvider } from "@/lib/ai/user-api-keys";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [settings, user] = await Promise.all([
      prisma.userAISettings.findUnique({
        where: { userId: session.id },
        select: { provider: true, model: true, isEnabled: true, encryptedApiKey: true },
      }),
      prisma.user.findUnique({ where: { id: session.id }, select: { plan: true, role: true } }),
    ]);
    const isPremium = hasPremiumAccess(user?.plan, user?.role);
    const requestUrl = new URL(req.url);
    const reveal = requestUrl.searchParams.get("reveal") === "true";
    const revealProvider = requestUrl.searchParams.get("provider") === "groq" ? "groq" : "gemini";
    const [savedGeminiKey, savedGroqKey] = await Promise.all([
      readUserApiKey(session.id, "gemini").catch(() => null),
      readUserApiKey(session.id, "groq").catch(() => null),
    ]);
    const legacyProvider = providerFromStoredSetting(settings?.provider);
    const legacyKey = settings?.encryptedApiKey
      ? normalizeByokKey(legacyProvider, decryptKey(settings.encryptedApiKey))
      : null;
    const keys: Record<ByokProvider, string | null> = {
      gemini: savedGeminiKey ?? (legacyProvider === "gemini" ? legacyKey : null),
      groq: savedGroqKey ?? (legacyProvider === "groq" ? legacyKey : null),
    };
    const provider = isPremium
      ? settings?.provider === "byok_groq" ? "groq" : settings?.provider === "byok_gemini" ? "gemini" : "managed"
      : settings?.provider === "groq" ? "groq" : "gemini";
    const activeKey = provider === "gemini" || provider === "groq" ? keys[provider] : null;

    return NextResponse.json(
      {
        provider,
        model: settings?.model ?? "gemini-2.5-flash",
        isEnabled: isPremium || (settings?.isEnabled ?? false),
        managed: isPremium && provider === "managed",
        hasKey: Boolean(activeKey),
        lastFour: activeKey?.slice(-4) ?? null,
        keys: {
          gemini: { hasKey: Boolean(keys.gemini), lastFour: keys.gemini?.slice(-4) ?? null },
          groq: { hasKey: Boolean(keys.groq), lastFour: keys.groq?.slice(-4) ?? null },
        },
        apiKey: reveal ? keys[revealProvider] : null,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("[AI_SETTINGS_READ_ERROR]", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "AI接続設定の読み込みに失敗しました。" },
      { status: 500, headers: { "Cache-Control": "no-store, private" } },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const { provider, apiKey, isEnabled } = body;
    // Directly invoke the server action (server‑side) to reuse validation & DB logic
    const result = await saveAISettings({ provider, apiKey, isEnabled });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[AI_SETTINGS_SAVE_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message ?? "保存に失敗しました" }, { status: 500 });
  }
}
