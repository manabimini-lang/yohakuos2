import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AiChatClient } from "@/components/member/ai-chat-client";
import { userRepository } from "@/lib/repositories/user.repository";
import { apiKeyRepository } from "@/lib/repositories/api-key.repository";
import { prisma } from "@/lib/prisma";
import { PremiumInvitation } from "@/components/member/premium-invitation";

export const metadata = {
  title: "思考の整理 - YOHAKU",
  description: "静かな場所で、絡まった思考を整理します。",
};

import { hasPremiumAccess } from "@/lib/constants/plan";

export default async function AiPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch necessary data with try-catch fallback for offline/database pause scenarios
  let isPremium = false;
  let hasKey = false;

  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      redirect("/login");
    }
    isPremium = hasPremiumAccess(user.plan, user.role);

    const [apiKeyRecord, userAiSettings] = await Promise.all([
      apiKeyRepository.findByUserIdAndProvider(userId, "gemini"),
      prisma.userAISettings.findUnique({ where: { userId } }),
    ]);

    hasKey = !!(
      apiKeyRecord?.encryptedKey ||
      userAiSettings?.encryptedApiKey
    );
  } catch (error) {
    console.warn("Database connection failed, falling back to mock session for frontend demonstration:", error);
    isPremium = hasPremiumAccess(session.user.plan, session.user.role);
    hasKey = false;
  }

  if (!isPremium) {
    return <PremiumInvitation />;
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="px-1">
        <h1 className="text-xl font-medium text-slate-800 dark:text-slate-100">整理する</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          今の状態をそのまま書いてみてください。
        </p>
      </div>

      <AiChatClient 
        hasKey={hasKey} 
        hasActiveSub={true} 
      />
    </div>
  );
}
