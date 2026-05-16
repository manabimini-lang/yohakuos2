"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

export async function updateAiKeyAction(apiKey: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { ok: false, error: "Unauthorized" };
    }

    const encryptedGeminiKey = encryptKey(apiKey);

    await prisma.user.update({
      where: { email: session.user.email },
      data: { encryptedGeminiKey },
    });

    revalidatePath("/member/settings");
    revalidatePath("/member/ai");

    return { ok: true };
  } catch (error) {
    console.error("[UPDATE_AI_KEY]", error);
    return { ok: false, error: "Failed to save API key" };
  }
}
