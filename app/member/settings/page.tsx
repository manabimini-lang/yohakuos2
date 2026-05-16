import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/member/settings-client";

export const dynamic = "force-dynamic";

export default async function MemberSettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
      encryptedGeminiKey: true,
      stripePriceId: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isPaidMember = user.role === "PAID_MEMBER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const hasKey = !!user.encryptedGeminiKey;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">設定</h1>
        <p className="mt-1 text-sm text-slate-600">
          会員プランとAPIキーの管理を行います。
        </p>
      </div>
      <SettingsClient 
        hasKey={hasKey} 
        isPaidMember={isPaidMember} 
        stripePriceId={user.stripePriceId || undefined} 
      />
    </div>
  );
}
