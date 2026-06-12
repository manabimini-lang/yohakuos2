import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "@/components/settings/account-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YOHAKU - 外部サービス連携",
  description: "Discord等の外部サービス連携設定",
};

export default async function MemberAccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      discordId: true,
      discordName: true,
      discordAvatar: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-100 flex items-center justify-center">
      <AccountClient
        discordId={user?.discordId || null}
        discordName={user?.discordName || null}
        discordAvatar={user?.discordAvatar || null}
      />
    </div>
  );
}
