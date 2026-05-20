"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { subscriptionService } from "@/lib/services/subscription.service";

export async function simulateSubscriptionAction(priceId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "ログインしてください。" };
    }
    const userId = session.user.id;

    // Create a mock active subscription and update user role/plan
    await subscriptionService.handleCheckoutCompleted(userId, {
      stripeCustomerId: `cus_mock_${Math.random().toString(36).substring(7)}`,
      stripeSubscriptionId: `sub_mock_${Math.random().toString(36).substring(7)}`,
      stripePriceId: priceId,
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year trial
    });

    revalidatePath("/member/settings");
    revalidatePath("/member");
    return { ok: true };
  } catch (error) {
    console.error("[SIMULATE_SUBSCRIPTION]", error);
    return { ok: false, error: "有料会員プランのシミュレーション処理に失敗しました。" };
  }
}
