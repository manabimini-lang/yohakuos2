import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";
import { decryptKey } from "@/lib/encryption";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  noStore();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const oauthKeyRecord = await apiKeyRepository.findByUserIdAndProvider(userId, "gemini_oauth");
    const legacyKeyRecord = await apiKeyRepository.findByUserIdAndProvider(userId, "gemini");

    let method: "oauth" | "apikey" | null = null;
    let expiresSoon = false;

    if (oauthKeyRecord?.encryptedKey) {
      method = "oauth";
      try {
        const decryptedPayload = decryptKey(oauthKeyRecord.encryptedKey);
        const tokenData = JSON.parse(decryptedPayload);
        if (Date.now() >= tokenData.expires_at - 5 * 60 * 1000) {
          expiresSoon = true;
        }
      } catch (e) {
        method = null;
      }
    } else if (legacyKeyRecord?.encryptedKey) {
      method = "apikey";
    }

    return NextResponse.json({
      connected: method !== null,
      method,
      expiresSoon,
    });

  } catch (error) {
    console.error("[GEMINI_STATUS]", error);
    return NextResponse.json({ connected: false, method: null }, { status: 500 });
  }
}
