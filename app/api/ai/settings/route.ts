// app/api/ai/settings/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveAISettings } from "@/app/actions/ai-settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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
