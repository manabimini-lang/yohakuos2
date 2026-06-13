import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/components/admin/sidebar";
import { auth } from "@/lib/auth";
import { extractPermissionsFromSession, hasMinRoleLevel } from "@/lib/permissions/helpers";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Use RBAC permission-based check
  const extracted = extractPermissionsFromSession(session);
  if (!extracted || !hasMinRoleLevel(extracted.roles, "admin")) {
    redirect("/member");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader user={session.user} />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}