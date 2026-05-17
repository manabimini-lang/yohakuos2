import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AiChatClient } from "@/components/member/ai-chat-client";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionService } from "@/lib/services/subscription.service";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";

export const metadata = {
  title: "思考の整理 - YOHAKU",
  description: "静かな場所で、絡まった思考を整理します。",
};

export default async function AiPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch necessary data
  const user = await userRepository.findById(userId);
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const hasActiveSub = isAdmin || await subscriptionService.hasActiveSubscription(userId);
  
  const apiKeyRecord = await apiKeyRepository.findByUserIdAndProvider(userId, "gemini");
  const hasKey = !!apiKeyRecord?.encryptedKey;

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="px-1">
        <h1 className="text-xl font-medium text-slate-800">整理する</h1>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          今の状態をそのまま書いてみてください。
        </p>
      </div>

      <AiChatClient 
        hasKey={hasKey} 
        hasActiveSub={hasActiveSub} 
      />
    </div>
  );
}
