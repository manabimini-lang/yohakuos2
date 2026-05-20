import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    await apiKeyRepository.delete(userId, "gemini_oauth");
    await apiKeyRepository.delete(userId, "gemini");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GEMINI_DISCONNECT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
