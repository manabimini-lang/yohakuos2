import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";
import { subscriptionRepository } from "@/lib/repositories/subscription.repository";
import { subscriptionService } from "@/lib/services/subscription.service";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/member/settings-client";
import { checkAIAvailability } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export default async function MemberSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const user = await userRepository.findById(userId);

  if (!user) {
    redirect("/login");
  }

  const [aiResult, subscription] = await Promise.all([
    checkAIAvailability(userId),
    subscriptionRepository.findByUserId(userId),
  ]);

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isPaidMember = isAdmin || await subscriptionService.hasActiveSubscription(userId);
  const hasKey = aiResult.available;
  const stripePriceId = subscription?.stripePriceId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-slate-900">設定</h1>
        <p className="mt-1 text-sm text-slate-500">
          あなただけの振り返り空間を整えます。
        </p>
      </div>
      <SettingsClient 
        hasKey={hasKey} 
        isPaidMember={isPaidMember} 
        stripePriceId={stripePriceId || undefined} 
      />
    </div>
  );
}
