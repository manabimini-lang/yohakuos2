import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YuiHome } from "@/components/yui/YuiHome";

export const metadata: Metadata = {
  title: "YUI",
  description: "YUI Personal OS の試作基盤",
};

export const dynamic = "force-dynamic";

export default async function YuiPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?redirect=/yui");
  }

  return <YuiHome displayName={session.user.name ?? null} />;
}
