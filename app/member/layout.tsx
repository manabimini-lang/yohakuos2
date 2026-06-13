import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import type { ReactNode } from "react";

import { MemberHeader } from "@/components/member/header";
import { auth } from "@/lib/auth";

export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col">
        <MemberHeader user={session.user} />
        <main className="flex-1 px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
