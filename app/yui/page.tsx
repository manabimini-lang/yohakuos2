import type { Metadata } from "next";
import { requireSession } from "@/core/auth/server";
import { redirect } from "next/navigation";
import { YuiHome } from "@/components/yui/YuiHome";

export const metadata: Metadata = {
  title: "YUI",
  description: "YUI Personal OS の試作基盤",
};

export const dynamic = "force-dynamic";

export default async function YuiPage() {
  const session = await requireSession("/login?redirect=/yui");

  if (!session?.id) {
    redirect("/login?redirect=/yui");
  }

  return <YuiHome displayName={session.profile?.displayName ?? null} />;
}
