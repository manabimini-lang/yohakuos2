import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateApiKey } from "@/lib/ai/gemini";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  noStore();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json().catch(() => ({}));
    const { apiKey } = body;

    const options: { userId: string; apiKey?: string; modelName?: string } = {
      userId,
    };

    if (apiKey && apiKey !== "••••••••") {
      if (!apiKey.startsWith("AIza") && !apiKey.startsWith("AQ.") && apiKey.length < 20) {
        return NextResponse.json({
          connected: false,
          error: "無効なGemini APIキーの形式です（通常、AIza... または AQ... から始まります）。",
        }, { status: 400 });
      }
      options.apiKey = apiKey;
    }

    const result = await validateApiKey(options);

    return NextResponse.json({
      connected: result.connected,
      method: result.method,
      message: result.connected ? "静かに接続されました。" : undefined,
      error: result.error || null,
    });
  } catch (error: any) {
    console.error("[TEST_CONNECTION_ERROR]", error);
    return NextResponse.json({
      connected: false,
      error: error.message || "疎通確認中に内部エラーが発生しました。",
    }, { status: 500 });
  }
}
