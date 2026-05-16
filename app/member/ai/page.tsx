import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AiClient } from "@/components/member/ai-client";

export const dynamic = "force-dynamic";

export default async function MemberAiPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
      encryptedGeminiKey: true,
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
        <h1 className="text-xl font-semibold text-slate-900">思考の整理</h1>
      </div>
      <AiClient isPaidMember={isPaidMember} hasKey={hasKey} />
    </div>
  );
}
