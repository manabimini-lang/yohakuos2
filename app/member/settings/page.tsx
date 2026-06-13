import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionRepository } from "@/lib/repositories/subscription.repository";
import { subscriptionService } from "@/lib/services/subscription.service";
import { SettingsClient } from "@/components/member/settings-client";

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

  const subscription = await subscriptionRepository.findByUserId(userId);

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isPaidMember = isAdmin || await subscriptionService.hasActiveSubscription(userId);
  const stripePriceId = subscription?.stripePriceId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          あなただけの振り返り空間を整えます。
        </p>
      </div>
      <SettingsClient 
        isPaidMember={isPaidMember} 
        stripePriceId={stripePriceId || undefined} 
      />
    </div>
  );
}
