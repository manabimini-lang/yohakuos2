import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
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
      <main className="mx-auto min-h-screen max-w-[1120px] px-4 py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
