import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import { validateApiKey } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  noStore();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    // 実際にGemini APIを呼び出して疎通確認
    const result = await validateApiKey(userId);

    return NextResponse.json({
      connected: result.connected,
      method: result.method,
      expiresSoon: false,
      error: result.error || null,
    });

  } catch (error) {
    console.error("[GEMINI_STATUS]", error);
    return NextResponse.json({ connected: false, method: null, error: "Internal error" }, { status: 500 });
  }
}