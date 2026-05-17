import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import type { ReactNode } from "react";

import { MemberHeader } from "@/components/member/header";
import { MemberSidebar } from "@/components/member/sidebar";
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1120px]">
        <MemberSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MemberHeader user={session.user} />
          <main className="flex-1 px-4 py-8 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
