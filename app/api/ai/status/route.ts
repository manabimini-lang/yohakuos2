import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAIAvailability } from "@/lib/ai/gemini";
import { ECONOMY_GEMINI_MODEL, STANDARD_GEMINI_MODEL } from "@/lib/ai/gemini-model-routing";
import { ECONOMY_GROQ_MODEL, STANDARD_GROQ_MODEL } from "@/lib/ai/groq-model-routing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Configuration status only. This endpoint deliberately never calls an AI provider. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const [settings, availability] = await Promise.all([
      prisma.userAISettings.findUnique({
        where: { userId: session.user.id },
        select: { provider: true, model: true, lastValidatedAt: true },
      }),
      checkAIAvailability(session.user.id),
    ]);
    const provider = availability.source === "managed"
      ? "gemini"
      : settings?.provider === "groq" || settings?.provider === "byok_groq"
        ? "groq"
        : "gemini";
    const models = provider === "groq"
      ? { economy: ECONOMY_GROQ_MODEL, standard: STANDARD_GROQ_MODEL }
      : { economy: ECONOMY_GEMINI_MODEL, standard: STANDARD_GEMINI_MODEL };
    return NextResponse.json({
      configured: availability.available,
      source: availability.source,
      provider,
      model: "automatic",
      models,
      lastValidatedAt: settings?.lastValidatedAt?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "AI設定を読み込めませんでした。" }, { status: 500 });
  }
}
